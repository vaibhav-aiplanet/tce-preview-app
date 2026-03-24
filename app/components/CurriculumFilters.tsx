import { useReducer, useEffect, useRef } from "react";
import { Button, Select, ListBox, Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchSubjects,
  fetchChapters,
  fetchSubtopics,
  fetchMapping,
  saveMapping,
  deleteMapping,
  type CurriculumItem,
} from "~/lib/curriculum-api";

interface CurriculumFiltersProps {
  assetId: string;
  asset?: {
    title: string;
    mimeType: string;
    assetType: string;
    subType: string;
  };
}

type CurriculumState = {
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

type CurriculumAction =
  | {
      type: "INIT_MAPPING";
      mapping: {
        gradeId: string;
        subjectId: string;
        chapterId: string;
        subtopicId: string;
      };
      chapters: CurriculumItem[];
      subtopics: CurriculumItem[];
    }
  | { type: "INIT_NO_MAPPING" }
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

const initialState: CurriculumState = {
  subjects: [],
  chapters: [],
  subtopics: [],
  selectedBoard: "",
  selectedGrade: "",
  selectedSubject: "",
  selectedChapter: "",
  selectedSubtopic: "",
  mappedTo: "Teacher",
  studentType: "",
  isMapped: false,
  saving: false,
  deleting: false,
};

function curriculumReducer(
  state: CurriculumState,
  action: CurriculumAction,
): CurriculumState {
  switch (action.type) {
    case "INIT_MAPPING":
      return {
        ...state,
        isMapped: true,
        selectedGrade: action.mapping.gradeId || "",
        selectedSubject: action.mapping.subjectId,
        selectedChapter: action.mapping.chapterId,
        selectedSubtopic: action.mapping.subtopicId,
        chapters: action.chapters,
        subtopics: action.subtopics,
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

    case "SELECT_BOARD":
      return {
        ...state,
        selectedBoard: action.board,
        subjects: [],
        selectedSubject: "",
        chapters: [],
        selectedChapter: "",
        subtopics: [],
        selectedSubtopic: "",
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
        selectedSubtopic: "",
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

export default function CurriculumFilters({
  assetId,
  asset,
}: CurriculumFiltersProps) {
  const [state, dispatch] = useReducer(curriculumReducer, initialState);
  const {
    subjects,
    chapters,
    subtopics,
    selectedBoard,
    selectedGrade,
    selectedSubject,
    selectedChapter,
    selectedSubtopic,
    mappedTo,
    studentType,
    isMapped,
    saving,
    deleting,
  } = state;

  // Track whether we're in the middle of initializing from a mapping
  // to avoid redundant fetches from the subjects/chapters effects
  const initializingRef = useRef(false);

  const { data: boards = [] } = useQuery<CurriculumItem[]>({
    queryKey: ["boards"],
    queryFn: () => fetch("/_api/boards").then((r) => r.json()),
    staleTime: Infinity,
  });

  const { data: grades = [] } = useQuery<CurriculumItem[]>({
    queryKey: ["grades"],
    queryFn: () => fetch("/_api/grades").then((r) => r.json()),
    staleTime: Infinity,
  });

  // Load existing mapping when assetId changes
  useEffect(() => {
    let cancelled = false;
    initializingRef.current = true;

    async function init() {
      const mapping = await fetchMapping(assetId);
      if (cancelled) return;

      if (!mapping) {
        dispatch({ type: "INIT_NO_MAPPING" });
        initializingRef.current = false;
        return;
      }

      const [ch, st] = await Promise.all([
        fetchChapters(mapping.subjectId, "", mapping.gradeId || ""),
        fetchSubtopics(mapping.subjectId),
      ]);

      if (cancelled) return;
      dispatch({ type: "INIT_MAPPING", mapping, chapters: ch, subtopics: st });
      initializingRef.current = false;
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  // Fetch subjects when board + grade are selected
  useEffect(() => {
    if (!selectedBoard || !selectedGrade) return;
    if (initializingRef.current) return;

    fetchSubjects(selectedBoard, selectedGrade).then((data) => {
      dispatch({ type: "SET_SUBJECTS", subjects: data });
    });
  }, [selectedBoard, selectedGrade]);

  // Fetch chapters + subtopics when subject is selected
  useEffect(() => {
    if (!selectedSubject) return;
    if (initializingRef.current) return;

    const needsBoard = selectedBoard && selectedGrade;
    Promise.all([
      needsBoard
        ? fetchChapters(selectedSubject, selectedBoard, selectedGrade)
        : fetchChapters(selectedSubject, "", selectedGrade),
      fetchSubtopics(selectedSubject),
    ]).then(([ch, st]) => {
      dispatch({
        type: "SET_CHAPTERS_AND_SUBTOPICS",
        chapters: ch,
        subtopics: st,
      });
    });
  }, [selectedSubject, selectedBoard, selectedGrade]);

  const canSave =
    selectedSubject &&
    selectedChapter &&
    (mappedTo !== "Student" || studentType);

  const handleDelete = async () => {
    try {
      dispatch({ type: "SET_DELETING", deleting: true });
      await deleteMapping(assetId);
      dispatch({ type: "INIT_NO_MAPPING" });
    } catch (error) {
      console.error(error);
    } finally {
      dispatch({ type: "SET_DELETING", deleting: false });
    }
  };

  const handleSave = async () => {
    try {
      if (!canSave) return;
      dispatch({ type: "SET_SAVING", saving: true });

      const profile_data = JSON.parse(
        sessionStorage.getItem("profile") || "{}",
      );

      await saveMapping(assetId, {
        gradeId: selectedGrade,
        subjectId: selectedSubject,
        chapterId: selectedChapter,
        subtopicId: selectedSubtopic,
        createdBy: profile_data.userName,
        title: asset?.title || "",
        mimeType: asset?.mimeType || "",
        assetType: asset?.assetType || "",
        subType: asset?.subType || "",
        mappedTo: mappedTo || undefined,
        studentType: (studentType as "Study" | "Revision") || undefined,
      });
      dispatch({ type: "SET_MAPPED", isMapped: true });
    } catch (error) {
      console.error(error);
      dispatch({ type: "SET_MAPPED", isMapped: false });
    } finally {
      dispatch({ type: "SET_SAVING", saving: false });
    }
  };

  return (
    <div className="flex w-full flex-col border-b border-border/40">
      {/* Row 1: Map to + Student type — 2 equal columns */}
      <div className="grid grid-cols-6 gap-3 px-4 py-2">
        <div className="flex flex-col gap-1">
          <Select
            className="w-full"
            placeholder="Consumer"
            value={mappedTo || null}
            onChange={(value) =>
              dispatch({
                type: "SELECT_MAPPED_TO",
                mappedTo: value as "Teacher" | "Student",
              })
            }
          >
            <Select.Trigger>
              <Select.Value className="truncate" />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="Teacher" textValue="Teacher">
                  Teacher
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="Student" textValue="Student">
                  Student
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Select
            className="w-full"
            placeholder="Student Content Type"
            isDisabled={mappedTo !== "Student"}
            value={studentType || null}
            onChange={(value) =>
              dispatch({
                type: "SELECT_STUDENT_TYPE",
                studentType: value as "Study" | "Revision",
              })
            }
          >
            <Select.Trigger>
              <Select.Value className="truncate" />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="Study" textValue="Study">
                  Study
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="Revision" textValue="Revision">
                  Revision
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      </div>

      {/* Row 2: Board → Grade → Subject → Chapter → Subtopic + Save — 6 equal columns */}
      <div className="grid grid-cols-6 items-end gap-3 px-4 py-2">
        <Select
          className="w-full"
          placeholder="Board"
          value={selectedBoard || null}
          onChange={(value) =>
            dispatch({ type: "SELECT_BOARD", board: String(value ?? "") })
          }
        >
          <Select.Trigger>
            <Select.Value className="truncate" />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {boards.map((b) => (
                <ListBox.Item key={b.id} id={b.id} textValue={b.name}>
                  {b.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <Select
          className="w-full"
          placeholder="Grade"
          value={selectedGrade || null}
          onChange={(value) =>
            dispatch({ type: "SELECT_GRADE", grade: String(value ?? "") })
          }
        >
          <Select.Trigger>
            <Select.Value className="truncate" />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {grades.map((g) => (
                <ListBox.Item key={g.id} id={g.id} textValue={g.name}>
                  {g.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <Select
          className="w-full"
          placeholder="Subject"
          value={selectedSubject || null}
          onChange={(value) =>
            dispatch({
              type: "SELECT_SUBJECT",
              subject: String(value ?? ""),
            })
          }
        >
          <Select.Trigger>
            <Select.Value className="truncate" />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {subjects.map((s) => (
                <ListBox.Item key={s.id} id={s.id} textValue={s.name}>
                  {s.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <Select
          className="w-full"
          placeholder="Chapter"
          isDisabled={!selectedSubject}
          value={selectedChapter || null}
          onChange={(value) =>
            dispatch({
              type: "SELECT_CHAPTER",
              chapter: String(value ?? ""),
            })
          }
        >
          <Select.Trigger>
            <Select.Value className="truncate" />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {chapters.map((c) => (
                <ListBox.Item key={c.id} id={c.id} textValue={c.name}>
                  {c.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <Select
          className="w-full"
          placeholder="Subtopic"
          isDisabled={!selectedChapter}
          value={selectedSubtopic || null}
          onChange={(value) =>
            dispatch({
              type: "SELECT_SUBTOPIC",
              subtopic: String(value ?? ""),
            })
          }
        >
          <Select.Trigger>
            <Select.Value className="truncate" />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {subtopics.map((st) => (
                <ListBox.Item key={st.id} id={st.id} textValue={st.name}>
                  {st.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onPress={handleSave}
            isDisabled={!canSave || saving || deleting}
            isPending={saving}
          >
            {({ isPending }) => (
              <>
                {isPending && <Spinner color="current" size="sm" />}
                {saving
                  ? "Saving..."
                  : isMapped
                    ? "Update Mapping"
                    : "Add Mapping"}
              </>
            )}
          </Button>
          {isMapped && (
            <Button
              size="sm"
              className="bg-red-600 text-white mr-2"
              onPress={handleDelete}
              isDisabled={saving || deleting}
              isPending={deleting}
            >
              {({ isPending }) => (
                <>
                  {isPending && <Spinner color="current" size="sm" />}
                  {deleting ? "Deleting..." : "Delete"}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
