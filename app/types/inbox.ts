export type MappingAction = "SUBMITTED" | "APPROVED" | "REJECTED";

export interface InboxMessage {
  id: string;
  senderId: string | null;
  senderRole: string | null;
  receiverId: string;
  receiverRole: string | null;
  sent_Datetime: string;
  readDatetime: string | null;
  messagetypeid: string;
  messageHandlerRoute: string;
  message: string;
  customFields: string | null;
  isRead: boolean;
}

export interface InboxResponse {
  code: string;
  status: string;
  count: number;
  messages: InboxMessage[];
}

export const TCE_MAPPING_MESSAGE_TYPE = "TCE_MAPPING";
export const TCE_MAPPING_HANDLER_ROUTE = "mapped-assets";
