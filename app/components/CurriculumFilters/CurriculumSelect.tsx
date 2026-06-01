import { useMemo } from "react";
import { Select, ListBox } from "@heroui/react";

interface CurriculumSelectProps {
    placeholder: string;
    items: { id: string; name: string; sortOrder?: number }[];
    value: string;
    onChange: (value: string) => void;
    isDisabled?: boolean;
    /** "sortOrder" sorts by the numeric sortOrder field (e.g. grades); defaults to alphabetical. */
    sortBy?: "sortOrder" | "alpha";
}

export default function CurriculumSelect({
    placeholder,
    items,
    value,
    onChange,
    isDisabled,
    sortBy = "alpha",
}: CurriculumSelectProps) {
    const sortedItems = useMemo(() => {
        const next = [...items];
        if (sortBy === "sortOrder") {
            const order = (o?: number) => o ?? Number.POSITIVE_INFINITY;
            next.sort(
                (a, b) =>
                    order(a.sortOrder) - order(b.sortOrder) ||
                    a.name.localeCompare(b.name),
            );
        } else {
            next.sort((a, b) => a.name.localeCompare(b.name));
        }
        return next;
    }, [items, sortBy]);
    return (
        <Select
            className="w-full"
            placeholder={placeholder}
            isDisabled={isDisabled}
            value={value || null}
            onChange={(v) => onChange(String(v ?? ""))}
        >
            <Select.Trigger>
                <Select.Value className="truncate" />
                <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
                <ListBox>
                    {sortedItems.map((item) => (
                        <ListBox.Item key={item.id} id={item.id} textValue={item.name}>
                            {item.name}
                            <ListBox.ItemIndicator />
                        </ListBox.Item>
                    ))}
                </ListBox>
            </Select.Popover>
        </Select>
    );
}
