import { eq } from "drizzle-orm";
import { content_db } from "~/db";
import { tce_asset_mapping } from "~/db/models/content/tce-asset-mapping";
import type { Route } from "./+types/api.mapping";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const assetId = url.searchParams.get("assetId");

  if (!assetId) {
    return Response.json(null);
  }

  const rows = await content_db
    .select()
    .from(tce_asset_mapping)
    .where(eq(tce_asset_mapping.asset_id, assetId));

  const mapping = rows[0];
  if (!mapping) {
    return Response.json(null);
  }

  return Response.json({
    subjectId: mapping.subject_id,
    chapterId: mapping.chapter_id,
    subtopicId: mapping.subtopic_id,
  });
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const body = await request.json();
  const { assetId, gradeId, subjectId, chapterId, subtopicId, createdBy } =
    body;

  if (!assetId || !subjectId || !chapterId || !createdBy || !gradeId) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const subtopicIdValue = subtopicId || null;

  // Upsert: check if a mapping exists, then update or insert
  const existing = await content_db
    .select()
    .from(tce_asset_mapping)
    .where(eq(tce_asset_mapping.asset_id, assetId));

  if (existing.length > 0) {
    await content_db
      .update(tce_asset_mapping)
      .set({
        grade_id: gradeId,
        subject_id: subjectId,
        chapter_id: chapterId,
        subtopic_id: subtopicIdValue,
        created_by: createdBy,
      })
      .where(eq(tce_asset_mapping.asset_id, assetId));
  } else {
    await content_db.insert(tce_asset_mapping).values({
      asset_id: assetId,
      grade_id: gradeId,
      subject_id: subjectId,
      chapter_id: chapterId,
      subtopic_id: subtopicIdValue,
      created_by: createdBy,
    });
  }

  return Response.json({ ok: true });
}
