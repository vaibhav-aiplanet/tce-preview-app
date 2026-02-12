import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { parseAssetIdsFromExcel } from "~/lib/parse-excel";

interface ExcelUploadProps {
  onUpload: (assetIds: string[]) => void;
}

export default function ExcelUpload({ onUpload }: ExcelUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [assetCount, setAssetCount] = useState(0);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setError(null);
      setFileName(null);
      setAssetCount(0);
      const file = acceptedFiles[0];
      if (!file) return;

      try {
        const ids = await parseAssetIdsFromExcel(file);
        if (ids.length === 0) {
          setError("No asset IDs found in the file");
          return;
        }
        setFileName(file.name);
        setAssetCount(ids.length);
        onUpload(ids);
      } catch {
        setError("Failed to parse the Excel file");
      }
    },
    [onUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    multiple: false,
  });

  return (
    <div className="w-80">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-all ${
          isDragActive
            ? "border-accent bg-accent/5"
            : "border-border/60 hover:border-border"
        }`}
      >
        <input {...getInputProps()} />
        <p
          className={`m-0 truncate text-sm ${
            fileName ? "font-medium text-foreground" : "text-muted"
          }`}
        >
          {isDragActive
            ? "Drop the file here"
            : fileName
              ? fileName
              : "Drag & drop an Excel file here, or click to browse"}
        </p>
        <p className="mt-1 text-xs text-muted">
          {fileName
            ? `${assetCount} asset${assetCount !== 1 ? "s" : ""} found — click or drop to replace`
            : ".xls, .xlsx"}
        </p>
      </div>
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}
