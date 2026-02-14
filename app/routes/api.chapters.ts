import { and, eq } from "drizzle-orm";
import { master_db } from "~/db";
import { chapters } from "~/db/models/master/chapters";
import type { Route } from "./+types/api.chapters";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const subjectId = url.searchParams.get("subjectId");
  const boardId = url.searchParams.get("boardId");
  const gradeId = url.searchParams.get("gradeId");

  if (!subjectId) {
    return Response.json([]);
  }

  const conditions = [
    eq(chapters.subject_id, subjectId),
    eq(chapters.active, true),
    eq(chapters.deleted, false),
  ];

  if (boardId) {
    conditions.push(eq(chapters.board_id, boardId));
  }
  if (gradeId) {
    conditions.push(eq(chapters.grade_id, gradeId));
  }

  const rows = await master_db
    .select({ id: chapters.id, name: chapters.chapter })
    .from(chapters)
    .where(and(...conditions));

  return Response.json(rows);
}
