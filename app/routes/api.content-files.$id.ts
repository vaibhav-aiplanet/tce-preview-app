import { eq } from "drizzle-orm";
import { content_db } from "~/db";
import { content_files } from "~/db/models/content/content-files";
import {
  AuthError,
  authErrorResponse,
  requireContentAdmin,
} from "~/lib/server-auth";
import type { Route } from "./+types/api.content-files.$id";

export async function action({ request, params }: Route.ActionArgs) {
  if (request.method !== "DELETE") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    await requireContentAdmin(request);
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err);
    throw err;
  }

  const id = params.id;
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  const updated = await content_db
    .update(content_files)
    .set({ is_active: false })
    .where(eq(content_files.id, id))
    .returning({ id: content_files.id });

  if (updated.length === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
