import { pgTable } from "drizzle-orm/pg-core";

export const tce_asset_mapping = pgTable("tce_asset_mapping", (t) => ({
  id: t.uuid().primaryKey().defaultRandom(),
  asset_id: t.text().unique().notNull(),

  chapter_asset_id: t.char({ length: 32 }),

  grade_id: t.uuid(),
  subject_id: t.uuid(),
  chapter_id: t.uuid(),
  subtopic_id: t.uuid(),

  created_at: t.timestamp().defaultNow(),
  updated_at: t
    .timestamp()
    .defaultNow()
    .$onUpdate(() => new Date()),
  created_by: t.text(),
}));
