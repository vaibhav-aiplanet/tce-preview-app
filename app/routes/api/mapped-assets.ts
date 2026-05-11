import { inArray } from "drizzle-orm";
import { content_db, master_db } from "~/db";
import { tce_asset_mapping } from "~/db/models/content/tce-asset-mapping";
import { chapter_assets } from "~/db/models/content/chapter-assets";
import { grades } from "~/db/models/master/grades";
import { subjects } from "~/db/models/master/subjects";
import { chapters } from "~/db/models/master/chapters";
import { sub_topics } from "~/db/models/master/sub-topics";

export async function loader() {
  const mappings = await content_db
    .select()
    .from(tce_asset_mapping)
    .orderBy(tce_asset_mapping.updated_at);

  if (mappings.length === 0) {
    return Response.json([]);
  }

  // Strip hyphens from UUID to match char(32) primary keys in master DB
  const stripHyphens = (id: string) => id.replace(/-/g, "");

  // Collect unique IDs for batch lookups (stripped for master DB queries)
  const gradeIds = [...new Set(mappings.flatMap((m) => (m.grade_id ? [stripHyphens(m.grade_id)] : [])))];
  const subjectIds = [...new Set(mappings.flatMap((m) => (m.subject_id ? [stripHyphens(m.subject_id)] : [])))];
  const chapterIds = [...new Set(mappings.flatMap((m) => (m.chapter_id ? [stripHyphens(m.chapter_id)] : [])))];
  const subtopicIds = [...new Set(mappings.flatMap((m) => (m.subtopic_id ? [stripHyphens(m.subtopic_id)] : [])))];
  const assetIds = mappings.map((m) => m.asset_id);

  // Batch fetch names from master DB
  const [gradeRows, subjectRows, chapterRows, subtopicRows] = await Promise.all([
    gradeIds.length > 0
      ? master_db
          .select({ id: grades.id, name: grades.grade })
          .from(grades)
          .where(inArray(grades.id, gradeIds))
      : [],
    subjectIds.length > 0
      ? master_db
          .select({ id: subjects.id, name: subjects.subject })
          .from(subjects)
          .where(inArray(subjects.id, subjectIds))
      : [],
    chapterIds.length > 0
      ? master_db
          .select({ id: chapters.id, name: chapters.chapter })
          .from(chapters)
          .where(inArray(chapters.id, chapterIds))
      : [],
    subtopicIds.length > 0
      ? master_db
          .select({ id: sub_topics.id, name: sub_topics.sub_topic })
          .from(sub_topics)
          .where(inArray(sub_topics.id, subtopicIds))
      : [],
  ]);

  // Fetch chapter_assets for consumer/type info
  const chapterAssetRows = assetIds.length > 0
    ? await content_db
        .select({
          asset_id: chapter_assets.asset_id,
          title: chapter_assets.title,
          content_consumer: chapter_assets.content_consumer,
          content_type: chapter_assets.content_type,
        })
        .from(chapter_assets)
        .where(inArray(chapter_assets.asset_id, assetIds))
    : [];

  const gradeMap = Object.fromEntries(gradeRows.map((r) => [r.id, r.name]));
  const subjectMap = Object.fromEntries(subjectRows.map((r) => [r.id, r.name]));
  const chapterMap = Object.fromEntries(chapterRows.map((r) => [r.id, r.name]));
  const subtopicMap = Object.fromEntries(subtopicRows.map((r) => [r.id, r.name]));
  const chapterAssetMap = Object.fromEntries(chapterAssetRows.map((r) => [r.asset_id, r]));

  const result = mappings.map((m) => {
    const ca = chapterAssetMap[m.asset_id];
    return {
      assetId: m.asset_id,
      title: ca?.title || m.asset_id,
      grade: (m.grade_id && gradeMap[stripHyphens(m.grade_id)]) || null,
      subject: (m.subject_id && subjectMap[stripHyphens(m.subject_id)]) || null,
      chapter: (m.chapter_id && chapterMap[stripHyphens(m.chapter_id)]) || null,
      subtopic: (m.subtopic_id && subtopicMap[stripHyphens(m.subtopic_id)]) || null,
      consumer: ca?.content_consumer || null,
      contentType: ca?.content_type || null,
      createdBy: m.created_by,
      updatedAt: m.updated_at,
      status: m.status,
      rejectionReason: m.rejection_reason,
      reviewedBy: m.reviewed_by,
      reviewedAt: m.reviewed_at,
    };
  });

  return Response.json(result);
}
