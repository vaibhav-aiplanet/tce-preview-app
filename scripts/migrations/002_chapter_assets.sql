-- Run against CONTENT_DB (e.g. dev_lms_content_service_v1)
-- Mirrors app/db/models/content/chapter-assets.ts
-- chapter_id holds a chapter reference (char/varchar id, no dashes). No SQL FK
-- because the curriculum master tables live in a different database.

-- Enum types (idempotent: CREATE TYPE has no IF NOT EXISTS, so guard with DO blocks)
DO $$ BEGIN
  CREATE TYPE asset_type AS ENUM ('ASSET_GALLERY', 'ASSET_MEDIA', 'ASSET_PRINT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE asset_sub_type AS ENUM (
    'ANIMATION', 'AUDIO', 'FP_ACTIVITY', 'FP_CONCEPTMAP', 'FP_KEYWORDS',
    'GAME', 'GE_GAMES', 'HANDOUT', 'INTERACTIVE', 'INTERACTIVE_DEMO_AND_PRACTICE',
    'INTERACTIVE_PRACTICE', 'INTERACTIVITY', 'LECTURENOTE', 'LINKLABEDGE', 'MP4',
    'SLIDESHOW', 'VIDEO', 'WORKSHEET', 'GALLERY'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE asset_mime_type AS ENUM (
    'GALLERY', 'MP4', 'SWF', 'TCE_HTML', 'TCE_LINK', 'TCE_SHELL', 'XML', 'PDF', 'F4V'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE content_consumer AS ENUM ('TEACHER', 'STUDENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE content_type AS ENUM ('STUDY', 'REVISION');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS chapter_assets (
  id                char(32)          PRIMARY KEY,
  active            boolean           NOT NULL,
  created_at        bigint,
  created_by        varchar(255),
  deleted           boolean           NOT NULL,
  last_modified_by  varchar(255),
  modified_at       bigint,
  asset_id          varchar(255)      NOT NULL,
  asset_mime_type   asset_mime_type   NOT NULL,
  asset_sub_type    asset_sub_type    NOT NULL,
  asset_type        asset_type        NOT NULL,
  chapter_id        varchar(255)      NOT NULL,
  content_consumer  content_consumer  NOT NULL,
  content_type      content_type,
  title             varchar(255)      NOT NULL
);

CREATE INDEX IF NOT EXISTS chapter_assets_id_index ON chapter_assets (id);
