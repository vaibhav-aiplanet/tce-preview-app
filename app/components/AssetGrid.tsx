import { Card, Chip } from "@heroui/react";

interface AssetGridProps {
  assets: TCEAsset[];
  onSelect: (asset: TCEAsset) => void;
}

function getThumbnailUrl(asset: TCEAsset) {
  if (!asset.encryptedFilePath || !asset.thumbFileName) return null;
  return `/tce-repo-api/1/web/1/content/fileservice/${asset.encryptedFilePath}/${asset.assetId}/${asset.thumbFileName}`;
}

export default function AssetGrid({ assets, onSelect }: AssetGridProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5 p-6 pt-2">
      {assets.map((asset) => {
        const thumb = getThumbnailUrl(asset);
        return (
          <Card
            key={asset.assetId}
            className="cursor-pointer overflow-hidden p-0 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]"
            variant="default"
          >
            <div onClick={() => onSelect(asset)}>
              <div className="relative aspect-video bg-black/90 overflow-hidden">
                {thumb ? (
                  <img
                    src={thumb}
                    alt={asset.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-muted/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      className="h-8 w-8 text-muted/50"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                      />
                    </svg>
                    <span className="text-xs text-muted/50">No preview</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5 p-3 pt-2.5">
                <p
                  className="truncate text-sm font-medium text-foreground"
                  title={asset.title}
                >
                  {asset.title || "Untitled"}
                </p>
                {(asset.subType || asset.mimeType) && (
                  <Chip className="w-fit text-xs">
                    {asset.subType || asset.mimeType}
                  </Chip>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
