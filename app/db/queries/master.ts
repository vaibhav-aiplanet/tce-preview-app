import { and, eq } from "drizzle-orm";
import { master_db } from "~/db";
import { boards } from "~/db/models/master/boards";
import { chapters } from "~/db/models/master/chapters";
import { grades } from "~/db/models/master/grades";
import { subjects } from "~/db/models/master/subjects";
import { sub_topics } from "~/db/models/master/sub-topics";

export function fetchBoards() {
  return master_db
    .select({
      id: boards.id,
      board: boards.board,
    })
    .from(boards)
    .where(and(eq(boards.active, true), eq(boards.deleted, false)));
}

export function fetchGradesByBoardId(boardId: string) {
  return master_db
    .selectDistinctOn([chapters.grade_id], {
      id: grades.id,
      grade: grades.grade,
      sort_order: grades.sort_order,
    })
    .from(chapters)
    .innerJoin(grades, eq(chapters.grade_id, grades.id))
    .where(
      and(
        eq(chapters.board_id, boardId),
        eq(grades.active, true),
        eq(grades.deleted, false),
      ),
    );
}

export function fetchSubjectsByGradeId(gradeId: string) {
  return master_db
    .selectDistinctOn([chapters.subject_id], {
      id: subjects.id,
      subject: subjects.subject,
    })
    .from(chapters)
    .innerJoin(subjects, eq(chapters.subject_id, subjects.id))
    .where(
      and(
        eq(chapters.grade_id, gradeId),
        eq(subjects.active, true),
        eq(subjects.deleted, false),
      ),
    );
}

export function fetchChaptersBySubjectId(subjectId: string) {
  return master_db
    .select({
      id: chapters.id,
      chapter: chapters.chapter,
    })
    .from(chapters)
    .where(
      and(
        eq(chapters.subject_id, subjectId),
        eq(chapters.active, true),
        eq(chapters.deleted, false),
      ),
    );
}

export function fetchSubTopicsBySubjectId(subjectId: string) {
  return master_db
    .select({
      id: sub_topics.id,
      sub_topic: sub_topics.sub_topic,
    })
    .from(sub_topics)
    .where(
      and(
        eq(sub_topics.subject_id, subjectId),
        eq(sub_topics.active, true),
        eq(sub_topics.deleted, false),
      ),
    );
}
