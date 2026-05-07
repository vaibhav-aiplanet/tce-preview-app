import { read, utils } from "xlsx";

export type ParsedBook = {
  subject_name: string;
  subtopic_name: string | null;
  assetIds: string[];
};

export function parseAssetIdsFromBuffer(buffer: Buffer | ArrayBuffer): string[] {
  const workbook = read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = utils.sheet_to_json<string[]>(sheet, { header: 1 });

  const dataRows = rows.slice(5);
  const assetIds: string[] = [];
  for (const row of dataRows) {
    const value = row[1];
    if (typeof value === "string" && value.trim()) {
      assetIds.push(value.trim());
    }
  }
  return assetIds;
}

export function deriveBookMetadataFromFilename(filename: string): {
  subject_name: string;
  subtopic_name: string | null;
} {
  const base = filename.replace(/\.xlsx?$/i, "");
  const [rawSubject, rawSubtopic] = base.split("-").slice(0, 2);
  const subject_name = (rawSubject ?? "").replace(";", " ").trim();
  const subtopic = (rawSubtopic ?? "").trim();
  return {
    subject_name,
    subtopic_name: subtopic === "NA" || subtopic === "" ? null : subtopic,
  };
}

export function buildDisplayName(
  subject_name: string,
  subtopic_name: string | null,
): string {
  return subtopic_name ? `${subject_name} - ${subtopic_name}` : subject_name;
}

export function parseExcelToBook(
  buffer: Buffer | ArrayBuffer,
  filename: string,
): ParsedBook {
  const { subject_name, subtopic_name } = deriveBookMetadataFromFilename(filename);
  const assetIds = parseAssetIdsFromBuffer(buffer);
  return { subject_name, subtopic_name, assetIds };
}
