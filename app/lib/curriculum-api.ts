export interface CurriculumItem {
  id: string;
  name: string;
}

export interface AssetMapping {
  gradeId: string;
  subjectId: string;
  chapterId: string;
  subtopicId: string;
  createdBy: string;
}

export async function fetchSubjects(): Promise<CurriculumItem[]> {
  const res = await fetch("/_api/subjects");
  return res.json();
}

export async function fetchChapters(
  subjectId: string,
): Promise<CurriculumItem[]> {
  if (!subjectId) return [];
  const res = await fetch(`/_api/chapters?subjectId=${subjectId}`);
  return res.json();
}

export async function fetchSubtopics(
  subjectId: string,
): Promise<CurriculumItem[]> {
  if (!subjectId) return [];
  const res = await fetch(`/_api/subtopics?subjectId=${subjectId}`);
  return res.json();
}

export async function fetchMapping(
  assetId: string,
): Promise<AssetMapping | null> {
  const res = await fetch(`/_api/mapping?assetId=${assetId}`);
  return res.json();
}

export async function saveMapping(
  assetId: string,
  mapping: AssetMapping,
): Promise<void> {
  await fetch("/_api/mapping", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assetId, ...mapping }),
  });
}
