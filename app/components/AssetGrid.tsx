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
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "16px",
        padding: "16px 24px",
      }}
    >
      {assets.map((asset) => {
        const thumb = getThumbnailUrl(asset);
        return (
          <div
            key={asset.assetId}
            onClick={() => onSelect(asset)}
            style={{
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              overflow: "hidden",
              cursor: "pointer",
              transition: "box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 2px 8px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              style={{
                aspectRatio: "16 / 9",
                backgroundColor: "#1a1a1a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {thumb ? (
                <img
                  src={thumb}
                  alt={asset.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span style={{ color: "#666", fontSize: "13px" }}>
                  No thumbnail
                </span>
              )}
            </div>
            <div style={{ padding: "10px 12px" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={asset.title}
              >
                {asset.title || "Untitled"}
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "12px",
                  color: "#888",
                }}
              >
                {asset.subType || asset.mimeType}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
