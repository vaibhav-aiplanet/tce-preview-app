-- Adds the review workflow to tce_asset_mapping.
-- Existing rows are backfilled to APPROVED so legacy mappings stay live;
-- the column default flips to PENDING after the backfill so new submissions
-- enter the review queue.

CREATE TYPE tce_asset_mapping_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE tce_asset_mapping
  ADD COLUMN status tce_asset_mapping_status NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN rejection_reason text,
  ADD COLUMN reviewed_by text,
  ADD COLUMN reviewed_at timestamp;

ALTER TABLE tce_asset_mapping
  ALTER COLUMN status SET DEFAULT 'PENDING';

CREATE INDEX tce_asset_mapping_status_idx ON tce_asset_mapping(status);
