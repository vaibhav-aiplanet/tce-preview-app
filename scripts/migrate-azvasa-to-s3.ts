/**
 * One-time migration: walks public/azvasa/{gradeNumber}/*.json, looks up the
 * matching grades.id from MASTER_DB, uploads each book to S3, and inserts
 * a content_files row in CONTENT_DB.
 *
 * Idempotent: if an active content_files row already exists for
 * (grade_id, subject_name, subtopic_name), the file is skipped.
 *
 * Usage:
 *   bun run scripts/migrate-azvasa-to-s3.ts
 *   # or
 *   npx tsx scripts/migrate-azvasa-to-s3.ts
 */

import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq, isNull } from "drizzle-orm";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { content_files } from "../app/db/models/content/content-files";
import { grades } from "../app/db/models/master/grades";
import {
  buildDisplayName,
  deriveBookMetadataFromFilename,
} from "../app/lib/excel-parser";

const {
  DB_HOSTNAME,
  DB_USER,
  DB_PASSWORD,
  CONTENT_DB,
  MASTER_DB,
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  S3_BUCKET,
} = process.env;

if (!DB_HOSTNAME || !DB_USER || !DB_PASSWORD || !CONTENT_DB || !MASTER_DB) {
  console.error("Missing DB env vars");
  process.exit(1);
}
if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !S3_BUCKET) {
  console.error("Missing AWS env vars");
  process.exit(1);
}

const contentClient = postgres(
  `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOSTNAME}/${CONTENT_DB}`,
  { ssl: "require" },
);
const masterClient = postgres(
  `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOSTNAME}/${MASTER_DB}`,
  { ssl: "require" },
);
const contentDb = drizzle(contentClient);
const masterDb = drizzle(masterClient);

const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

const adminUserId = process.env.MIGRATE_USER_ID ?? "migration";

function gradeKey(name: string | null): string {
  return (name ?? "").trim().replace(/^grade\s+/i, "");
}

async function buildGradeNumberToIdMap(): Promise<Map<string, string>> {
  const rows = await masterDb
    .select({ id: grades.id, name: grades.grade })
    .from(grades)
    .where(and(eq(grades.active, true), eq(grades.deleted, false)));
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(gradeKey(row.name), row.id);
  }
  return map;
}

async function migrate() {
  const publicDir = path.resolve(process.cwd(), "public/azvasa");
  if (!fs.existsSync(publicDir)) {
    console.error(`Directory not found: ${publicDir}`);
    process.exit(1);
  }

  const gradeMap = await buildGradeNumberToIdMap();
  console.log(`Loaded ${gradeMap.size} active grade(s) from master DB`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const folderName of fs.readdirSync(publicDir)) {
    const gradeDir = path.join(publicDir, folderName);
    if (!fs.statSync(gradeDir).isDirectory()) continue;

    const gradeId = gradeMap.get(folderName);
    if (!gradeId) {
      console.error(
        `SKIP folder ${folderName}/ — no matching grade in master DB`,
      );
      continue;
    }

    for (const file of fs.readdirSync(gradeDir)) {
      if (!file.endsWith(".json")) continue;

      const original = file.replace(/\.json$/i, ".xlsx");
      const { subject_name, subtopic_name } = deriveBookMetadataFromFilename(original);
      const display_name = buildDisplayName(subject_name, subtopic_name);

      const subtopicCond = subtopic_name
        ? eq(content_files.subtopic_name, subtopic_name)
        : isNull(content_files.subtopic_name);

      const existing = await contentDb
        .select({ id: content_files.id })
        .from(content_files)
        .where(
          and(
            eq(content_files.grade_id, gradeId),
            eq(content_files.subject_name, subject_name),
            subtopicCond,
            eq(content_files.is_active, true),
          ),
        );

      if (existing.length > 0) {
        console.log(`SKIP ${folderName}/${file} — already migrated`);
        skipped++;
        continue;
      }

      const json = JSON.parse(fs.readFileSync(path.join(gradeDir, file), "utf8"));
      const assetCount = Array.isArray(json.assetIds) ? json.assetIds.length : 0;

      const s3_key = `tce/${gradeId}/${crypto.randomUUID()}.json`;

      try {
        await s3.send(
          new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: s3_key,
            Body: JSON.stringify(json),
            ContentType: "application/json",
          }),
        );

        await contentDb.insert(content_files).values({
          grade_id: gradeId,
          subject_name,
          subtopic_name,
          display_name,
          s3_key,
          asset_count: assetCount,
          original_filename: original,
          uploaded_by: adminUserId,
          is_active: true,
        });

        console.log(
          `OK   ${folderName}/${file} → ${s3_key} (${assetCount} assets)`,
        );
        uploaded++;
      } catch (err) {
        const message = err instanceof Error ? err.message : "unknown";
        console.error(`FAIL ${folderName}/${file}: ${message}`);
        failed++;
      }
    }
  }

  console.log(
    `\nDone. Uploaded: ${uploaded}, Skipped: ${skipped}, Failed: ${failed}`,
  );
  await contentClient.end();
  await masterClient.end();
}

migrate().catch(async (err) => {
  console.error("Migration failed:", err);
  await contentClient.end();
  await masterClient.end();
  process.exit(1);
});
