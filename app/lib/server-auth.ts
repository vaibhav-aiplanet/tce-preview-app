import { redirect } from "react-router";
import { env } from "./env";
import {
  parseAuthCookies,
  buildAccessCookieHeader,
  buildRefreshCookieHeader,
  buildClearCookieHeaders,
} from "./auth-cookies";

export type AuthedUser = {
  id: string;
  email: string;
  role: string;
  userName: string;
  firstName: string;
  lastName: string;
};

export type AuthResult = {
  user: AuthedUser;
  setCookieHeaders: Headers | null;
};

export class AuthError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function validateBearer(token: string): Promise<AuthedUser> {
  const url = `${env.api_proxy_target}/api/v1/api/user/oauth/token/validate`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) {
    throw new AuthError(401, "Invalid token");
  }
  const data = (await resp.json()) as TokenValidateResponse;
  return {
    id: data.userInfo.id,
    email: data.userInfo.email,
    role: data.userInfo.role,
    userName: data.userInfo.user_name,
    firstName: data.userInfo.first_name,
    lastName: data.userInfo.last_name,
  };
}

export async function tryRefresh(
  refreshToken: string,
): Promise<TokenRefreshResponse | null> {
  try {
    const resp = await fetch(
      `${env.api_proxy_target}/api/v1/api/user/oauth/token/refresh`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      },
    );
    if (!resp.ok) return null;
    return (await resp.json()) as TokenRefreshResponse;
  } catch {
    return null;
  }
}

function buildRefreshedCookieHeaders(
  refreshed: TokenRefreshResponse,
): Headers {
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    buildAccessCookieHeader(refreshed.access_token, refreshed.expires_in),
  );
  headers.append(
    "Set-Cookie",
    buildRefreshCookieHeader(refreshed.refresh_token),
  );
  return headers;
}

async function authenticate(request: Request): Promise<AuthResult> {
  const { accessToken, refreshToken } = parseAuthCookies(request);

  if (accessToken) {
    try {
      const user = await validateBearer(accessToken);
      return { user, setCookieHeaders: null };
    } catch (err) {
      if (!(err instanceof AuthError)) throw err;
      // 401 from validate — fall through to refresh attempt.
    }
  }

  if (!refreshToken) {
    throw new AuthError(401, "Missing auth cookie");
  }

  const refreshed = await tryRefresh(refreshToken);
  if (!refreshed) {
    throw new AuthError(401, "Refresh failed");
  }

  const user = await validateBearer(refreshed.access_token);
  return {
    user,
    setCookieHeaders: buildRefreshedCookieHeaders(refreshed),
  };
}

export async function requireUser(request: Request): Promise<AuthResult> {
  return authenticate(request);
}

export async function requireContentAdmin(
  request: Request,
): Promise<AuthResult> {
  const result = await authenticate(request);
  if (result.user.role !== "CONTENT_ADMIN") {
    throw new AuthError(403, "Forbidden: requires CONTENT_ADMIN role");
  }
  return result;
}

export function authErrorResponse(err: unknown): Response {
  if (err instanceof AuthError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

const ALLOWED_ROLES = new Set(["CONTENT_ADMIN", "CONTENT_REVIEWER"]);

export function buildLmsLoginUrl(request: Request): string {
  const origin = new URL(request.url).origin;
  const params = new URLSearchParams();
  params.set("client", "TCE-TEST-APP");
  params.set("redirectUri", `${origin}/auth/callback`);
  return `${env.login_url}/#/login/?${params.toString()}`;
}

/**
 * Server loader guard: returns the authed user (plus any Set-Cookie headers
 * from a token refresh that callers must attach to their response), or throws
 * a redirect to the LMS login page (clearing stale cookies). For routes that
 * require an authed, allowed-role user before rendering.
 */
export async function requireAuthedLoader(
  request: Request,
): Promise<AuthResult> {
  try {
    const result = await authenticate(request);
    if (!ALLOWED_ROLES.has(result.user.role)) {
      throw redirect("/unauthorized", {
        headers: result.setCookieHeaders ?? undefined,
      });
    }
    return result;
  } catch (err) {
    if (err instanceof Response) throw err;
    throw redirect(buildLmsLoginUrl(request), {
      headers: buildClearCookieHeaders(),
    });
  }
}
