import { pgTable } from "drizzle-orm/pg-core";

export const inbox = pgTable("inbox", (t) => ({
  id: t.char({ length: 32 }).primaryKey(),
  active: t.boolean().notNull(),
  created_at: t.bigint({ mode: "number" }),
  created_by: t.varchar({ length: 255 }),
  deleted: t.boolean().notNull(),
  last_modified_by: t.varchar({ length: 255 }),
  modified_at: t.bigint({ mode: "number" }),
  sender_id: t.varchar({ length: 255 }),
  sender_role: t.varchar({ length: 255 }),
  receiver_id: t.varchar({ length: 255 }),
  receiver_role: t.varchar({ length: 255 }),
  sent_datetime: t.varchar({ length: 255 }),
  message_type_id: t.varchar({ length: 255 }),
  message: t.text(),
  message_handler_route: t.varchar({ length: 255 }),
  read_by_id: t.varchar({ length: 255 }),
  read_datetime: t.varchar({ length: 255 }),
  is_read: t.boolean(),
  custom_fields: t.text(),
}));
