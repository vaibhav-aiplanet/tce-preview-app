import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchChapters, type CurriculumItem } from "~/lib/curriculum-api";
import {
    useCurrentBoard,
    useCurrentGrade,
    useCurrentSubject,
    useCurrentChapter,
    useSetCurrentChapter,
} from "~/store";
import CurriculumSelect from "./CurriculumSelect";

export default function ChapterSelect() {
    const board = useCurrentBoard();
    const grade = useCurrentGrade();
    const subject = useCurrentSubject();
    const value = useCurrentChapter();
    const setValue = useSetCurrentChapter();

    const { data: scoped = [] } = useQuery({
        queryKey: ["chapters", subject, board, grade],
        queryFn: () => fetchChapters(subject || "", board || "", grade || ""),
        enabled: !!subject,
        staleTime: 5 * 60 * 1000,
    });

    // Fallback: a mapped chapter saved under a different board/grade won't
    // appear in the scoped list. Fetch by subjectId only to get every
    // chapter for the subject and merge the matching one.
    const needsFallback = !!value && !scoped.some((c) => c.id === value);
    const { data: allForSubject = [] } = useQuery<CurriculumItem[]>({
        queryKey: ["chapters", subject, "", ""],
        queryFn: () => fetchChapters(subject || "", "", ""),
        enabled: !!subject && needsFallback,
        staleTime: 5 * 60 * 1000,
    });

    const items = useMemo(() => {
        if (!needsFallback) return scoped;
        const fallback = allForSubject.find((c) => c.id === value);
        return fallback ? [fallback, ...scoped] : scoped;
    }, [needsFallback, scoped, allForSubject, value]);

    return (
        <CurriculumSelect
            placeholder="Chapter"
            items={items}
            value={value as string}
            onChange={setValue}
            isDisabled={!subject}
        />
    );
}
