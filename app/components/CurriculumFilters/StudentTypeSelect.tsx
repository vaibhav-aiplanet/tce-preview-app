import { useMappedTo, useStudentType } from "~/store";
import CurriculumSelect from "./CurriculumSelect";

const STUDENT_TYPE_ITEMS = [
    { id: "Study", name: "Study" },
    { id: "Revision", name: "Revision" },
];

export default function StudentTypeSelect() {
    const [value, setValue] = useStudentType();
    const [mappedTo] = useMappedTo();

    return (
        <CurriculumSelect
            placeholder="Student Content Type"
            items={STUDENT_TYPE_ITEMS}
            value={value}
            onChange={(v) => setValue(v as "Study" | "Revision")}
            isDisabled={mappedTo !== "Student"}
        />
    );
}
