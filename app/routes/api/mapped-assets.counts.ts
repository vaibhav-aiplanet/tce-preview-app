import { count, sql } from "drizzle-orm";
import { content_db } from "~/db";
import { tce_asset_mapping } from "~/db/models/content/tce-asset-mapping";

export async function loader() {
  const rows = await content_db
    .select({
      status: tce_asset_mapping.status,
      count: count(),
    })
    .from(tce_asset_mapping)
    .groupBy(() => [tce_asset_mapping.status]);

  const result = { pending: 0, approved: 0, rejected: 0 };
  for (const row of rows) {
    const key = row.status.toLowerCase() as keyof typeof result;
    result[key] = Number(row.count);
  }
  return Response.json(result);
}
