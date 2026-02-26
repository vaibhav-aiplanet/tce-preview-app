import { Input, Spinner } from "@heroui/react";
import { eq } from "drizzle-orm";
import { useState } from "react";
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from "react-router";
import { content_db } from "~/db";
import { chapter_assets } from "~/db/models/content/chapter-assets";
import PlayerDialog from "~/components/PlayerDialog";
import TCEPlayer from "~/components/TCEPlayer";
import VideoPlayerSkeleton from "~/components/VideoPlayerSkeleton";
import { redirectToLogin } from "~/lib/auth";
import { useTCEPlayerData } from "~/lib/tce-queries";
import NavBar from "~/components/NavBar";
import type { Route } from "./+types/asset";

interface OutletContextType {
  batchData: {
    accessToken: string;
    expiryTime: number;
    expiresIn: number;
    assets: TCEAsset[];
  } | null;
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const assetId = params.assetId;
  if (!assetId) return Response.json(null);

  const url = new URL(request.url);
  const grade = url.searchParams.get("grade") || "";
  const book = url.searchParams.get("book") || "";

  const rows = await content_db
    .select({ title: chapter_assets.title })
    .from(chapter_assets)
    .where(eq(chapter_assets.asset_id, assetId));

  const title = rows[0]?.title || "";

  // Extract readable book name from the JSON file path
  const bookName = book
    ? decodeURIComponent(book)
        .replace(/^\/azvasa\/\d+\//, "")
        .replace(/-\d+\.json$/, "")
        .replace(/\+/g, " ")
    : "";

  return Response.json({
    title,
    grade,
    bookName,
    origin: url.origin,
    pageUrl: url.href,
  });
}

export function meta({ data, params }: Route.MetaArgs) {
  // During SSR, data comes from the server loader.
  // The clientLoader returns null, so TS types data as null — cast here
  // since OG tags only matter during SSR where the server loader runs.
  const loaderData = data as {
    title: string;
    grade: string;
    bookName: string;
    origin: string;
    pageUrl: string;
  } | null;
  const title = loaderData?.title || `Asset ${params.assetId}`;
  const origin = loaderData?.origin || "";
  const ogImageParams = new URLSearchParams({ title });
  if (loaderData?.grade) ogImageParams.set("grade", loaderData.grade);
  if (loaderData?.bookName) ogImageParams.set("book", loaderData.bookName);

  return [
    { title: `${title} | TCE Preview` },
    { property: "og:type", content: "video.other" },
    { property: "og:site_name", content: "TCE Preview" },
    { property: "og:url", content: loaderData?.pageUrl || "" },
    { property: "og:title", content: title },
    { property: "og:description", content: `Preview TCE asset: ${title}` },
    {
      property: "og:image",
      content: `${origin}/_api/og-image?${ogImageParams.toString()}`,
    },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
  ];
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
  const [inputValue, setInputValue] = useState(paramAssetId || "");

  const fromGrid = location.state?.fromGrid === true;
  const gridAsset = batchData?.assets.find((a) => a.assetId === paramAssetId);

  const {
    data: playerData,
    isLoading,
    error,
    refetch,
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
      <NavBar />

      {/* Header section */}
      <div className="flex flex-col items-center gap-2.5 px-6 pt-4 pb-3">
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
        <span className="text-xs text-muted">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" />
              Loading...
            </span>
          ) : error ? (
            <span className="flex items-center gap-2 text-danger">
              {error.message}
              <button
                onClick={() => refetch()}
                className="cursor-pointer rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background transition-opacity hover:opacity-90"
              >
                Retry
              </button>
            </span>
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
