import { type CurriculumItem } from "~/lib/curriculum-api";

export interface CurriculumFiltersProps {
    assetId: string;
    asset?: {
        title: string;
        mimeType: string;
        assetType: string;
        subType: string;
    };
}

export type CurriculumState = {
    subjects: CurriculumItem[];
    chapters: CurriculumItem[];
    subtopics: CurriculumItem[];
    selectedBoard: string;
    selectedGrade: string;
    selectedSubject: string;
    selectedChapter: string;
    selectedSubtopic: string;
    mappedTo: "Teacher" | "Student" | "";
    studentType: "Study" | "Revision" | "";
    isMapped: boolean;
    saving: boolean;
    deleting: boolean;
};

export type CurriculumAction =
    | {
        type: "INIT_MAPPING";
        selectedBoard: string;
        mapping: {
            gradeId: string;
            subjectId: string;
            chapterId: string;
            subtopicId: string;
            mappedTo?: "Teacher" | "Student";
            studentType?: "Study" | "Revision";
        };
        subjects: CurriculumItem[];
        chapters: CurriculumItem[];
        subtopics: CurriculumItem[];
    }
    | { type: "INIT_NO_MAPPING" }
    | {
        type: "INIT_PRESELECT";
        selectedBoard: string;
        selectedGrade: string;
        selectedSubject: string;
        selectedSubtopic: string;
        subjects: CurriculumItem[];
        chapters: CurriculumItem[];
        subtopics: CurriculumItem[];
    }
    | { type: "SELECT_BOARD"; board: string }
    | { type: "SELECT_GRADE"; grade: string }
    | { type: "SET_SUBJECTS"; subjects: CurriculumItem[] }
    | { type: "SELECT_SUBJECT"; subject: string }
    | {
        type: "SET_CHAPTERS_AND_SUBTOPICS";
        chapters: CurriculumItem[];
        subtopics: CurriculumItem[];
    }
    | { type: "SELECT_CHAPTER"; chapter: string }
    | { type: "SELECT_SUBTOPIC"; subtopic: string }
    | { type: "SELECT_MAPPED_TO"; mappedTo: "Teacher" | "Student" }
    | { type: "SELECT_STUDENT_TYPE"; studentType: "Study" | "Revision" }
    | { type: "SET_MAPPED"; isMapped: boolean }
    | { type: "SET_SAVING"; saving: boolean }
    | { type: "SET_DELETING"; deleting: boolean };

