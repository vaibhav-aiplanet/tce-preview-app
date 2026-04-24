import { useEffect } from "react";
import { fetchMapping } from "~/lib/curriculum-api";

import type { CurriculumFiltersProps } from "./types";
import { useIsMapped, useMappedTo, useStudentType, useSetCurrentChapter, useSetCurrentGrade, useSetCurrentSubject, useSetCurrentSubtopic } from "~/store";
import BoardSelect from "./BoardSelect";
import GradeSelect from "./GradeSelect";
import SubjectSelect from "./SubjectSelect";
import SubtopicSelect from "./SubtopicSelect";
import ChapterSelect from "./ChapterSelect";
import MappedToSelect from "./MappedToSelect";
import StudentTypeSelect from "./StudentTypeSelect";
import SaveMappingButton from "./SaveMappingButton";
import DeleteMappingButton from "./DeleteMappingButton";

export default function CurriculumFilters({
    assetId,
    asset,
}: CurriculumFiltersProps) {
    const [isMapped, setIsMapped] = useIsMapped();

    const setGrade = useSetCurrentGrade();
    const setSubject = useSetCurrentSubject();
    const setChapter = useSetCurrentChapter();
    const setSubTopic = useSetCurrentSubtopic();
    const [, setMappedTo] = useMappedTo();
    const [, setStudentType] = useStudentType();

    // Fetch mapping when assetId changes.
    // - Preserve grade/subject/subtopic from home.tsx if no mapping exists.
    // - Chapter has no home-page source, so always clear on mount.
    useEffect(() => {
        let cancelled = false;
        setChapter(null);
        setIsMapped(false);

        fetchMapping(assetId)
            .then((mapping) => {
                if (cancelled) return;
                if (mapping && mapping.gradeId) {
                    setGrade(mapping.gradeId);
                    setSubject(mapping.subjectId);
                    setChapter(mapping.chapterId || null);
                    setSubTopic(mapping.subtopicId || null);
                    if (mapping.mappedTo) setMappedTo(mapping.mappedTo);
                    if (mapping.studentType) setStudentType(mapping.studentType);
                    setIsMapped(true);
                } else {
                    setIsMapped(false);
                }
            })
            .catch((err) => {
                console.error("fetchMapping failed:", err);
                if (!cancelled) setIsMapped(false);
            });

        return () => { cancelled = true; };
    }, [assetId]);

    return (
        <div className="flex w-full flex-col border-b border-border/40">
            {/* Row 1: Map to + Student type */}
            <div className="grid grid-cols-6 gap-3 px-4 py-2">
                <div className="flex flex-col gap-1">
                    <MappedToSelect />
                </div>
                <div className="flex flex-col gap-1">
                    <StudentTypeSelect />
                </div>
            </div>

            {/* Row 2: Board → Grade → Subject → Subtopic → Chapter + Actions */}
            <div className="grid grid-cols-6 items-end gap-3 px-4 py-2">
                <BoardSelect />
                <GradeSelect />
                <SubjectSelect />
                <SubtopicSelect />
                <ChapterSelect />
                <div className="flex gap-2">
                    <SaveMappingButton assetId={assetId} asset={asset} />
                    {isMapped && <DeleteMappingButton assetId={assetId} />}
                </div>
            </div>
        </div>
    );
}
