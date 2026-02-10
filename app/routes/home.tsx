import { useState } from "react";
import type { Route } from "./+types/home";
import { useSearchParams } from "react-router";
import { redirectToLogin } from "~/lib/auth";
import { useTCEPlayerData } from "~/lib/tce-queries";
import TCEPlayer from "~/components/TCEPlayer";
import VideoPlayerSkeleton from "~/components/VideoPlayerSkeleton";

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

  const { data: playerData, isLoading, error } = useTCEPlayerData(submittedId);

  const handleSubmit = () => {
    const trimmedId = assetId.trim();
    if (!trimmedId) return;
    setSearchParams({ assetId: trimmedId });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

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
          ...(!playerData && !isLoading
            ? { flex: 1, justifyContent: "center" }
            : {}),
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
          {isLoading ? (
            "Loading..."
          ) : error ? (
            <span style={{ color: "red" }}>{error.message}</span>
          ) : (
            <>
              Press <strong>Enter</strong> to load player
            </>
          )}
        </span>
      </div>

      <div style={{ flex: 1 }}>
        {isLoading && !playerData && (
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
      </div>
    </div>
  );
}
