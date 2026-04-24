import { useMappedTo } from "~/store";
import CurriculumSelect from "./CurriculumSelect";

const MAPPED_TO_ITEMS = [
    { id: "Teacher", name: "Teacher" },
    { id: "Student", name: "Student" },
];

export default function MappedToSelect() {
    const [value, setValue] = useMappedTo();

    return (
        <CurriculumSelect
            placeholder="Consumer"
            items={MAPPED_TO_ITEMS}
            value={value}
            onChange={(v) => setValue(v as "Teacher" | "Student")}
        />
    );
}
