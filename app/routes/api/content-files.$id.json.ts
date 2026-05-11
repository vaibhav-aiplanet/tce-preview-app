import { and, eq } from "drizzle-orm";
import { content_db } from "~/db";
import { content_files } from "~/db/models/content/content-files";
import { getJson } from "~/lib/s3";
import type { Route } from "./+types/content-files.$id.json";

export async function loader({ params }: Route.LoaderArgs) {
  const id = params.id;
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  const row = (
    await content_db
      .select({
        s3_key: content_files.s3_key,
        is_active: content_files.is_active,
      })
      .from(content_files)
      .where(and(eq(content_files.id, id), eq(content_files.is_active, true)))
      .limit(1)
  )[0];

  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const data = await getJson(row.s3_key);
    return Response.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: `Failed to fetch from S3: ${message}` },
      { status: 502 },
    );
  }
}
