import { and, eq } from "drizzle-orm";
import { master_db } from "~/db";
import { chapters } from "~/db/models/master/chapters";
import type { Route } from "./+types/api.chapters";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const subjectId = url.searchParams.get("subjectId");

  if (!subjectId) {
    return Response.json([]);
  }

  const rows = await master_db
    .select({ id: chapters.id, name: chapters.chapter })
    .from(chapters)
    .where(
      and(
        eq(chapters.subject_id, subjectId),
        eq(chapters.active, true),
        eq(chapters.deleted, false),
      ),
    );

  return Response.json(rows);
}
