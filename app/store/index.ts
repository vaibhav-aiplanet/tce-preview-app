import { atom, createStore, useAtom, useAtomValue, useSetAtom } from "jotai";

type StringOrNull = string | null;

const current_board = atom<StringOrNull>(null);
current_board.debugLabel = "current_board";

const current_chapter = atom<StringOrNull>(null);
current_chapter.debugLabel = "current_chapter";

const current_grade = atom<StringOrNull>(null);
current_grade.debugLabel = "current_grade";

const current_subject = atom<StringOrNull>(null);
current_subject.debugLabel = "current_subject";

const current_subtopic = atom<StringOrNull>(null);
current_subtopic.debugLabel = "current_subtopic";

const mappedToAtom = atom<"Teacher" | "Student" | "">("Teacher");
const studentTypeAtom = atom<"Study" | "Revision" | "">("");

const isMappedAtom = atom<boolean>(false);
const savingAtom = atom<boolean>(false);
const deletingAtom = atom<boolean>(false);

export const store = createStore();

export const useMappedTo = () => useAtom(mappedToAtom, { store });
export const useStudentType = () => useAtom(studentTypeAtom, { store });
export const useIsMapped = () => useAtom(isMappedAtom, { store });
export const useSaving = () => useAtom(savingAtom, { store });
export const useDeleting = () => useAtom(deletingAtom, { store });

export const useCurrentBoard = () => useAtomValue(current_board, { store });
export const useCurrentGrade = () => useAtomValue(current_grade, { store });
export const useCurrentSubject = () => useAtomValue(current_subject, { store });
export const useCurrentChapter = () => useAtomValue(current_chapter, { store });
export const useCurrentSubtopic = () => useAtomValue(current_subtopic, { store });

export const useSetCurrentBoard = () => useSetAtom(current_board, { store });
export const useSetCurrentGrade = () => useSetAtom(current_grade, { store });
export const useSetCurrentSubject = () => useSetAtom(current_subject, { store });
export const useSetCurrentChapter = () => useSetAtom(current_chapter, { store });
export const useSetCurrentSubtopic = () => useSetAtom(current_subtopic, { store });

// Curriculum selects cascade: Board → Grade → Subject → Subtopic → Chapter.
// Changing a level invalidates everything below it, so a stale lower value
// (e.g. a subtopic from the previous subject) can't scope downstream queries
// to the wrong value. Use these for user-driven changes.
//
// These guards keep pre-selection intact when a dialog opens with values
// already set (e.g. grade/subject carried over from the home page, board
// auto-selected to CBSE):
//   - ignore empty selections (a controlled Select can echo onChange("") while
//     its items load — never a real user action here);
//   - the FIRST assignment from empty is initialization/auto-select, not a user
//     switch, so don't cascade-reset (e.g. board going null → CBSE must not wipe
//     a pre-selected grade/subject);
//   - only cascade-reset when switching from one real value to another.
const selectBoardAtom = atom(null, (get, set, next: StringOrNull) => {
    if (!next) return;
    const prev = get(current_board);
    if (next === prev) return;
    set(current_board, next);
    if (!prev) return;
    set(current_grade, null);
    set(current_subject, null);
    set(current_subtopic, null);
    set(current_chapter, null);
});
const selectGradeAtom = atom(null, (get, set, next: StringOrNull) => {
    if (!next) return;
    const prev = get(current_grade);
    if (next === prev) return;
    set(current_grade, next);
    if (!prev) return;
    set(current_subject, null);
    set(current_subtopic, null);
    set(current_chapter, null);
});
const selectSubjectAtom = atom(null, (get, set, next: StringOrNull) => {
    if (!next) return;
    const prev = get(current_subject);
    if (next === prev) return;
    set(current_subject, next);
    if (!prev) return;
    set(current_subtopic, null);
    set(current_chapter, null);
});

export const useSelectBoard = () => useSetAtom(selectBoardAtom, { store });
export const useSelectGrade = () => useSetAtom(selectGradeAtom, { store });
export const useSelectSubject = () => useSetAtom(selectSubjectAtom, { store });

const resetAllAtom = atom(null, (_get, set) => {
    set(current_board, null);
    set(current_grade, null);
    set(current_subject, null);
    set(current_chapter, null);
    set(current_subtopic, null);
    set(mappedToAtom, "Teacher");
    set(studentTypeAtom, "");
    set(isMappedAtom, false);
});

export const useReset = () => useSetAtom(resetAllAtom, { store });

export const getStore = () => store;
