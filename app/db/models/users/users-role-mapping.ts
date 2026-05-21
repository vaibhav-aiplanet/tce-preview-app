import { pgTable } from "drizzle-orm/pg-core";

export const users_role_mapping = pgTable("users_role_mapping", (t) => ({
  id: t.char({ length: 32 }).primaryKey(),
  active: t.boolean().notNull(),
  created_at: t.bigint({ mode: "number" }),
  created_by: t.varchar({ length: 255 }),
  deleted: t.boolean().notNull(),
  last_modified_by: t.varchar({ length: 255 }),
  modified_at: t.bigint({ mode: "number" }),
  user_id: t.char({ length: 32 }),
  role_id: t.char({ length: 32 }),
}));
