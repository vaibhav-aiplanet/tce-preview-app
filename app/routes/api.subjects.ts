import { and, eq } from "drizzle-orm";
import { master_db } from "~/db";
import { subject_mapping } from "~/db/models/master/subject-mapping";
import { subjects } from "~/db/models/master/subjects";
import type { Route } from "./+types/api.subjects";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const boardId = url.searchParams.get("boardId");
  const gradeId = url.searchParams.get("gradeId");

  if (!boardId || !gradeId) {
    const rows = await master_db
      .select({ id: subjects.id, name: subjects.subject })
      .from(subjects)
      .where(and(eq(subjects.active, true), eq(subjects.deleted, false)));

    return Response.json(rows);
  }

  const mappings = await master_db
    .select({ subjectId: subject_mapping.subjects_id })
    .from(subject_mapping)
    .where(
      and(
        eq(subject_mapping.boards_id, boardId),
        eq(subject_mapping.grades_id, gradeId),
        eq(subject_mapping.active, true),
        eq(subject_mapping.deleted, false),
      ),
    );

  const subjectIds = mappings.map((m) => m.subjectId).filter(Boolean);

  if (subjectIds.length === 0) {
    return Response.json([]);
  }

  const rows = await master_db
    .select({ id: subjects.id, name: subjects.subject })
    .from(subjects)
    .where(
      and(
        eq(subjects.active, true),
        eq(subjects.deleted, false),
      ),
    );

  const filtered = rows.filter((s) => subjectIds.includes(s.id));

  return Response.json(filtered);
}
