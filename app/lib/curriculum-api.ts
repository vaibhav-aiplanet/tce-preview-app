export interface CurriculumItem {
  id: string;
  name: string;
}

export type MappingStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface AssetMapping {
  gradeId: string;
  subjectId: string;
  chapterId: string;
  subtopicId: string;
  createdBy: string;
  title?: string;
  mimeType?: string;
  assetType?: string;
  subType?: string;
  mappedTo?: "Teacher" | "Student";
  studentType?: "Study" | "Revision";
  status?: MappingStatus;
  rejectionReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
}

export class ReviewConflictError extends Error {
  constructor() {
    super("Submission is no longer pending");
    this.name = "ReviewConflictError";
  }
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

export async function deleteMapping(assetId: string): Promise<void> {
  await fetch("/_api/mapping", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assetId }),
  });
}

export async function reviewMapping(
  assetId: string,
  action: "approve" | "reject",
  reviewedBy: string,
  reason?: string,
): Promise<void> {
  const res = await fetch("/_api/mapping/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assetId, action, reviewedBy, reason }),
  });
  if (res.status === 409) {
    throw new ReviewConflictError();
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Review failed (${res.status})`);
  }
}
