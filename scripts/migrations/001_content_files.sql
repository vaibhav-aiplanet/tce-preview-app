-- Run against CONTENT_DB (e.g. dev_lms_content_service_v1)
-- grade_id references master_db.grades.id (char(32), no dashes). No SQL FK
-- because grades lives in a different database.
CREATE TABLE IF NOT EXISTS content_files (
  id                uuid       PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id          char(32)   NOT NULL,
  subject_name      text       NOT NULL,
  subtopic_name     text,
  display_name      text       NOT NULL,
  s3_key            text       NOT NULL,
  asset_count       integer    NOT NULL,
  original_filename text       NOT NULL,
  uploaded_by       text       NOT NULL,
  uploaded_at       timestamp  NOT NULL DEFAULT now(),
  is_active         boolean    NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS content_files_grade_active_idx
  ON content_files (grade_id, is_active);

CREATE UNIQUE INDEX IF NOT EXISTS content_files_unique_active_book_idx
  ON content_files (grade_id, subject_name, COALESCE(subtopic_name, ''))
  WHERE is_active = true;
