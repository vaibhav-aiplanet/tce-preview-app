import { and, eq } from "drizzle-orm";
import { content_db } from "~/db";
import { chapter_assets } from "~/db/models/content/chapter-assets";
import { tce_asset_mapping } from "~/db/models/content/tce-asset-mapping";

// --- TCE Asset Mapping ---

export function getTceAssetMappings() {
  return content_db.select().from(tce_asset_mapping);
}

export function getTceAssetMappingById(id: string) {
  return content_db
    .select()
    .from(tce_asset_mapping)
    .where(eq(tce_asset_mapping.id, id));
}

export function getTceAssetMappingByAssetId(assetId: string) {
  return content_db
    .select()
    .from(tce_asset_mapping)
    .where(eq(tce_asset_mapping.asset_id, assetId));
}

export function createTceAssetMapping(
  data: typeof tce_asset_mapping.$inferInsert,
) {
  return content_db.insert(tce_asset_mapping).values(data).returning();
}

export function updateTceAssetMapping(
  id: string,
  data: Partial<typeof tce_asset_mapping.$inferInsert>,
) {
  return content_db
    .update(tce_asset_mapping)
    .set(data)
    .where(eq(tce_asset_mapping.id, id))
    .returning();
}

export function deleteTceAssetMapping(id: string) {
  return content_db
    .delete(tce_asset_mapping)
    .where(eq(tce_asset_mapping.id, id))
    .returning();
}

// --- Chapter Assets ---

export function getChapterAssets() {
  return content_db
    .select()
    .from(chapter_assets)
    .where(
      and(eq(chapter_assets.active, true), eq(chapter_assets.deleted, false)),
    );
}

export function getChapterAssetById(id: string) {
  return content_db
    .select()
    .from(chapter_assets)
    .where(eq(chapter_assets.id, id));
}

export function getChapterAssetsByChapterId(chapterId: string) {
  return content_db
    .select()
    .from(chapter_assets)
    .where(
      and(
        eq(chapter_assets.chapter_id, chapterId),
        eq(chapter_assets.active, true),
        eq(chapter_assets.deleted, false),
      ),
    );
}

export function createChapterAsset(data: typeof chapter_assets.$inferInsert) {
  return content_db.insert(chapter_assets).values(data).returning();
}

export function updateChapterAsset(
  id: string,
  data: Partial<typeof chapter_assets.$inferInsert>,
) {
  return content_db
    .update(chapter_assets)
    .set(data)
    .where(eq(chapter_assets.id, id))
    .returning();
}

export function deleteChapterAsset(id: string) {
  return content_db
    .update(chapter_assets)
    .set({ deleted: true, active: false })
    .where(eq(chapter_assets.id, id))
    .returning();
}
