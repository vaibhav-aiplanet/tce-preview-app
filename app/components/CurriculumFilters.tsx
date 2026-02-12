import { useState, useEffect } from "react";
import { Button, Select, Label, ListBox, Spinner } from "@heroui/react";
import {
  fetchSubjects,
  fetchChapters,
  fetchSubtopics,
  fetchMapping,
  saveMapping,
  type CurriculumItem,
} from "~/lib/curriculum-api";

interface CurriculumFiltersProps {
  assetId: string;
}

export default function CurriculumFilters({ assetId }: CurriculumFiltersProps) {
  const [subjects, setSubjects] = useState<CurriculumItem[]>([]);
  const [chapters, setChapters] = useState<CurriculumItem[]>([]);
  const [subtopics, setSubtopics] = useState<CurriculumItem[]>([]);

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [selectedSubtopic, setSelectedSubtopic] = useState("");
  const [isMapped, setIsMapped] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSubjects().then(setSubjects);

    fetchMapping(assetId).then(async (mapping) => {
      if (!mapping) {
        setIsMapped(false);
        setSelectedSubject("");
        setSelectedChapter("");
        setSelectedSubtopic("");
        setChapters([]);
        setSubtopics([]);
        return;
      }

      setIsMapped(true);
      setSelectedSubject(mapping.subjectId);

      const ch = await fetchChapters(mapping.subjectId);
      setChapters(ch);
      setSelectedChapter(mapping.chapterId);

      const st = await fetchSubtopics(mapping.chapterId);
      setSubtopics(st);
      setSelectedSubtopic(mapping.subtopicId);
    });
  }, [assetId]);

  useEffect(() => {
    if (!selectedSubject) {
      setChapters([]);
      return;
    }
    fetchChapters(selectedSubject).then(setChapters);
  }, [selectedSubject]);

  useEffect(() => {
    if (!selectedChapter) {
      setSubtopics([]);
      return;
    }
    fetchSubtopics(selectedChapter).then(setSubtopics);
  }, [selectedChapter]);

  const canSave = selectedSubject && selectedChapter && selectedSubtopic;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    await saveMapping(assetId, {
      subjectId: selectedSubject,
      chapterId: selectedChapter,
      subtopicId: selectedSubtopic,
    });
    setIsMapped(true);
    setSaving(false);
  };

  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-border/40 px-4 py-3">
      <span className="self-center text-xs font-medium text-muted">
        Map to:
      </span>

      <Select
        className="w-[160px]"
        placeholder="Subject"
        value={selectedSubject || null}
        onChange={(value) => {
          setSelectedSubject(String(value ?? ""));
          setSelectedChapter("");
          setSelectedSubtopic("");
        }}
      >
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {subjects.map((s) => (
              <ListBox.Item key={s.id} id={s.id} textValue={s.name}>
                {s.name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <Select
        className="w-[160px]"
        placeholder="Chapter"
        isDisabled={!selectedSubject}
        value={selectedChapter || null}
        onChange={(value) => {
          setSelectedChapter(String(value ?? ""));
          setSelectedSubtopic("");
        }}
      >
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {chapters.map((c) => (
              <ListBox.Item key={c.id} id={c.id} textValue={c.name}>
                {c.name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <Select
        className="w-[160px]"
        placeholder="Subtopic"
        isDisabled={!selectedChapter}
        value={selectedSubtopic || null}
        onChange={(value) => setSelectedSubtopic(String(value ?? ""))}
      >
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {subtopics.map((st) => (
              <ListBox.Item key={st.id} id={st.id} textValue={st.name}>
                {st.name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <Button
        size="sm"
        onPress={handleSave}
        isDisabled={!canSave || saving}
        isPending={saving}
      >
        {({ isPending }) => (
          <>
            {isPending && <Spinner color="current" size="sm" />}
            {saving ? "Saving..." : isMapped ? "Update Mapping" : "Add Mapping"}
          </>
        )}
      </Button>
    </div>
  );
}
