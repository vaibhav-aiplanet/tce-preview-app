import { and, eq } from "drizzle-orm";
import { content_db } from "~/db";
import { tce_asset_mapping } from "~/db/models/content/tce-asset-mapping";
import { chapter_assets } from "~/db/models/content/chapter-assets";
import type { Route } from "./+types/api.mapping.review";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const body = (await request.json()) as {
    assetId?: string;
    action?: "approve" | "reject";
    reason?: string;
    reviewedBy?: string;
  };

  const { assetId, action: reviewAction, reason, reviewedBy } = body;

  if (!assetId || !reviewAction || !reviewedBy) {
    return Response.json(
      { error: "Missing assetId, action, or reviewedBy" },
      { status: 400 },
    );
  }

  if (reviewAction !== "approve" && reviewAction !== "reject") {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  if (reviewAction === "reject" && (!reason || !reason.trim())) {
    return Response.json(
      { error: "Rejection reason is required" },
      { status: 400 },
    );
  }

  // Use a single optimistic update guarded by status='PENDING'. If no row was
  // updated, the submission is no longer pending (admin re-edited, or another
  // reviewer just acted on it) and we surface a 409 so the client refetches.
  const updated = await content_db.transaction(async (tx) => {
    const rows = await tx
      .update(tce_asset_mapping)
      .set(
        reviewAction === "approve"
          ? {
              status: "APPROVED",
              rejection_reason: null,
              reviewed_by: reviewedBy,
              reviewed_at: new Date(),
            }
          : {
              status: "REJECTED",
              rejection_reason: (reason ?? "").trim(),
              reviewed_by: reviewedBy,
              reviewed_at: new Date(),
            },
      )
      .where(
        and(
          eq(tce_asset_mapping.asset_id, assetId),
          eq(tce_asset_mapping.status, "PENDING"),
        ),
      )
      .returning({ chapter_asset_id: tce_asset_mapping.chapter_asset_id });

    if (rows.length === 0) return null;

    // Approval flips chapter_assets.active=true so LMS-side consumers see the
    // mapping go live. Rejection leaves it inactive (it was already false from
    // the admin's submission).
    if (reviewAction === "approve" && rows[0].chapter_asset_id) {
      await tx
        .update(chapter_assets)
        .set({
          active: true,
          modified_at: Date.now(),
          last_modified_by: reviewedBy,
        })
        .where(eq(chapter_assets.id, rows[0].chapter_asset_id));
    }

    return rows[0];
  });

  if (!updated) {
    return Response.json(
      { error: "Submission is no longer pending" },
      { status: 409 },
    );
  }

  return Response.json({ ok: true });
}
