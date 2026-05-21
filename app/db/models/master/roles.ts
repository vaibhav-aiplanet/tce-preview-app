import { pgTable } from "drizzle-orm/pg-core";

export const roles = pgTable("roles", (t) => ({
  id: t.char({ length: 32 }).primaryKey(),
  active: t.boolean().notNull(),
  created_at: t.bigint({ mode: "number" }),
  created_by: t.varchar({ length: 255 }),
  deleted: t.boolean().notNull(),
  last_modified_by: t.varchar({ length: 255 }),
  modified_at: t.bigint({ mode: "number" }),
  role: t.varchar({ length: 255 }),
  discription: t.varchar({ length: 255 }),
  sort_order: t.integer().unique(),
  admin_role: t.boolean(),
}));
