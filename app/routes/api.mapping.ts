import { eq, sql } from "drizzle-orm";
import { content_db } from "~/db";
import { tce_asset_mapping } from "~/db/models/content/tce-asset-mapping";
import { chapter_assets } from "~/db/models/content/chapter-assets";
import type { Route } from "./+types/api.mapping";

function generateId(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
}

function toEnumFormat(value: string, fallback: string): string {
  if (!value) return fallback;
  return value.toUpperCase().replace(/-/g, "_");
}

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
    gradeId: mapping.grade_id,
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
  const {
    assetId,
    gradeId,
    subjectId,
    chapterId,
    subtopicId,
    createdBy,
    title,
    mimeType,
    assetType,
    subType,
  } = body;

  if (!assetId || !subjectId || !chapterId || !createdBy || !gradeId) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const subtopicIdValue = subtopicId || null;

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

  const now = Date.now();

  const existingChapterAsset = await content_db
    .select()
    .from(chapter_assets)
    .where(eq(chapter_assets.asset_id, assetId));

  if (existingChapterAsset.length > 0) {
    await content_db
      .update(chapter_assets)
      .set({
        chapter_id: chapterId,
        modified_at: now,
        last_modified_by: createdBy,
      })
      .where(eq(chapter_assets.asset_id, assetId));
  } else {
    await content_db.execute(
      sql`INSERT INTO chapter_assets (id, active, deleted, asset_id, asset_mime_type, asset_sub_type, asset_type, chapter_id, content_consumer, content_type, title, created_at, created_by, modified_at)
       VALUES (${generateId()}, ${true}, ${false}, ${assetId}, ${sql`${toEnumFormat(mimeType || "", "MP4")}::asset_mime_type`}, ${sql`${toEnumFormat(subType || "", "VIDEO")}::asset_sub_type`}, ${sql`${toEnumFormat(assetType || "", "ASSET_MEDIA")}::asset_type`}, ${chapterId}, ${"TEACHER"}, ${"STUDY"}, ${title || ""}, ${now}, ${createdBy}, ${now})`,
    );
  }

  return Response.json({ ok: true });
}
