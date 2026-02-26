export interface CurriculumItem {
  id: string;
  name: string;
}

interface AssetMapping {
  gradeId: string;
  subjectId: string;
  chapterId: string;
  subtopicId: string;
  createdBy: string;
  title?: string;
  mimeType?: string;
  assetType?: string;
  subType?: string;
}

export async function fetchSubjects(
  boardId?: string,
  gradeId?: string,
): Promise<CurriculumItem[]> {
  const sp = new URLSearchParams();
  if (boardId) sp.append("boardId", boardId);
  if (gradeId) sp.append("gradeId", gradeId);

  const res = await fetch(`/_api/subjects?${sp.toString()}`);
  return res.json();
}

export async function fetchChapters(
  subjectId: string,
  boardId: string,
  gradeId: string,
): Promise<CurriculumItem[]> {
  if (!subjectId) return [];

  const sp = new URLSearchParams();
  sp.append("subjectId", subjectId);
  sp.append("gradeId", gradeId);
  sp.append("boardId", boardId);

  const res = await fetch(`/_api/chapters?${sp.toString()}`);
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
