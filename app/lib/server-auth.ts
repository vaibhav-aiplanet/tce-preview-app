import { env } from "./env";

export type AuthedUser = {
  id: string;
  email: string;
  role: string;
};

export class AuthError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function validateBearer(token: string): Promise<AuthedUser> {
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
  };
}

export async function requireUser(request: Request): Promise<AuthedUser> {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new AuthError(401, "Missing Authorization header");
  return validateBearer(token);
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
