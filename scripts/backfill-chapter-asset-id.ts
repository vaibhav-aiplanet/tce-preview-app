/**
 * Backfill script: populates tce_asset_mapping.chapter_asset_id
 *
 * For each tce_asset_mapping row that has no chapter_asset_id,
 * finds the matching chapter_assets row by (asset_id + chapter_id)
 * and links them. If multiple matches exist, picks the active one
 * (or the most recently created one as fallback).
 *
 * Usage: npx tsx scripts/backfill-chapter-asset-id.ts
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, isNull } from "drizzle-orm";
import { tce_asset_mapping } from "../app/db/models/content/tce-asset-mapping";
import { chapter_assets } from "../app/db/models/content/chapter-assets";

const { DB_HOSTNAME, DB_USER, DB_PASSWORD, CONTENT_DB } = process.env;

if (!DB_HOSTNAME || !DB_USER || !DB_PASSWORD || !CONTENT_DB) {
  console.error(
    "Missing env vars. Required: DB_HOSTNAME, DB_USER, DB_PASSWORD, CONTENT_DB",
  );
  process.exit(1);
}

const url = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOSTNAME}/${CONTENT_DB}`;
const client = postgres(url, { ssl: "require" });
const db = drizzle(client);

async function backfill() {
  const mappings = await db
    .select()
    .from(tce_asset_mapping)
    .where(isNull(tce_asset_mapping.chapter_asset_id));

  console.log(`Found ${mappings.length} mapping(s) without chapter_asset_id`);

  let updated = 0;
  let skipped = 0;

  for (const mapping of mappings) {
    if (!mapping.chapter_id) {
      console.log(`  SKIP asset_id=${mapping.asset_id} — no chapter_id`);
      skipped++;
      continue;
    }

    const chapterIdRaw = mapping.chapter_id.replace(/-/g, "");
    const candidates = await db
      .select({
        id: chapter_assets.id,
        active: chapter_assets.active,
        created_at: chapter_assets.created_at,
      })
      .from(chapter_assets)
      .where(
        and(
          eq(chapter_assets.asset_id, mapping.asset_id),
          eq(chapter_assets.chapter_id, chapterIdRaw),
        ),
      );
    console.log(candidates.length);

    if (candidates.length === 0) {
      console.log(
        `  SKIP asset_id=${mapping.asset_id} — no chapter_assets row for chapter_id=${mapping.chapter_id}`,
      );
      skipped++;
      continue;
    }

    // Prefer the active row; fall back to most recently created
    const match =
      candidates.find((c) => c.active) ??
      candidates.sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0))[0];

    await db
      .update(tce_asset_mapping)
      .set({ chapter_asset_id: match.id })
      .where(eq(tce_asset_mapping.id, mapping.id));

    console.log(
      `  OK asset_id=${mapping.asset_id} → chapter_asset_id=${match.id}`,
    );
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
  await client.end();
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  client.end();
  process.exit(1);
});
