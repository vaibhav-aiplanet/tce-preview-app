-- Run against CONTENT_DB as the table OWNER / a superuser (the privileged role
-- that created the tables in 001-003), NOT as the app's runtime role.
--
-- Why: the app connects to CONTENT_DB as DB_USER (see app/db/index.ts ->
-- env.content_db_url, built in app/lib/env.ts). When the tables are created by a
-- different admin role, DB_USER has no privileges and every query fails with
-- "permission denied for table ..." (Postgres 42501). This grants the runtime
-- role the access it needs.
--
-- Pass the app role on the psql command line, e.g.:
--   psql "$CONTENT_DB_URL" -v app_user=tce_app -f scripts/migrations/004_grants.sql

\if :{?app_user}
\else
  \echo 'ERROR: set the app role, e.g. psql ... -v app_user=tce_app -f 004_grants.sql'
  \quit
\endif

-- Privileges on the tables created by 001-003.
GRANT SELECT, INSERT, UPDATE, DELETE
  ON content_files, chapter_assets, tce_asset_mapping
  TO :"app_user";

-- Sequences (none today -- all PKs use uuid/char -- but future-proofs serial PKs).
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO :"app_user";

-- Make future tables/sequences created by THIS owner role auto-grant to the app
-- role, so new migrations don't reintroduce the permission-denied error.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :"app_user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO :"app_user";
