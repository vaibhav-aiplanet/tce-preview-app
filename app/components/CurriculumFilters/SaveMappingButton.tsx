import { Button, Spinner } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { saveMapping } from "~/lib/curriculum-api";
import {
    useCurrentGrade,
    useCurrentSubject,
    useCurrentChapter,
    useCurrentSubtopic,
    useMappedTo,
    useStudentType,
    useIsMapped,
    useSaving,
    useDeleting,
} from "~/store";
import type { CurriculumFiltersProps } from "./types";

interface SaveMappingButtonProps {
    assetId: string;
    asset?: CurriculumFiltersProps["asset"];
}

export default function SaveMappingButton({ assetId, asset }: SaveMappingButtonProps) {
    const selectedGrade = useCurrentGrade();
    const selectedSubject = useCurrentSubject();
    const selectedChapter = useCurrentChapter();
    const selectedSubtopic = useCurrentSubtopic();
    const [mappedTo] = useMappedTo();
    const [studentType] = useStudentType();
    const [isMapped, setIsMapped] = useIsMapped();
    const [saving, setSaving] = useSaving();
    const [deleting] = useDeleting();
    const qc = useQueryClient();

    const canSave =
        selectedSubject &&
        selectedChapter &&
        (mappedTo !== "Student" || studentType);

    const handleSave = async () => {
        try {
            if (!canSave) return;
            setSaving(true);

            const profile_data = JSON.parse(
                sessionStorage.getItem("profile") || "{}",
            );

            await saveMapping(assetId, {
                gradeId: selectedGrade || "",
                subjectId: selectedSubject || "",
                chapterId: selectedChapter || "",
                subtopicId: selectedSubtopic || "",
                createdBy: profile_data.userName,
                title: asset?.title || "",
                mimeType: asset?.mimeType || "",
                assetType: asset?.assetType || "",
                subType: asset?.subType || "",
                mappedTo: mappedTo || undefined,
                studentType: (studentType as "Study" | "Revision") || undefined,
            });
            setIsMapped(true);
            await Promise.all([
                qc.invalidateQueries({ queryKey: ["mapping", assetId] }),
                qc.invalidateQueries({ queryKey: ["mapped-assets"] }),
            ]);
        } catch (error) {
            console.error(error);
            setIsMapped(false);
        } finally {
            setSaving(false);
        }
    };

    return (
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
                        ? "Submitting..."
                        : isMapped
                            ? "Resubmit for Review"
                            : "Submit for Review"}
                </>
            )}
        </Button>
    );
}
