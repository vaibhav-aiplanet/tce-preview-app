import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { content_db, master_db, users_db } from "~/db";
import { inbox } from "~/db/models/content/inbox";
import { roles } from "~/db/models/master/roles";
import { users_role_mapping } from "~/db/models/users/users-role-mapping";
import { buildInboxMessage, type BuildInboxMessageInput } from "./inbox-events";
import {
  TCE_MAPPING_HANDLER_ROUTE,
  TCE_MAPPING_MESSAGE_TYPE,
} from "~/types/inbox";

function newInboxId(): string {
  return randomUUID().replace(/-/g, "");
}

function formatSentDatetime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds(),
  )}`;
}

interface InboxInsertInput {
  senderId: string;
  senderRole: string;
  receiverId: string;
  receiverRole: string;
  message: string;
  customFields: string;
}

async function insertInboxRow(input: InboxInsertInput): Promise<void> {
  const now = Date.now();
  await content_db.insert(inbox).values({
    id: newInboxId(),
    active: true,
    deleted: false,
    created_at: now,
    modified_at: now,
    created_by: input.senderId,
    last_modified_by: input.senderId,
    sender_id: input.senderId,
    sender_role: input.senderRole,
    receiver_id: input.receiverId,
    receiver_role: input.receiverRole,
    sent_datetime: formatSentDatetime(new Date(now)),
    message_type_id: TCE_MAPPING_MESSAGE_TYPE,
    message: input.message,
    message_handler_route: TCE_MAPPING_HANDLER_ROUTE,
    is_read: false,
    custom_fields: input.customFields,
  });
}

async function resolveReviewerIds(): Promise<string[]> {
  try {
    const roleRows = await master_db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.role, "CONTENT_REVIEWER"))
      .limit(1);
    const roleId = roleRows[0]?.id;
    if (!roleId) {
      console.warn("[inbox] CONTENT_REVIEWER role not found in master.roles");
      return [];
    }
    const userRows = await users_db
      .select({ user_id: users_role_mapping.user_id })
      .from(users_role_mapping)
      .where(
        and(
          eq(users_role_mapping.role_id, roleId),
          eq(users_role_mapping.deleted, false),
          eq(users_role_mapping.active, true),
        ),
      );
    return userRows
      .map((r) => r.user_id)
      .filter((id): id is string => !!id);
  } catch (err) {
    console.error("[inbox] resolveReviewerIds failed:", err);
    return [];
  }
}

export interface NotifyReviewersInput extends BuildInboxMessageInput {
  senderId: string;
}

export async function notifyReviewers(
  _request: Request,
  input: NotifyReviewersInput,
): Promise<void> {
  try {
    const reviewerIds = await resolveReviewerIds();
    if (reviewerIds.length === 0) {
      console.warn("[inbox] no CONTENT_REVIEWER users; skipping notify");
      return;
    }
    const { message, customFields } = buildInboxMessage(input);
    await Promise.all(
      reviewerIds
        .filter((id) => id !== input.senderId)
        .map((receiverId) =>
          insertInboxRow({
            senderId: input.senderId,
            senderRole: "CONTENT_ADMIN",
            receiverId,
            receiverRole: "CONTENT_REVIEWER",
            message,
            customFields,
          }).catch((err) =>
            console.error(
              `[inbox] insert failed for reviewer ${receiverId}:`,
              err,
            ),
          ),
        ),
    );
  } catch (err) {
    console.error("[inbox] notifyReviewers failed:", err);
  }
}

export interface NotifySubmitterInput extends BuildInboxMessageInput {
  receiverId: string;
  senderId: string;
}

export async function notifySubmitter(
  _request: Request,
  input: NotifySubmitterInput,
): Promise<void> {
  try {
    if (!input.receiverId) return;
    const { message, customFields } = buildInboxMessage(input);
    await insertInboxRow({
      senderId: input.senderId,
      senderRole: "CONTENT_REVIEWER",
      receiverId: input.receiverId,
      receiverRole: "CONTENT_ADMIN",
      message,
      customFields,
    });
  } catch (err) {
    console.error("[inbox] notifySubmitter failed:", err);
  }
}

export async function markInboxRead(
  id: string,
  readBy: string,
): Promise<boolean> {
  try {
    const now = Date.now();
    const result = await content_db
      .update(inbox)
      .set({
        is_read: true,
        read_by_id: readBy,
        read_datetime: formatSentDatetime(new Date(now)),
        modified_at: now,
        last_modified_by: readBy,
      })
      .where(eq(inbox.id, id))
      .returning({ id: inbox.id });
    return result.length > 0;
  } catch (err) {
    console.error("[inbox] markInboxRead failed:", err);
    return false;
  }
}
