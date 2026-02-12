import { useState } from "react";
import { useNavigate } from "react-router";
import { Input, Spinner } from "@heroui/react";
import ExcelUpload from "~/components/ExcelUpload";

interface ManualAssetInputProps {
  onBatchUpload: (ids: string[]) => void;
  isBatchLoading: boolean;
  batchError: Error | null;
}

export default function ManualAssetInput({
  onBatchUpload,
  isBatchLoading,
  batchError,
}: ManualAssetInputProps) {
  const navigate = useNavigate();
  const [assetId, setAssetId] = useState("");

  const handleSubmit = () => {
    const trimmedId = assetId.trim();
    if (!trimmedId) return;
    navigate(`/${trimmedId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleExcelUpload = (ids: string[]) => {
    setAssetId("");
    onBatchUpload(ids);
  };

  return (
    <>
      <Input
        className="w-80"
        value={assetId}
        onChange={(e) => setAssetId(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter Asset ID"
      />
      <span className="text-sm text-muted">
        {isBatchLoading ? (
          <span className="flex items-center gap-2">
            <Spinner size="sm" />
            Loading...
          </span>
        ) : batchError ? (
          <span className="text-danger">{batchError.message}</span>
        ) : (
          <>
            Press <strong>Enter</strong> to load player
          </>
        )}
      </span>
      <ExcelUpload onUpload={handleExcelUpload} />
    </>
  );
}
