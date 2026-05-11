import { useState } from "react";
import { Button, Modal, Spinner, TextArea } from "@heroui/react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ReviewConflictError,
  reviewMapping,
  type AssetMapping,
} from "~/lib/curriculum-api";
import { useUser } from "~/lib/auth";

interface ReviewActionsProps {
  assetId: string;
  mapping: AssetMapping | null | undefined;
}

export default function ReviewActions({ assetId, mapping }: ReviewActionsProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState<"approve" | "reject" | null>(
    null,
  );
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isPending = mapping?.status === "PENDING";
  const canReview = !!mapping && isPending && !submitting;

  const user = useUser();
  const reviewedBy = user?.userName ?? "";

  const afterReview = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["mapping", assetId] }),
      qc.invalidateQueries({ queryKey: ["mapped-assets"] }),
    ]);
    navigate("/mapped-assets");
  };

  const handleApprove = async () => {
    if (!canReview) return;
    setSubmitting("approve");
    setError(null);
    try {
      await reviewMapping(assetId, "approve", reviewedBy);
      await afterReview();
    } catch (err) {
      if (err instanceof ReviewConflictError) {
        setError(
          "This submission was changed by someone else. Refreshing…",
        );
        await qc.invalidateQueries({ queryKey: ["mapping", assetId] });
      } else {
        setError(err instanceof Error ? err.message : "Approval failed");
      }
    } finally {
      setSubmitting(null);
    }
  };

  const handleReject = async () => {
    if (!canReview || !reason.trim()) return;
    setSubmitting("reject");
    setError(null);
    try {
      await reviewMapping(assetId, "reject", reviewedBy, reason.trim());
      setRejectOpen(false);
      setReason("");
      await afterReview();
    } catch (err) {
      if (err instanceof ReviewConflictError) {
        setError(
          "This submission was changed by someone else. Refreshing…",
        );
        await qc.invalidateQueries({ queryKey: ["mapping", assetId] });
        setRejectOpen(false);
      } else {
        setError(err instanceof Error ? err.message : "Rejection failed");
      }
    } finally {
      setSubmitting(null);
    }
  };

  if (!mapping) {
    return (
      <p className="text-sm text-muted">No mapping submitted for this asset.</p>
    );
  }

  if (!isPending) {
    return (
      <p className="text-sm text-muted">
        This submission has already been{" "}
        {mapping.status === "APPROVED" ? "approved" : "reviewed"}.
      </p>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="primary"
          onPress={handleApprove}
          isDisabled={!canReview}
          isPending={submitting === "approve"}
        >
          {({ isPending: pending }) => (
            <>
              {pending && <Spinner color="current" size="sm" />}
              {submitting === "approve" ? "Approving..." : "Approve"}
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="danger"
          onPress={() => setRejectOpen(true)}
          isDisabled={!canReview}
        >
          Reject
        </Button>
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>

      {rejectOpen && (
        <Modal.Backdrop
          isOpen={rejectOpen}
          onOpenChange={(open) => {
            if (!open && submitting !== "reject") {
              setRejectOpen(false);
              setReason("");
              setError(null);
            }
          }}
          variant="blur"
        >
          <Modal.Container size="md" placement="center">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Reject submission</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-3 px-5 py-3">
                <p className="text-sm text-muted">
                  The Content Admin will see this reason on their Rejected tab.
                </p>
                <TextArea
                  rows={5}
                  placeholder="Why is this submission being rejected?"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full min-h-32 resize-none px-3 py-2 text-sm"
                />
                {error && <p className="text-sm text-danger">{error}</p>}
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => {
                    setRejectOpen(false);
                    setReason("");
                    setError(null);
                  }}
                  isDisabled={submitting === "reject"}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onPress={handleReject}
                  isDisabled={!reason.trim() || submitting === "reject"}
                  isPending={submitting === "reject"}
                >
                  {({ isPending: pending }) => (
                    <>
                      {pending && <Spinner color="current" size="sm" />}
                      {submitting === "reject" ? "Rejecting..." : "Reject"}
                    </>
                  )}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      )}
    </>
  );
}
