import { markInboxRead } from "~/lib/inbox";
import {
  AuthError,
  authErrorResponse,
  requireUser,
} from "~/lib/server-auth";
import type { Route } from "./+types/inbox.$id.read";

const ALLOWED_ROLES = new Set(["CONTENT_ADMIN", "CONTENT_REVIEWER"]);

export async function action({ request, params }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let user;
  let setCookieHeaders: Headers | null = null;
  try {
    const result = await requireUser(request);
    user = result.user;
    setCookieHeaders = result.setCookieHeaders;
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err);
    throw err;
  }

  if (!ALLOWED_ROLES.has(user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = params.id;
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  const ok = await markInboxRead(id, user.userName || user.id);

  return Response.json(
    { ok },
    setCookieHeaders ? { headers: setCookieHeaders } : undefined,
  );
}
