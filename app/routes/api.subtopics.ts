import { and, eq } from "drizzle-orm";
import { master_db } from "~/db";
import { sub_topics } from "~/db/models/master/sub-topics";
import type { Route } from "./+types/api.subtopics";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const subjectId = url.searchParams.get("subjectId");

  if (!subjectId) {
    return Response.json([]);
  }

  const rows = await master_db
    .select({ id: sub_topics.id, name: sub_topics.sub_topic })
    .from(sub_topics)
    .where(
      and(
        eq(sub_topics.subject_id, subjectId),
        eq(sub_topics.active, true),
        eq(sub_topics.deleted, false),
      ),
    );

  return Response.json(rows);
}
