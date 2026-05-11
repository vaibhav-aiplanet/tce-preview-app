import { and, eq, isNull } from "drizzle-orm";
import { content_db } from "~/db";
import { content_files } from "~/db/models/content/content-files";
import {
  buildDisplayName,
  parseExcelToBook,
} from "~/lib/excel-parser";
import { putJson } from "~/lib/s3";
import {
  AuthError,
  authErrorResponse,
  requireContentAdmin,
} from "~/lib/server-auth";
import type { Route } from "./+types/content-files.upload";

type UploadResult = {
  filename: string;
  ok: boolean;
  id?: string;
  error?: string;
  asset_count?: number;
};

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let user;
  try {
    user = await requireContentAdmin(request);
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err);
    throw err;
  }

  const formData = await request.formData();
  const gradeId = String(formData.get("gradeId") ?? "").trim().replace(/-/g, "");
  if (!gradeId || gradeId.length !== 32) {
    return Response.json(
      { error: "Missing or invalid 'gradeId' (expected 32-char id)" },
      { status: 400 },
    );
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return Response.json({ error: "No files provided" }, { status: 400 });
  }

  const results = await Promise.all(
    files.map(async (file): Promise<UploadResult> => {
      try {
        if (!/\.xlsx?$/i.test(file.name)) {
          return { filename: file.name, ok: false, error: "Not an .xlsx file" };
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const book = parseExcelToBook(buffer, file.name);

        if (!book.subject_name) {
          return {
            filename: file.name,
            ok: false,
            error:
              "Could not derive subject_name from filename (expected 'Subject-Subtopic-…' or 'Subject-NA-…')",
          };
        }

        const display_name = buildDisplayName(book.subject_name, book.subtopic_name);

        // Deactivate any existing active row for this (grade_id, subject, subtopic)
        const subtopicCond = book.subtopic_name
          ? eq(content_files.subtopic_name, book.subtopic_name)
          : isNull(content_files.subtopic_name);

        await content_db
          .update(content_files)
          .set({ is_active: false })
          .where(
            and(
              eq(content_files.grade_id, gradeId),
              eq(content_files.subject_name, book.subject_name),
              subtopicCond,
              eq(content_files.is_active, true),
            ),
          );

        // Upload the parsed JSON to S3 under a unique key
        const s3_key = `tce/${gradeId}/${crypto.randomUUID()}.json`;
        await putJson(s3_key, {
          subject_name: book.subject_name,
          subtopic_name: book.subtopic_name,
          assetIds: book.assetIds,
        });

        const inserted = await content_db
          .insert(content_files)
          .values({
            grade_id: gradeId,
            subject_name: book.subject_name,
            subtopic_name: book.subtopic_name,
            display_name,
            s3_key,
            asset_count: book.assetIds.length,
            original_filename: file.name,
            uploaded_by: user.id,
            is_active: true,
          })
          .returning({ id: content_files.id });

        return {
          filename: file.name,
          ok: true,
          id: inserted[0]?.id,
          asset_count: book.assetIds.length,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return { filename: file.name, ok: false, error: message };
      }
    }),
  );

  return Response.json({ uploaded: results });
}
