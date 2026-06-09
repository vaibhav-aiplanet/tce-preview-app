import { useMemo, useState } from "react";
import { Button, Modal, Spinner, TextArea } from "@heroui/react";
import { useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchChapters,
  fetchSubjects,
  fetchSubtopics,
  ReviewConflictError,
  reviewMapping,
  type AssetMapping,
  type CurriculumItem,
} from "~/lib/curriculum-api";
import { useUser } from "~/lib/auth";
import ReviewResultDialog from "~/components/ReviewResultDialog";
import {
  useCurrentBoard,
  useCurrentChapter,
  useCurrentGrade,
  useCurrentSubject,
  useCurrentSubtopic,
} from "~/store";

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
  const [result, setResult] = useState<{
    variant: "approved" | "rejected";
    reason?: string;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isPending = mapping?.status === "PENDING";
  const canReview = !!mapping && isPending && !submitting;

  const user = useUser();
  const reviewedBy = user?.userName ?? "";

  // Resolve the mapped curriculum IDs to display names. These query keys match
  // the curriculum selects, so they're served from cache (no extra fetch).
  const board = useCurrentBoard();
  const grade = useCurrentGrade();
  const subject = useCurrentSubject();
  const chapter = useCurrentChapter();
  const subtopic = useCurrentSubtopic();

  const { data: grades = [] } = useQuery<CurriculumItem[]>({
    queryKey: ["grades"],
    queryFn: () => fetch("/_api/grades").then((r) => r.json()),
    staleTime: Infinity,
  });
  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects", board, grade],
    queryFn: () => fetchSubjects(board || "", grade || ""),
    enabled: !!subject,
    staleTime: 5 * 60 * 1000,
  });
  const { data: chapters = [] } = useQuery({
    queryKey: ["chapters", subject, board, grade],
    queryFn: () => fetchChapters(subject || "", board || "", grade || ""),
    enabled: !!subject,
    staleTime: 5 * 60 * 1000,
  });
  const { data: subtopics = [] } = useQuery({
    queryKey: ["subtopics", subject],
    queryFn: () => fetchSubtopics(subject || ""),
    enabled: !!subject,
    staleTime: 5 * 60 * 1000,
  });

  const nameOf = (items: CurriculumItem[], id: string | null) =>
    (id && items.find((i) => i.id === id)?.name) || null;

  const mapped = useMemo(
    () => ({
      grade: nameOf(grades, grade),
      subject: nameOf(subjects, subject),
      chapter: nameOf(chapters, chapter),
      subtopic: nameOf(subtopics, subtopic),
    }),
    [grades, subjects, chapters, subtopics, grade, subject, chapter, subtopic],
  );

  const consumer = mapping?.mappedTo
    ? mapping.studentType
      ? `${mapping.mappedTo} (${mapping.studentType})`
      : mapping.mappedTo
    : null;

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
      setResult({ variant: "approved" });
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
    const trimmed = reason.trim();
    if (!canReview || !trimmed) return;
    setSubmitting("reject");
    setError(null);
    try {
      await reviewMapping(assetId, "reject", reviewedBy, trimmed);
      setRejectOpen(false);
      setReason("");
      setResult({ variant: "rejected", reason: trimmed });
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

      <ReviewResultDialog
        open={!!result}
        variant={result?.variant ?? "approved"}
        title={mapping.title}
        mapped={{ ...mapped, consumer }}
        reason={result?.reason}
        onClose={() => {
          setResult(null);
          void afterReview();
        }}
      />

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
