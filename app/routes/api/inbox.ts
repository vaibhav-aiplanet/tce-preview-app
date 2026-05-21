import { and, desc, eq, inArray } from "drizzle-orm";
import { content_db } from "~/db";
import { inbox } from "~/db/models/content/inbox";
import {
  AuthError,
  authErrorResponse,
  requireUser,
} from "~/lib/server-auth";
import {
  TCE_MAPPING_MESSAGE_TYPE,
  type InboxMessage,
  type InboxResponse,
} from "~/types/inbox";
import type { Route } from "./+types/inbox";

const ALLOWED_ROLES = new Set(["CONTENT_ADMIN", "CONTENT_REVIEWER"]);
const INBOX_LIMIT = 30;

export async function loader({ request }: Route.LoaderArgs) {
  let user;
  let setCookieHeaders: Headers | null = null;
  try {
    const result = await requireUser(request);
    user = result.user;
    setCookieHeaders = result.setCookieHeaders;
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err);
    throw err;
  }

  if (!ALLOWED_ROLES.has(user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // tce_asset_mapping.created_by stores user_name (per the FE SaveMappingButton),
  // so admin notifications land under user_name. Reviewer notifications land
  // under user.id (resolved via users_role_mapping). Match either.
  const receiverIds = [user.id, user.userName].filter((v): v is string => !!v);

  let messages: InboxMessage[] = [];
  try {
    const rows = await content_db
      .select()
      .from(inbox)
      .where(
        and(
          inArray(inbox.receiver_id, receiverIds),
          eq(inbox.message_type_id, TCE_MAPPING_MESSAGE_TYPE),
          eq(inbox.deleted, false),
        ),
      )
      .orderBy(desc(inbox.created_at))
      .limit(INBOX_LIMIT);

    messages = rows.map((r) => ({
      id: r.id,
      senderId: r.sender_id,
      senderRole: r.sender_role,
      receiverId: r.receiver_id ?? user.id,
      receiverRole: r.receiver_role,
      sent_Datetime: r.sent_datetime ?? "",
      readDatetime: r.read_datetime,
      messagetypeid: r.message_type_id ?? TCE_MAPPING_MESSAGE_TYPE,
      messageHandlerRoute: r.message_handler_route ?? "mapped-assets",
      message: r.message ?? "",
      customFields: r.custom_fields,
      isRead: r.is_read ?? false,
    }));
  } catch (err) {
    console.error("[inbox] loader DB query failed:", err);
  }

  const payload: InboxResponse = {
    code: "200",
    status: "Inbox retrieved successfully",
    count: messages.length,
    messages,
  };

  return Response.json(
    payload,
    setCookieHeaders ? { headers: setCookieHeaders } : undefined,
  );
}
