import { and, eq } from "drizzle-orm";
import { master_db } from "~/db";
import { grades } from "~/db/models/master/grades";

export async function loader() {
  const rows = await master_db
    .select({ id: grades.id, name: grades.grade, sortOrder: grades.sort_order })
    .from(grades)
    .where(and(eq(grades.active, true), eq(grades.deleted, false)))
    .orderBy(grades.sort_order);

  return Response.json(rows);
}
