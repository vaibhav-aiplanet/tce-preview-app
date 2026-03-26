import type { CurriculumAction, CurriculumState } from "./types"

export default function curriculumReducer(
    state: CurriculumState,
    action: CurriculumAction,
): CurriculumState {
    switch (action.type) {
        case "INIT_MAPPING":
            return {
                ...state,
                isMapped: true,
                selectedBoard: action.selectedBoard,
                selectedGrade: action.mapping.gradeId || "",
                selectedSubject: action.mapping.subjectId,
                selectedChapter: action.mapping.chapterId,
                selectedSubtopic: action.mapping.subtopicId,
                subjects: action.subjects,
                chapters: action.chapters,
                subtopics: action.subtopics,
                mappedTo: action.mapping.mappedTo || "Teacher",
                studentType: action.mapping.studentType || "",
            };

        case "INIT_NO_MAPPING":
            return {
                ...state,
                isMapped: false,
                selectedBoard: "",
                selectedGrade: "",
                selectedSubject: "",
                selectedChapter: "",
                selectedSubtopic: "",
                subjects: [],
                chapters: [],
                subtopics: [],
            };

        case "INIT_PRESELECT":
            return {
                ...state,
                isMapped: false,
                selectedBoard: action.selectedBoard,
                selectedGrade: action.selectedGrade,
                selectedSubject: action.selectedSubject,
                selectedSubtopic: action.selectedSubtopic,
                subjects: action.subjects,
                chapters: action.chapters,
                subtopics: action.subtopics,
            };

        case "SELECT_BOARD":
            return {
                ...state,
                selectedBoard: action.board,
            };

        case "SELECT_GRADE":
            return {
                ...state,
                selectedGrade: action.grade,
                subjects: [],
                selectedSubject: "",
                chapters: [],
                selectedChapter: "",
                subtopics: [],
                selectedSubtopic: "",
            };

        case "SET_SUBJECTS":
            return {
                ...state,
                subjects: action.subjects,
            };

        case "SELECT_SUBJECT":
            return {
                ...state,
                selectedSubject: action.subject,
                chapters: [],
                selectedChapter: "",
                subtopics: [],
                selectedSubtopic: "",
            };

        case "SET_CHAPTERS_AND_SUBTOPICS":
            return {
                ...state,
                chapters: action.chapters,
                subtopics: action.subtopics,
            };

        case "SELECT_CHAPTER":
            return {
                ...state,
                selectedChapter: action.chapter,
            };

        case "SELECT_SUBTOPIC":
            return { ...state, selectedSubtopic: action.subtopic };

        case "SELECT_MAPPED_TO":
            return {
                ...state,
                mappedTo: action.mappedTo,
                studentType: action.mappedTo === "Student" ? state.studentType : "",
            };

        case "SELECT_STUDENT_TYPE":
            return { ...state, studentType: action.studentType };

        case "SET_MAPPED":
            return { ...state, isMapped: action.isMapped };

        case "SET_SAVING":
            return { ...state, saving: action.saving };

        case "SET_DELETING":
            return { ...state, deleting: action.deleting };

        default:
            return state;
    }
}
