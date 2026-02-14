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
  const [boards, setBoards] = useState<CurriculumItem[]>([]);
  const [grades, setGrades] = useState<CurriculumItem[]>([]);
  const [subjects, setSubjects] = useState<CurriculumItem[]>([]);
  const [chapters, setChapters] = useState<CurriculumItem[]>([]);
  const [subtopics, setSubtopics] = useState<CurriculumItem[]>([]);

  const [selectedBoard, setSelectedBoard] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [selectedSubtopic, setSelectedSubtopic] = useState("");
  const [isMapped, setIsMapped] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/_api/boards").then((r) => r.json()),
      fetch("/_api/grades").then((r) => r.json()),
      fetchSubjects(),
    ]).then(([boardsData, gradesData, subjectsData]) => {
      setBoards(boardsData);
      setGrades(gradesData);
      setSubjects(subjectsData);
    });

    fetchMapping(assetId).then(async (mapping) => {
      if (!mapping) {
        setIsMapped(false);
        setSelectedBoard("");
        setSelectedGrade("");
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

      const st = await fetchSubtopics(mapping.subjectId);
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
    if (!selectedSubject) {
      setSubtopics([]);
      return;
    }
    fetchSubtopics(selectedSubject).then(setSubtopics);
  }, [selectedSubject]);

  const canSave = selectedSubject && selectedChapter;

  const handleSave = async () => {
    try {
      if (!canSave) return;
      setSaving(true);

      const profile_data = JSON.parse(
        sessionStorage.getItem("profile") || "{}",
      );

      await saveMapping(assetId, {
        gradeId: selectedGrade,
        subjectId: selectedSubject,
        chapterId: selectedChapter,
        subtopicId: selectedSubtopic,
        createdBy: profile_data.userName,
      });
      setIsMapped(true);
      setSaving(false);
    } catch (error) {
      console.error(error);
      setIsMapped(false);
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-border/40 px-4 py-3">
      <span className="self-center text-xs font-medium text-muted">
        Map to:
      </span>

      <Select
        className="w-32 data-[placeholder=true]:truncate"
        placeholder="Board"
        value={selectedBoard || null}
        onChange={(value) => {
          setSelectedBoard(String(value ?? ""));
        }}
      >
        <Select.Trigger>
          <Select.Value className="truncate" />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {boards.map((b) => (
              <ListBox.Item key={b.id} id={b.id} textValue={b.name}>
                {b.name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <Select
        className="w-32 data-[placeholder=true]:truncate"
        placeholder="Grade"
        value={selectedGrade || null}
        onChange={(value) => {
          setSelectedGrade(String(value ?? ""));
        }}
      >
        <Select.Trigger>
          <Select.Value className="truncate" />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {grades.map((g) => (
              <ListBox.Item key={g.id} id={g.id} textValue={g.name}>
                {g.name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <Select
        className="w-40"
        placeholder="Subject"
        value={selectedSubject || null}
        onChange={(value) => {
          setSelectedSubject(String(value ?? ""));
          setSelectedChapter("");
          setSelectedSubtopic("");
        }}
      >
        <Select.Trigger>
          <Select.Value className="truncate" />
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
        className="w-48"
        placeholder="Chapter"
        isDisabled={!selectedSubject}
        value={selectedChapter || null}
        onChange={(value) => {
          setSelectedChapter(String(value ?? ""));
          setSelectedSubtopic("");
        }}
      >
        <Select.Trigger>
          <Select.Value className="truncate" />
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
        className="w-40"
        placeholder="Subtopic"
        isDisabled={!selectedChapter}
        value={selectedSubtopic || null}
        onChange={(value) => setSelectedSubtopic(String(value ?? ""))}
      >
        <Select.Trigger>
          <Select.Value className="truncate" />
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
