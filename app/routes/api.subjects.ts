import { and, eq } from "drizzle-orm";
import { master_db } from "~/db";
import { subjects } from "~/db/models/master/subjects";

export async function loader() {
  const rows = await master_db
    .select({ id: subjects.id, name: subjects.subject })
    .from(subjects)
    .where(and(eq(subjects.active, true), eq(subjects.deleted, false)));

  return Response.json(rows);
}
