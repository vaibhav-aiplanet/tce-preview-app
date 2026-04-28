import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import ReviewActions from "./ReviewActions";
import StatusBadge from "~/components/StatusBadge";

export default function CurriculumFilters({
    assetId,
    asset,
    mode,
}: CurriculumFiltersProps) {
    const [isMapped, setIsMapped] = useIsMapped();

    const setGrade = useSetCurrentGrade();
    const setSubject = useSetCurrentSubject();
    const setChapter = useSetCurrentChapter();
    const setSubTopic = useSetCurrentSubtopic();
    const [, setMappedTo] = useMappedTo();
    const [, setStudentType] = useStudentType();

    // Fetch mapping when assetId changes via TanStack Query so review actions
    // can invalidate uniformly via queryClient.invalidateQueries.
    const { data: mapping } = useQuery({
        queryKey: ["mapping", assetId],
        queryFn: () => fetchMapping(assetId),
        enabled: !!assetId,
    });

    useEffect(() => {
        setChapter(null);
        setIsMapped(false);
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
    }, [assetId, mapping?.gradeId, mapping?.subjectId, mapping?.chapterId, mapping?.subtopicId, mapping?.mappedTo, mapping?.studentType]);

    const isReviewer = mode === "reviewer";
    const showRejectionBanner =
        mode === "admin" && mapping?.status === "REJECTED";

    return (
        <div className="flex w-full flex-col border-b border-border/40">
            {(mapping?.status || isReviewer) && (
                <div className="flex items-center gap-3 px-4 pt-3">
                    {mapping?.status && <StatusBadge status={mapping.status} />}
                    {mapping?.reviewedBy && (
                        <span className="text-xs text-muted">
                            Reviewed by {mapping.reviewedBy}
                        </span>
                    )}
                </div>
            )}

            {showRejectionBanner && mapping?.rejectionReason && (
                <div className="mx-4 mt-2 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                    <span className="font-medium">Rejection reason: </span>
                    {mapping.rejectionReason}
                </div>
            )}

            {/* Read-only wrapper for reviewer: selects show their values but can't be edited. */}
            <div className={isReviewer ? "pointer-events-none opacity-80" : ""}>
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
                    {!isReviewer && (
                        <div className="flex gap-2">
                            <SaveMappingButton assetId={assetId} asset={asset} />
                            {isMapped && <DeleteMappingButton assetId={assetId} />}
                        </div>
                    )}
                </div>
            </div>

            {isReviewer && (
                <div className="flex items-center gap-3 px-4 pb-3 pt-1">
                    <ReviewActions assetId={assetId} mapping={mapping} />
                </div>
            )}
        </div>
    );
}
