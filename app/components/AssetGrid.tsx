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
    <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 p-6">
      {assets.map((asset) => {
        const thumb = getThumbnailUrl(asset);
        return (
          <Card
            key={asset.assetId}
            className="cursor-pointer overflow-hidden p-0 transition-shadow hover:shadow-lg"
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
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-sm text-muted">No thumbnail</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 p-3">
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
