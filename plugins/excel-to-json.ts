import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import {
  buildDisplayName,
  deriveBookMetadataFromFilename,
  parseAssetIdsFromBuffer,
} from "../app/lib/excel-parser";

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

        const { subject_name, subtopic_name } = deriveBookMetadataFromFilename(file);

        const excelPath = path.join(gradeDir, file);
        const jsonName = file.replace(/\.xlsx?$/i, ".json").replace(" ", ";");
        const jsonPath = path.join(gradeDir, jsonName);

        if (fs.existsSync(jsonPath)) {
          skipped++;
          continue;
        }

        try {
          const buffer = fs.readFileSync(excelPath);
          const assetIds = parseAssetIdsFromBuffer(buffer);

          const json_data = {
            subject_name,
            assetIds,
            subtopic_name,
          };

          fs.writeFileSync(jsonPath, JSON.stringify(json_data, null, 2));
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
        manifest[entry.name] = jsonFiles.map((f) => {
          const { subject_name, subtopic_name } = deriveBookMetadataFromFilename(
            f.replace(/\.json$/i, ".xlsx"),
          );
          return {
            name: buildDisplayName(subject_name, subtopic_name),
            path: `/azvasa/${entry.name}/${f}`,
          };
        });
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
