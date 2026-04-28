import { Chip } from "@heroui/react";
import type { MappingStatus } from "~/lib/curriculum-api";

const STATUS_LABEL: Record<MappingStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const STATUS_COLOR: Record<MappingStatus, "warning" | "success" | "danger"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

export default function StatusBadge({ status }: { status: MappingStatus }) {
  return (
    <Chip
      color={STATUS_COLOR[status]}
      variant="soft"
      size="sm"
      className="w-fit text-xs"
    >
      {STATUS_LABEL[status]}
    </Chip>
  );
}
