import { read, utils } from "xlsx";

export async function parseAssetIdsFromExcel(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = utils.sheet_to_json<string[]>(sheet, { header: 1 });

  // Skip first 4 rows (BookId, Book Title, 2 empty) + header row (ID / Type)
  const dataRows = rows.slice(5);

  const assetIds: string[] = [];
  for (const row of dataRows) {
    const value = row[1]; // column B
    if (typeof value === "string" && value.trim()) {
      assetIds.push(value.trim());
    }
  }

  return assetIds;
}
