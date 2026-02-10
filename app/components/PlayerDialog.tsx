import { useEffect, useRef } from "react";
import TCEPlayer from "~/components/TCEPlayer";

interface PlayerDialogProps {
  asset: TCEAsset;
  accessToken: string;
  expiryTime: number;
  expiresIn: number;
  onClose: () => void;
}

export default function PlayerDialog({
  asset,
  accessToken,
  expiryTime,
  expiresIn,
  onClose,
}: PlayerDialogProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "8px",
          width: "90vw",
          maxWidth: "1100px",
          height: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          <span style={{ fontWeight: 600, fontSize: "16px" }}>
            {asset.title || "Untitled"}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              padding: "4px 8px",
              color: "#666",
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <TCEPlayer
            accessToken={accessToken}
            expiryTime={expiryTime}
            expiresIn={expiresIn}
            asset={asset}
          />
        </div>
      </div>
    </div>
  );
}
