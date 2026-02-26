import { index, pgEnum, pgTable } from "drizzle-orm/pg-core";

const assetTypeEnum = pgEnum("asset_type", [
  "ASSET_GALLERY",
  "ASSET_MEDIA",
  "ASSET_PRINT",
]);

const assetSubTypeEnum = pgEnum("asset_sub_type", [
  "ANIMATION",
  "AUDIO",
  "FP_ACTIVITY",
  "FP_CONCEPTMAP",
  "FP_KEYWORDS",
  "GAME",
  "GE_GAMES",
  "HANDOUT",
  "INTERACTIVE",
  "INTERACTIVE_DEMO_AND_PRACTICE",
  "INTERACTIVE_PRACTICE",
  "INTERACTIVITY",
  "LECTURENOTE",
  "LINKLABEDGE",
  "MP4",
  "SLIDESHOW",
  "VIDEO",
  "WORKSHEET",
  "GALLERY",
]);

const assetMimeTypeEnum = pgEnum("asset_mime_type", [
  "GALLERY",
  "MP4",
  "SWF",
  "TCE_HTML",
  "TCE_LINK",
  "TCE_SHELL",
  "XML",
  "PDF",
  "F4V",
]);

const contentConsumerEnum = pgEnum("content_consumer", [
  "TEACHER",
  "STUDENT",
]);

const contentTypeEnum = pgEnum("content_type", ["STUDY", "REVISION"]);

export const chapter_assets = pgTable(
  "chapter_assets",
  (t) => ({
    id: t.char({ length: 32 }).primaryKey(),
    active: t.boolean().notNull(),
    created_at: t.bigint({ mode: "number" }),
    created_by: t.varchar({ length: 255 }),
    deleted: t.boolean().notNull(),
    last_modified_by: t.varchar({ length: 255 }),
    modified_at: t.bigint({ mode: "number" }),
    asset_id: t.varchar({ length: 255 }).notNull(),
    asset_mime_type: assetMimeTypeEnum().notNull(),
    asset_sub_type: assetSubTypeEnum().notNull(),
    asset_type: assetTypeEnum().notNull(),
    chapter_id: t.varchar({ length: 255 }).notNull(),
    content_consumer: contentConsumerEnum().notNull(),
    content_type: contentTypeEnum(),
    title: t.varchar({ length: 255 }).notNull(),
  }),
  (table) => [index("chapter_assets_id_index").on(table.id)],
);
