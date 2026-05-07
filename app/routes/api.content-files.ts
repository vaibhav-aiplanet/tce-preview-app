import { and, asc, eq, inArray } from "drizzle-orm";
import { content_db, master_db } from "~/db";
import { content_files } from "~/db/models/content/content-files";
import { grades } from "~/db/models/master/grades";
import type { Route } from "./+types/api.content-files";

export type ContentFilesManifestEntry = {
  id: string;
  gradeId: string;
  name: string;
  path: string;
};

export type ContentFilesManifest = Record<string, ContentFilesManifestEntry[]>;

function gradeKey(name: string | null): string {
  // Normalize "Grade 1" / "1" → "1" so the manifest stays keyed by grade
  // number (matches the home page's expectation).
  return (name ?? "").trim().replace(/^grade\s+/i, "");
}

export async function loader({ request: _request }: Route.LoaderArgs) {
  const rows = await content_db
    .select({
      id: content_files.id,
      grade_id: content_files.grade_id,
      display_name: content_files.display_name,
    })
    .from(content_files)
    .where(eq(content_files.is_active, true))
    .orderBy(asc(content_files.display_name));

  const gradeIds = [...new Set(rows.map((r) => r.grade_id))];

  const gradeRows = gradeIds.length
    ? await master_db
        .select({ id: grades.id, name: grades.grade, sortOrder: grades.sort_order })
        .from(grades)
        .where(
          and(
            inArray(grades.id, gradeIds),
            eq(grades.active, true),
            eq(grades.deleted, false),
          ),
        )
    : [];

  const gradeById = new Map(
    gradeRows.map((g) => [g.id, { name: gradeKey(g.name), sortOrder: g.sortOrder ?? 0 }]),
  );

  const manifest: ContentFilesManifest = {};
  for (const row of rows) {
    const grade = gradeById.get(row.grade_id);
    if (!grade) continue;
    if (!manifest[grade.name]) manifest[grade.name] = [];
    manifest[grade.name].push({
      id: row.id,
      gradeId: row.grade_id,
      name: row.display_name,
      path: `/_api/content-files/${row.id}/json`,
    });
  }

  return Response.json(manifest);
}
