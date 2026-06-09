import { Button, Modal } from "@heroui/react";

export interface MappedDetails {
  grade?: string | null;
  subject?: string | null;
  chapter?: string | null;
  subtopic?: string | null;
  consumer?: string | null;
}

interface ReviewResultDialogProps {
  /** Whether the dialog is shown. */
  open: boolean;
  /** Which review outcome this dialog reports. */
  variant: "approved" | "rejected";
  /** Asset title. */
  title?: string | null;
  /** Resolved curriculum mapping for the asset. */
  mapped: MappedDetails;
  /** Rejection reason — only used when variant is "rejected". */
  reason?: string | null;
  /** Called when the dialog is dismissed (Done button or backdrop). */
  onClose: () => void;
}

const ROWS: { label: string; key: keyof MappedDetails }[] = [
  { label: "Grade", key: "grade" },
  { label: "Subject", key: "subject" },
  { label: "Chapter", key: "chapter" },
  { label: "Subtopic", key: "subtopic" },
  { label: "Consumer", key: "consumer" },
];

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export default function ReviewResultDialog({
  open,
  variant,
  title,
  mapped,
  reason,
  onClose,
}: ReviewResultDialogProps) {
  if (!open) return null;

  const isApproved = variant === "approved";

  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      variant="blur"
    >
      <Modal.Container size="sm" placement="center">
        <Modal.Dialog>
          <Modal.Header>
            <div className="flex items-center gap-2.5">
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                  isApproved
                    ? "bg-success/15 text-success"
                    : "bg-danger/15 text-danger"
                }`}
              >
                {isApproved ? <CheckIcon /> : <CrossIcon />}
              </span>
              <Modal.Heading>
                {isApproved ? "Approved successfully" : "Submission rejected"}
              </Modal.Heading>
            </div>
          </Modal.Header>

          <Modal.Body className="flex flex-col gap-3 px-5 py-3">
            <p className="text-base font-semibold text-foreground">
              {title || "This submission"}
            </p>

            {/* Only an approved submission is actually mapped — showing this
                for a rejected one would misrepresent the asset's state. */}
            {isApproved && (
              <div className="flex flex-col gap-2 text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Mapped to
                </p>
                <dl className="flex flex-col gap-2 rounded-md border border-border/40 bg-muted/20 px-3 py-2.5">
                  {ROWS.map(({ label, key }) => (
                    <div key={key} className="flex gap-3">
                      <dt className="w-24 shrink-0 text-muted">{label}</dt>
                      <dd className="font-medium text-foreground">
                        {mapped[key] || "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {!isApproved && (
              <div className="flex flex-col gap-1.5 rounded-md border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-danger">
                  Rejected because
                </p>
                <p className="whitespace-pre-wrap text-foreground">
                  {reason?.trim() || "No reason provided."}
                </p>
              </div>
            )}
          </Modal.Body>

          <Modal.Footer className="flex justify-end gap-2">
            <Button size="sm" variant="primary" onPress={onClose}>
              Done
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
