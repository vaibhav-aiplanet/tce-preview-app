import { and, eq } from "drizzle-orm";
import { master_db } from "~/db";
import { boards } from "~/db/models/master/boards";

export async function loader() {
  const rows = await master_db
    .select({ id: boards.id, name: boards.board })
    .from(boards)
    .where(and(eq(boards.active, true), eq(boards.deleted, false)));

  return Response.json(rows);
}
