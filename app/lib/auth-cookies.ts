export const ACCESS_TOKEN_COOKIE = "az_access";
export const REFRESH_TOKEN_COOKIE = "az_refresh";

const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type AuthCookies = {
  accessToken: string | null;
  refreshToken: string | null;
};

export function parseAuthCookies(request: Request): AuthCookies {
  const header = request.headers.get("cookie");
  if (!header) return { accessToken: null, refreshToken: null };
  const jar = parseCookieHeader(header);
  return {
    accessToken: jar[ACCESS_TOKEN_COOKIE] ?? null,
    refreshToken: jar[REFRESH_TOKEN_COOKIE] ?? null,
  };
}

export function buildSetCookieHeaders(input: {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}): Headers {
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    serialize(ACCESS_TOKEN_COOKIE, input.accessToken, {
      maxAge: input.expiresIn ?? 60 * 60,
    }),
  );
  headers.append(
    "Set-Cookie",
    serialize(REFRESH_TOKEN_COOKIE, input.refreshToken, {
      maxAge: REFRESH_MAX_AGE_SECONDS,
    }),
  );
  return headers;
}

export function buildAccessCookieHeader(
  accessToken: string,
  expiresIn?: number,
): string {
  return serialize(ACCESS_TOKEN_COOKIE, accessToken, {
    maxAge: expiresIn ?? 60 * 60,
  });
}

export function buildRefreshCookieHeader(refreshToken: string): string {
  return serialize(REFRESH_TOKEN_COOKIE, refreshToken, {
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });
}

export function buildClearCookieHeaders(): Headers {
  const headers = new Headers();
  headers.append("Set-Cookie", serialize(ACCESS_TOKEN_COOKIE, "", { maxAge: 0 }));
  headers.append("Set-Cookie", serialize(REFRESH_TOKEN_COOKIE, "", { maxAge: 0 }));
  return headers;
}

function parseCookieHeader(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(value);
    } catch {
      out[key] = value;
    }
  }
  return out;
}

type SerializeOptions = {
  maxAge: number;
  path?: string;
  sameSite?: "Lax" | "Strict" | "None";
};

function serialize(name: string, value: string, opts: SerializeOptions): string {
  const path = opts.path ?? "/";
  const sameSite = opts.sameSite ?? "Lax";
  const secure = process.env.NODE_ENV === "production";
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${path}`,
    `Max-Age=${opts.maxAge}`,
    `SameSite=${sameSite}`,
    "HttpOnly",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}
