import type { MappingAction } from "~/types/inbox";

function sanitizeCustomFieldValue(value: string): string {
  return value.replace(/[#:]/g, " ").trim();
}

export interface BuildInboxMessageInput {
  action: MappingAction;
  assetId: string;
  title: string;
  reason?: string;
}

export interface BuiltInboxMessage {
  message: string;
  customFields: string;
}

export function buildInboxMessage({
  action,
  assetId,
  title,
  reason,
}: BuildInboxMessageInput): BuiltInboxMessage {
  const displayTitle = title || assetId;
  let message: string;
  switch (action) {
    case "SUBMITTED":
      message = `"${displayTitle}" was submitted for review`;
      break;
    case "APPROVED":
      message = `"${displayTitle}" has been approved`;
      break;
    case "REJECTED": {
      const trimmedReason = reason?.trim();
      message = trimmedReason
        ? `"${displayTitle}" was rejected: ${trimmedReason}`
        : `"${displayTitle}" was rejected`;
      break;
    }
  }

  const fields: string[] = [
    `assetId:${sanitizeCustomFieldValue(assetId)}`,
    `title:${sanitizeCustomFieldValue(displayTitle)}`,
    `action:${action}`,
  ];
  if (action === "REJECTED" && reason && reason.trim()) {
    fields.push(`reason:${sanitizeCustomFieldValue(reason)}`);
  }

  return { message, customFields: fields.join("#") };
}

export function parseCustomFields(
  raw: string | null | undefined,
): Record<string, string> {
  if (!raw) return {};
  const out: Record<string, string> = {};
  for (const pair of raw.split("#")) {
    const idx = pair.indexOf(":");
    if (idx < 0) continue;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (key) out[key] = value;
  }
  return out;
}
