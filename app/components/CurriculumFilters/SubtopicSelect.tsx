import { useQuery } from "@tanstack/react-query";
import { fetchSubtopics } from "~/lib/curriculum-api";
import {
    useCurrentSubject,
    useCurrentSubtopic,
    useSetCurrentSubtopic,
} from "~/store";
import CurriculumSelect from "./CurriculumSelect";

export default function SubtopicSelect() {
    const subject = useCurrentSubject();
    const value = useCurrentSubtopic();
    const setValue = useSetCurrentSubtopic();

    const { data: subtopics = [] } = useQuery({
        queryKey: ["subtopics", subject],
        queryFn: () => fetchSubtopics(subject || ""),
        enabled: !!subject,
        staleTime: 5 * 60 * 1000,
    });

    return (
        <CurriculumSelect
            placeholder="Subtopic"
            items={subtopics}
            value={value as string}
            onChange={setValue}
            isDisabled={!subject}
        />
    );
}
