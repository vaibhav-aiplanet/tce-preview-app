import { index, pgTable } from "drizzle-orm/pg-core";
import { boards } from "./boards";
import { grades } from "./grades";
import { subjects } from "./subjects";
import { sub_topics } from "./sub-topics";

export const subject_mapping = pgTable(
  "subject_mapping",
  (t) => ({
    id: t.char({ length: 32 }).primaryKey(),
    active: t.boolean().notNull(),
    created_at: t.bigint({ mode: "number" }),
    created_by: t.varchar({ length: 255 }),
    deleted: t.boolean().notNull(),
    last_modified_by: t.varchar({ length: 255 }),
    modified_at: t.bigint({ mode: "number" }),
    skilled_subject: t.boolean().default(true),
    boards_id: t.char({ length: 32 }).references(() => boards.id),
    grades_id: t.char({ length: 32 }).references(() => grades.id),
    sub_topics_id: t.char({ length: 32 }).references(() => sub_topics.id),
    subjects_id: t.char({ length: 32 }).references(() => subjects.id),
  }),
  (table) => [
    index("subject_mapping_id_index").on(table.id),
    index("subject_mapping_board_grade_subject_index").on(
      table.boards_id,
      table.grades_id,
      table.subjects_id,
    ),
  ],
);
