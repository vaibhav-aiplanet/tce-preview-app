import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSubjects, type CurriculumItem } from "~/lib/curriculum-api";
import {
    useCurrentBoard,
    useCurrentGrade,
    useCurrentSubject,
    useSetCurrentSubject,
} from "~/store";
import CurriculumSelect from "./CurriculumSelect";

export default function SubjectSelect() {
    const board = useCurrentBoard();
    const grade = useCurrentGrade();
    const value = useCurrentSubject();
    const setSubject = useSetCurrentSubject();

    const { data: scoped = [] } = useQuery({
        queryKey: ["subjects", board, grade],
        queryFn: () => fetchSubjects(board || "", grade || ""),
        enabled: !!board && !!grade,
        staleTime: 5 * 60 * 1000,
    });

    // Fallback: mappings don't persist boardId, so a mapped subject saved
    // under a non-CBSE board won't appear in the CBSE-scoped list. Pull
    // from the unscoped list (prefetched on login) so the value still shows.
    const { data: all = [] } = useQuery<CurriculumItem[]>({
        queryKey: ["subjects-all"],
        queryFn: () => fetchSubjects(),
        staleTime: Infinity,
    });

    const items = useMemo(() => {
        if (!value || scoped.some((s) => s.id === value)) return scoped;
        const fallback = all.find((s) => s.id === value);
        return fallback ? [fallback, ...scoped] : scoped;
    }, [value, scoped, all]);

    return (
        <CurriculumSelect
            placeholder="Subject"
            items={items}
            value={value as string}
            onChange={setSubject}
        />
    );
}
