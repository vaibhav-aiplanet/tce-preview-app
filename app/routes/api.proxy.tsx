import type { Route } from "./+types/api.proxy";
import { env } from "~/lib/env";
import {
  parseAuthCookies,
  buildAccessCookieHeader,
  buildRefreshCookieHeader,
  buildClearCookieHeaders,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "~/lib/auth-cookies";
import { tryRefresh } from "~/lib/server-auth";

export async function loader({ request, params }: Route.LoaderArgs) {
  return proxy(request, params);
}

export async function action({ request, params }: Route.ActionArgs) {
  return proxy(request, params);
}

const REQUEST_HEADERS_TO_STRIP = new Set([
  "host",
  "connection",
  "content-length",
  "authorization",
]);

const INTERNAL_COOKIES = new Set([ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]);

// Remove our own auth cookies from the forwarded Cookie header so the LMS
// only sees its own session cookies (e.g. JSESSIONID, ctoken used by the
// TCE clientid/token flow). Returns the filtered header or null if nothing
// is left to forward.
function filterCookieHeader(value: string | null): string | null {
  if (!value) return null;
  const kept = value
    .split(";")
    .map((p) => p.trim())
    .filter((p) => {
      const eq = p.indexOf("=");
      const name = eq < 0 ? p : p.slice(0, eq);
      return !INTERNAL_COOKIES.has(name);
    });
  return kept.length > 0 ? kept.join("; ") : null;
}

const RESPONSE_HEADERS_TO_STRIP = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
  "keep-alive",
]);

async function proxy(request: Request, params: { "*"?: string }) {
  const subpath = params["*"] ?? "";
  const url = new URL(request.url);
  const target = `${env.api_proxy_target}/api/${subpath}${url.search}`;

  const { accessToken, refreshToken } = parseAuthCookies(request);

  if (!accessToken && !refreshToken) {
    return new Response(JSON.stringify({ error: "Unauthenticated" }), {
      status: 401,
      headers: appendJsonHeaders(new Headers()),
    });
  }

  let body: BodyInit | undefined;
  let cachedBody: ArrayBuffer | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    cachedBody = await request.arrayBuffer();
    body = cachedBody;
  }

  let refreshedAccess: string | null = null;
  let refreshedRefresh: string | null = null;
  let refreshedExpiresIn: number | undefined;

  let resp: Response;
  if (accessToken) {
    resp = await forward(target, request, accessToken, body);
  } else {
    resp = new Response(null, { status: 401 });
  }

  if (resp.status === 401 && refreshToken) {
    const refreshed = await tryRefresh(refreshToken);
    if (refreshed) {
      refreshedAccess = refreshed.access_token;
      refreshedRefresh = refreshed.refresh_token;
      refreshedExpiresIn = refreshed.expires_in;
      resp = await forward(target, request, refreshedAccess, cachedBody);
    } else {
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 401,
        headers: appendJsonHeaders(buildClearCookieHeaders()),
      });
    }
  }

  const outHeaders = new Headers();
  for (const [key, value] of resp.headers) {
    if (RESPONSE_HEADERS_TO_STRIP.has(key.toLowerCase())) continue;
    outHeaders.append(key, value);
  }
  if (refreshedAccess) {
    outHeaders.append(
      "Set-Cookie",
      buildAccessCookieHeader(refreshedAccess, refreshedExpiresIn),
    );
  }
  if (refreshedRefresh) {
    outHeaders.append("Set-Cookie", buildRefreshCookieHeader(refreshedRefresh));
  }

  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: outHeaders,
  });
}

async function forward(
  target: string,
  request: Request,
  accessToken: string | null,
  body: BodyInit | undefined,
): Promise<Response> {
  const headers = new Headers();
  for (const [key, value] of request.headers) {
    const lower = key.toLowerCase();
    if (REQUEST_HEADERS_TO_STRIP.has(lower)) continue;
    if (lower === "cookie") {
      const filtered = filterCookieHeader(value);
      if (filtered) headers.set("Cookie", filtered);
      continue;
    }
    headers.append(key, value);
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return fetch(target, {
    method: request.method,
    headers,
    body,
    redirect: "manual",
  });
}

function appendJsonHeaders(headers: Headers): Headers {
  headers.set("Content-Type", "application/json");
  return headers;
}
