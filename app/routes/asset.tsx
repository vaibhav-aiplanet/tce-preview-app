import { useState } from "react";
import {
  useParams,
  useNavigate,
  useLocation,
  useSearchParams,
  useOutletContext,
} from "react-router";
import { Button, Input, Spinner } from "@heroui/react";
import { redirectToLogin, logout } from "~/lib/auth";
import { useTCEPlayerData } from "~/lib/tce-queries";
import TCEPlayer from "~/components/TCEPlayer";
import PlayerDialog from "~/components/PlayerDialog";
import VideoPlayerSkeleton from "~/components/VideoPlayerSkeleton";

interface OutletContextType {
  batchData: {
    accessToken: string;
    expiryTime: number;
    expiresIn: number;
    assets: TCEAsset[];
  } | null;
}

export async function clientLoader() {
  if (!sessionStorage.getItem("token")) {
    redirectToLogin();
  }
  return null;
}

export default function Asset() {
  const { assetId: paramAssetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { batchData } = useOutletContext<OutletContextType>();
  const fromGrid = location.state?.fromGrid === true;

  const [inputValue, setInputValue] = useState(paramAssetId || "");

  const gridAsset = batchData?.assets.find((a) => a.assetId === paramAssetId);

  const {
    data: playerData,
    isLoading,
    error,
  } = useTCEPlayerData(fromGrid && gridAsset ? "" : paramAssetId || "");

  const handleSubmit = () => {
    const trimmedId = inputValue.trim();
    if (!trimmedId) return;
    navigate(`/${trimmedId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  if (fromGrid && gridAsset && batchData) {
    return (
      <PlayerDialog
        asset={gridAsset}
        accessToken={batchData.accessToken}
        expiryTime={batchData.expiryTime}
        expiresIn={batchData.expiresIn}
        onClose={() => navigate(`/?${searchParams.toString()}`)}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Navigation bar */}
      <nav className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
        <Button variant="ghost" size="sm" onPress={() => navigate("/")}>
          Home
        </Button>
        <Button variant="ghost" size="sm" onPress={logout}>
          Logout
        </Button>
      </nav>

      {/* Header section */}
      <div className="flex flex-col items-center gap-3 px-6 py-5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Preview TCE Asset
        </h1>
        <Input
          className="w-80"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter Asset ID"
          disabled={isLoading}
        />
        <span className="text-sm text-muted">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" />
              Loading...
            </span>
          ) : error ? (
            <span className="text-danger">{error.message}</span>
          ) : (
            <>
              Press <strong>Enter</strong> to load player
            </>
          )}
        </span>
      </div>

      {/* Player area */}
      <div className="flex-1">
        {isLoading && !playerData && (
          <div className="flex h-full items-center justify-center p-6">
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
