import { useState } from "react";
import type { Route } from "./+types/home";
import { useSearchParams } from "react-router";
import { redirectToLogin } from "~/lib/auth";
import { useTCEPlayerData, useBatchAssetData } from "~/lib/tce-queries";
import TCEPlayer from "~/components/TCEPlayer";
import VideoPlayerSkeleton from "~/components/VideoPlayerSkeleton";
import ExcelUpload from "~/components/ExcelUpload";
import AssetGrid from "~/components/AssetGrid";
import PlayerDialog from "~/components/PlayerDialog";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TCE Assets Preview" },
    { name: "description", content: "Preview TCE Assets" },
  ];
}

export async function clientLoader() {
  if (!sessionStorage.getItem("token")) {
    redirectToLogin();
  }
  return null;
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const submittedId = searchParams.get("assetId") || "";
  const [assetId, setAssetId] = useState(submittedId);

  const [batchAssetIds, setBatchAssetIds] = useState<string[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<TCEAsset | null>(null);

  const { data: playerData, isLoading, error } = useTCEPlayerData(submittedId);
  const {
    data: batchData,
    isLoading: isBatchLoading,
    error: batchError,
  } = useBatchAssetData(batchAssetIds);

  const handleSubmit = () => {
    const trimmedId = assetId.trim();
    if (!trimmedId) return;
    setBatchAssetIds([]);
    setSearchParams({ assetId: trimmedId });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleExcelUpload = (ids: string[]) => {
    setBatchAssetIds(ids);
    setSearchParams({});
  };

  const showIdleState =
    !playerData && !isLoading && !batchData && !isBatchLoading;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          padding: "16px 24px",
          ...(showIdleState ? { flex: 1, justifyContent: "center" } : {}),
        }}
      >
        <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>
          Preview TCE Asset
        </h1>
        <input
          type="text"
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter Asset ID"
          disabled={isLoading}
          style={{
            padding: "10px 16px",
            fontSize: "16px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            width: "320px",
            outline: "none",
          }}
        />
        <span style={{ fontSize: "13px", color: "#888" }}>
          {isLoading || isBatchLoading ? (
            "Loading..."
          ) : error ? (
            <span style={{ color: "red" }}>{error.message}</span>
          ) : batchError ? (
            <span style={{ color: "red" }}>{batchError.message}</span>
          ) : (
            <>
              Press <strong>Enter</strong> to load player
            </>
          )}
        </span>
        <ExcelUpload onUpload={handleExcelUpload} />
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {(isLoading || isBatchLoading) && !playerData && !batchData && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              padding: "24px",
            }}
          >
            <VideoPlayerSkeleton />
          </div>
        )}

        {playerData && (
          <TCEPlayer
            accessToken={playerData.accessToken}
            expiryTime={playerData.expiryTime}
            expiresIn={playerData.expiresIn}
            asset={playerData.asset}
          />
        )}

        {batchData && batchData.assets.length > 0 && (
          <AssetGrid assets={batchData.assets} onSelect={setSelectedAsset} />
        )}
      </div>

      {selectedAsset && batchData && (
        <PlayerDialog
          asset={selectedAsset}
          accessToken={batchData.accessToken}
          expiryTime={batchData.expiryTime}
          expiresIn={batchData.expiresIn}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
}
