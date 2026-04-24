import { Select, ListBox } from "@heroui/react";

interface CurriculumSelectProps {
    placeholder: string;
    items: { id: string; name: string }[];
    value: string;
    onChange: (value: string) => void;
    isDisabled?: boolean;
}

export default function CurriculumSelect({
    placeholder,
    items,
    value,
    onChange,
    isDisabled,
}: CurriculumSelectProps) {
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
                    {items.map((item) => (
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
