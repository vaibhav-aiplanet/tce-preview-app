import { redirect } from "react-router";
import { env } from "./env";
import { parseAuthCookies, buildClearCookieHeaders } from "./auth-cookies";

export type AuthedUser = {
  id: string;
  email: string;
  role: string;
  userName: string;
  firstName: string;
  lastName: string;
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

export async function requireUser(request: Request): Promise<AuthedUser> {
  const { accessToken } = parseAuthCookies(request);
  if (!accessToken) throw new AuthError(401, "Missing auth cookie");
  return validateBearer(accessToken);
}

export async function requireContentAdmin(request: Request): Promise<AuthedUser> {
  const user = await requireUser(request);
  if (user.role !== "CONTENT_ADMIN") {
    throw new AuthError(403, "Forbidden: requires CONTENT_ADMIN role");
  }
  return user;
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
 * Server loader guard: returns the authed user, or throws a redirect to the
 * LMS login page (clearing stale cookies). For routes that require an authed,
 * allowed-role user before rendering.
 */
export async function requireAuthedLoader(
  request: Request,
): Promise<AuthedUser> {
  try {
    const user = await requireUser(request);
    if (!ALLOWED_ROLES.has(user.role)) {
      throw redirect("/unauthorized");
    }
    return user;
  } catch (err) {
    if (err instanceof Response) throw err;
    throw redirect(buildLmsLoginUrl(request), {
      headers: buildClearCookieHeaders(),
    });
  }
}
