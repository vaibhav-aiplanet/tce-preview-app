import { useState } from "react";
import type { Route } from "./+types/home";
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
  const [assetId, setAssetId] = useState("");
  const [submittedId, setSubmittedId] = useState("");

  const { data: playerData, isLoading, error } = useTCEPlayerData(submittedId);

  const handleSubmit = () => {
    const trimmedId = assetId.trim();
    if (!trimmedId) return;
    setSubmittedId(trimmedId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div>
      {!playerData && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            gap: "16px",
            padding: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
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
          {isLoading && <VideoPlayerSkeleton />}
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
  );
}
