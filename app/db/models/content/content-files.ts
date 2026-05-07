import { sql } from "drizzle-orm";
import { index, pgTable, uniqueIndex } from "drizzle-orm/pg-core";

// grade_id is a soft reference to master_db.grades.id (char(32), no dashes).
// No SQL FK — the two tables live in different Postgres databases.
export const content_files = pgTable(
  "content_files",
  (t) => ({
    id: t.uuid().primaryKey().defaultRandom(),

    grade_id: t.char({ length: 32 }).notNull(),
    subject_name: t.text().notNull(),
    subtopic_name: t.text(),
    display_name: t.text().notNull(),

    s3_key: t.text().notNull(),

    asset_count: t.integer().notNull(),
    original_filename: t.text().notNull(),

    uploaded_by: t.text().notNull(),
    uploaded_at: t.timestamp().defaultNow().notNull(),

    is_active: t.boolean().notNull().default(true),
  }),
  (table) => [
    index("content_files_grade_active_idx").on(table.grade_id, table.is_active),
    uniqueIndex("content_files_unique_active_book_idx")
      .on(table.grade_id, table.subject_name, table.subtopic_name)
      .where(sql`${table.is_active} = true`),
  ],
);
