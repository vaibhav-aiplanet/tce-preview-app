import { useQuery } from "@tanstack/react-query";
import type { CurriculumItem } from "~/lib/curriculum-api";
import { useCurrentGrade, useSelectGrade } from "~/store";

import CurriculumSelect from "./CurriculumSelect";

export default function GradeSelect() {
    const value = useCurrentGrade();
    const setGrade = useSelectGrade();

    const { data: grades = [] } = useQuery<CurriculumItem[]>({
        queryKey: ["grades"],
        queryFn: () => fetch("/_api/grades").then((r) => r.json()),
        staleTime: Infinity,
    });

    return (
        <CurriculumSelect
            placeholder="Grade"
            items={grades}
            value={value as string}
            onChange={setGrade}
            sortBy="sortOrder"
        />
    );
}
