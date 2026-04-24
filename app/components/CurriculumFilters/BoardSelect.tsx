import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CurriculumItem } from "~/lib/curriculum-api";
import { useCurrentBoard, useSetCurrentBoard } from "~/store";
import CurriculumSelect from "./CurriculumSelect";

export default function BoardSelect() {
    const value = useCurrentBoard();
    const setValue = useSetCurrentBoard();

    const { data: boards = [] } = useQuery<CurriculumItem[]>({
        queryKey: ["boards"],
        queryFn: () => fetch("/_api/boards").then((r) => r.json()),
        staleTime: Infinity,
    });

    // Auto-select CBSE board
    // don't auto-select if it's mapped to another board
    useEffect(() => {
        if (typeof boards === "undefined" || boards.length === 0 || value) return;

        const cbse = boards.find((b) => b.name.toUpperCase() === "CBSE");
        if (cbse) setValue(cbse.id);
    }, [boards, value, setValue]);

    return (
        <CurriculumSelect
            placeholder="Board"
            items={boards}
            value={value as string}
            onChange={setValue}
        />
    );
}
