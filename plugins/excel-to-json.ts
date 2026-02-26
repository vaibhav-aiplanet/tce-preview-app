import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { read, utils } from "xlsx";

function parseAssetIdsFromBuffer(buffer: Buffer): string[] {
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

export function excelToJsonPlugin(): Plugin {
  function generateJsonFiles() {
    const publicDir = path.resolve(process.cwd(), "public/azvasa");
    if (!fs.existsSync(publicDir)) return;

    const gradeDirectories = fs.readdirSync(publicDir, { withFileTypes: true });
    let generated = 0;
    let skipped = 0;

    for (const entry of gradeDirectories) {
      if (!entry.isDirectory()) continue;
      const gradeDir = path.join(publicDir, entry.name);
      const files = fs.readdirSync(gradeDir);

      for (const file of files) {
        if (!/\.xls$/i.test(file) && !/\.xlsx$/i.test(file)) continue;

        const excelPath = path.join(gradeDir, file);
        const jsonName = file.replace(/\.xlsx?$/i, ".json");
        const jsonPath = path.join(gradeDir, jsonName);

        if (fs.existsSync(jsonPath)) {
          skipped++;
          continue;
        }

        try {
          const buffer = fs.readFileSync(excelPath);
          const assetIds = parseAssetIdsFromBuffer(buffer);
          fs.writeFileSync(jsonPath, JSON.stringify(assetIds, null, 2));
          generated++;
          console.log(
            `  Generated: azvasa/${entry.name}/${jsonName} (${assetIds.length} assets)`,
          );
        } catch (e) {
          console.error(`  Failed to parse: azvasa/${entry.name}/${file}`, e);
        }
      }
    }

    if (generated > 0 || skipped > 0) {
      console.log(
        `Excel→JSON: ${generated} generated, ${skipped} already existed`,
      );
    }

    const manifest: Record<string, { name: string; path: string }[]> = {};
    for (const entry of gradeDirectories) {
      if (!entry.isDirectory()) continue;
      const gradeDir = path.join(publicDir, entry.name);
      const jsonFiles = fs
        .readdirSync(gradeDir)
        .filter((f) => f.endsWith(".json"));

      if (jsonFiles.length > 0) {
        manifest[entry.name] = jsonFiles.map((f) => ({
          name: f
            .replace(/\.json$/, "")
            .replace(/\+/g, " ")
            .replace(/-\d{13}$/, ""),
          path: `/azvasa/${entry.name}/${f}`,
        }));
      }
    }
    fs.writeFileSync(
      path.join(publicDir, "manifest.json"),
      JSON.stringify(manifest, null, 2),
    );
    console.log("Generated azvasa/manifest.json");
  }

  return {
    name: "excel-to-json",
    buildStart() {
      console.log("Generating JSON from Excel files...");
      generateJsonFiles();
    },
  };
}
