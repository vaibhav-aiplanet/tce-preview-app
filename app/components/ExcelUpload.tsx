import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { parseAssetIdsFromExcel } from "~/lib/parse-excel";

interface ExcelUploadProps {
  onUpload: (assetIds: string[]) => void;
}

export default function ExcelUpload({ onUpload }: ExcelUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setError(null);
      const file = acceptedFiles[0];
      if (!file) return;

      try {
        const ids = await parseAssetIdsFromExcel(file);
        if (ids.length === 0) {
          setError("No asset IDs found in the file");
          return;
        }
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
    <div style={{ width: "320px" }}>
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? "#1976d2" : "#ccc"}`,
          borderRadius: "6px",
          padding: "20px",
          textAlign: "center",
          cursor: "pointer",
          backgroundColor: isDragActive ? "#e3f2fd" : "transparent",
          transition: "all 0.2s",
        }}
      >
        <input {...getInputProps()} />
        <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
          {isDragActive
            ? "Drop the file here"
            : "Drag & drop an Excel file here, or click to browse"}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#999" }}>
          .xls, .xlsx
        </p>
      </div>
      {error && (
        <p style={{ margin: "6px 0 0", fontSize: "13px", color: "red" }}>
          {error}
        </p>
      )}
    </div>
  );
}
