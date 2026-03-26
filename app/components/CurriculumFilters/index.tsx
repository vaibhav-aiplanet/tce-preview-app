import { useReducer, useEffect, useRef, useState } from "react";
import { Button, Select, ListBox, Spinner } from "@heroui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    fetchSubjects,
    fetchChapters,
    fetchSubtopics,
    fetchMapping,
    saveMapping,
    deleteMapping,
    type CurriculumItem,
} from "~/lib/curriculum-api";
import {
    useCurrentGrade,
    useCurrentSubject,
    useCurrentSubtopic,
} from "~/store";

import type { CurriculumFiltersProps, CurriculumState } from "./types"
import curriculumReducer from "./reducer"

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

    const atomGrade = useCurrentGrade();
    const atomSubject = useCurrentSubject();
    const atomSubtopic = useCurrentSubtopic();

    // Track whether we're in the middle of initializing from a mapping
    // to avoid redundant fetches from the subjects/chapters effects
    const initializingRef = useRef(false);
    const mappingAppliedRef = useRef(false);
    const [readyForPreselect, setReadyForPreselect] = useState(false);
    const [pendingMapping, setPendingMapping] = useState<{
        mapping: { gradeId: string; subjectId: string; chapterId: string; subtopicId: string; mappedTo?: "Teacher" | "Student"; studentType?: "Study" | "Revision" };
        subtopics: CurriculumItem[];
    } | null>(null);

    const queryClient = useQueryClient();

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

    const cachedFetchSubjects = (boardId?: string, gradeId?: string) =>
        queryClient.fetchQuery({
            queryKey: ["subjects", boardId, gradeId],
            queryFn: () => fetchSubjects(boardId, gradeId),
            staleTime: 5 * 60 * 1000,
        });

    const cachedFetchChapters = (subjectId: string, boardId: string, gradeId: string) =>
        queryClient.fetchQuery({
            queryKey: ["chapters", subjectId, boardId, gradeId],
            queryFn: () => fetchChapters(subjectId, boardId, gradeId),
            staleTime: 5 * 60 * 1000,
        });

    const cachedFetchSubtopics = (subjectId: string) =>
        queryClient.fetchQuery({
            queryKey: ["subtopics", subjectId],
            queryFn: () => fetchSubtopics(subjectId),
            staleTime: 5 * 60 * 1000,
        });

    // Load existing mapping when assetId changes
    useEffect(() => {
        let cancelled = false;
        initializingRef.current = true;
        mappingAppliedRef.current = false;
        setReadyForPreselect(false);

        async function init() {
            const mapping = await fetchMapping(assetId);
            if (cancelled) return;

            if (!mapping) {
                dispatch({ type: "INIT_NO_MAPPING" });
                initializingRef.current = false;
                setReadyForPreselect(true);
                return;
            }

            const st = await cachedFetchSubtopics(mapping.subjectId);
            if (cancelled) return;

            setPendingMapping({ mapping, subtopics: st });
        }

        init();
        return () => {
            cancelled = true;
        };
    }, [assetId]);

    // Dispatch INIT_MAPPING only after grades/boards have loaded so Select items exist
    useEffect(() => {
        if (!pendingMapping || grades.length === 0 || boards.length === 0) return;
        let cancelled = false;

        const boardMatch = boards.find((b) => b.name.toUpperCase() === "CBSE");
        const boardId = boardMatch?.id || "";

        // Match grade by name from grades list (same as preselect path)
        const normalizedGrade = atomGrade ? atomGrade.toLowerCase().replace(/^grade\s+/, "") : "";
        const gradeMatch = grades.find(
            (g) => g.name.toLowerCase().replace(/^grade\s+/, "") === normalizedGrade,
        );
        const gradeId = gradeMatch?.id || pendingMapping.mapping.gradeId || "";

        const { mapping, subtopics } = pendingMapping;

        (async () => {
            const subjects = await cachedFetchSubjects(boardId, gradeId);
            if (cancelled) return;

            // Match subject by name from subjects list
            const subjectMatch = atomSubject
                ? subjects.find((s) => s.name.toLowerCase() === atomSubject.toLowerCase())
                : null;
            const subjectId = subjectMatch?.id || mapping.subjectId;
            const subjectChanged = subjectId !== mapping.subjectId;

            // If subject changed via atom override, re-fetch subtopics for the new subject
            const resolvedSubtopics = subjectChanged
                ? await cachedFetchSubtopics(subjectId)
                : subtopics;
            if (cancelled) return;

            // Match subtopic by name from subtopics list
            const subtopicMatch = atomSubtopic
                ? resolvedSubtopics.find((s) => s.name.toLowerCase() === atomSubtopic.toLowerCase())
                : resolvedSubtopics.find((s) => s.id === mapping.subtopicId);
            const subtopicId = subtopicMatch?.id || (subjectChanged ? "" : mapping.subtopicId);

            const ch = await cachedFetchChapters(subjectId, boardId, gradeId);
            if (cancelled) return;

            const chapterMatch = ch.find((c) => c.id === mapping.chapterId);
            const chapterId = chapterMatch?.id || "";

            dispatch({
                type: "INIT_MAPPING",
                selectedBoard: boardId,
                mapping: { ...mapping, gradeId, subjectId, subtopicId, chapterId },
                subjects,
                chapters: ch,
                subtopics: resolvedSubtopics,
            });

            if (!mappingAppliedRef.current) {
                mappingAppliedRef.current = true;
                initializingRef.current = false;
            }

            // Clear pendingMapping once atoms have been applied
            if (atomSubject !== null) {
                setPendingMapping(null);
            }
        })();

        return () => { cancelled = true; };
    }, [pendingMapping, grades, boards, atomGrade, atomSubject, atomSubtopic]);

    // Preselect from atoms when no mapping exists and grades have loaded
    const preselectedRef = useRef(false);
    useEffect(() => {
        if (!readyForPreselect) return;
        if (preselectedRef.current) return;
        if (isMapped || selectedGrade) return;
        if (!atomGrade || grades.length === 0 || boards.length === 0) return;

        let cancelled = false;
        initializingRef.current = true;

        async function preselect() {
            // Find CBSE board
            const boardMatch = boards.find(
                (b) => b.name.toUpperCase() === "CBSE",
            );

            // atomGrade may be "Grade 6" or "6" — normalize by stripping "grade " prefix
            const normalizedGrade = atomGrade!.toLowerCase().replace(/^grade\s+/, "");
            const gradeMatch = grades.find(
                (g) => g.name.toLowerCase().replace(/^grade\s+/, "") === normalizedGrade,
            );
            if (!gradeMatch) {
                initializingRef.current = false;
                return;
            }

            let subjectsList: CurriculumItem[] = [];
            let subjectId = "";
            let ch: CurriculumItem[] = [];
            let st: CurriculumItem[] = [];
            let subtopicId = "";

            if (atomSubject) {
                subjectsList = await cachedFetchSubjects(boardMatch?.id || "", gradeMatch.id);
                if (cancelled) return;

                const subjectMatch = subjectsList.find(
                    (s) => s.name.toLowerCase() === atomSubject!.toLowerCase(),
                );
                if (subjectMatch) {
                    subjectId = subjectMatch.id;

                    [ch, st] = await Promise.all([
                        cachedFetchChapters(subjectMatch.id, boardMatch?.id || "", gradeMatch.id),
                        cachedFetchSubtopics(subjectMatch.id),
                    ]);
                    if (cancelled) return;

                    if (atomSubtopic) {
                        const subtopicMatch = st.find(
                            (s) => s.name.toLowerCase() === atomSubtopic!.toLowerCase(),
                        );
                        if (subtopicMatch) {
                            subtopicId = subtopicMatch.id;
                        }
                    }
                }
            }

            dispatch({
                type: "INIT_PRESELECT",
                selectedBoard: boardMatch?.id || "",
                selectedGrade: gradeMatch.id,
                selectedSubject: subjectId,
                selectedSubtopic: subtopicId,
                subjects: subjectsList,
                chapters: ch,
                subtopics: st,
            });
            preselectedRef.current = true;
            initializingRef.current = false;
        }

        preselect();
        return () => {
            cancelled = true;
        };
    }, [readyForPreselect, boards, grades, atomGrade, atomSubject, atomSubtopic, isMapped, selectedGrade]);

    // Fetch subjects when board + grade are selected
    useEffect(() => {
        if (!selectedGrade) return;
        if (initializingRef.current) return;
        if (!selectedBoard) return;

        cachedFetchSubjects(selectedBoard, selectedGrade).then((data) => {
            dispatch({ type: "SET_SUBJECTS", subjects: data });
        });
    }, [selectedBoard, selectedGrade]);

    // Fetch chapters + subtopics when subject is selected
    useEffect(() => {
        if (!selectedSubject) return;
        if (initializingRef.current) return;

        Promise.all([
            cachedFetchChapters(selectedSubject, selectedBoard || "", selectedGrade),
            cachedFetchSubtopics(selectedSubject),
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

            {/* Row 2: Board → Grade → Subject → Subtopic → Chapter + Save — 6 equal columns */}
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
                    placeholder="Subtopic"
                    isDisabled={!selectedSubject}
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
