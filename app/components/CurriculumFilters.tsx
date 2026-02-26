import { useReducer, useEffect, useRef } from "react";
import { Button, Select, ListBox, Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchSubjects,
  fetchChapters,
  fetchSubtopics,
  fetchMapping,
  saveMapping,
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
  isMapped: boolean;
  saving: boolean;
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
  | { type: "SET_CHAPTERS_AND_SUBTOPICS"; chapters: CurriculumItem[]; subtopics: CurriculumItem[] }
  | { type: "SELECT_CHAPTER"; chapter: string }
  | { type: "SELECT_SUBTOPIC"; subtopic: string }
  | { type: "SET_MAPPED"; isMapped: boolean }
  | { type: "SET_SAVING"; saving: boolean };

const initialState: CurriculumState = {
  subjects: [],
  chapters: [],
  subtopics: [],
  selectedBoard: "",
  selectedGrade: "",
  selectedSubject: "",
  selectedChapter: "",
  selectedSubtopic: "",
  isMapped: false,
  saving: false,
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

    case "SET_MAPPED":
      return { ...state, isMapped: action.isMapped };

    case "SET_SAVING":
      return { ...state, saving: action.saving };

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
    isMapped,
    saving,
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

  const canSave = selectedSubject && selectedChapter;

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
    <div className="flex flex-wrap items-end gap-3 border-b border-border/40 px-4 py-3">
      <span className="self-center text-xs font-medium text-muted">
        Map to:
      </span>

      <Select
        className="w-32 data-[placeholder=true]:truncate"
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
        className="w-32 data-[placeholder=true]:truncate"
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
        className="w-40"
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
        className="w-48"
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
        className="w-40"
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

      <Button
        size="sm"
        onPress={handleSave}
        isDisabled={!canSave || saving}
        isPending={saving}
      >
        {({ isPending }) => (
          <>
            {isPending && <Spinner color="current" size="sm" />}
            {saving ? "Saving..." : isMapped ? "Update Mapping" : "Add Mapping"}
          </>
        )}
      </Button>
    </div>
  );
}
