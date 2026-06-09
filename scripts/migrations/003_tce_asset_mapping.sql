-- Run against CONTENT_DB (e.g. dev_lms_content_service_v1)
-- Mirrors app/db/models/content/tce-asset-mapping.ts
-- chapter_asset_id is a FK to chapter_assets.id (char(32)); both tables live in
-- CONTENT_DB so the constraint is enforced. grade_id/subject_id/chapter_id/
-- subtopic_id are uuid references to curriculum master tables in a different
-- database, so no SQL FKs are declared for those.
-- updated_at is maintained by the application ($onUpdate in Drizzle), not a trigger.

DO $$ BEGIN
  CREATE TYPE tce_asset_mapping_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS tce_asset_mapping (
  id                uuid                      PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id          text                      NOT NULL UNIQUE,
  chapter_asset_id  char(32)                  REFERENCES chapter_assets (id),
  grade_id          uuid,
  subject_id        uuid,
  chapter_id        uuid,
  subtopic_id       uuid,
  status            tce_asset_mapping_status  NOT NULL DEFAULT 'PENDING',
  rejection_reason  text,
  reviewed_by       text,
  reviewed_at       timestamp,
  created_at        timestamp                 DEFAULT now(),
  updated_at        timestamp                 DEFAULT now(),
  created_by        text
);

CREATE INDEX IF NOT EXISTS tce_asset_mapping_status_idx ON tce_asset_mapping (status);
