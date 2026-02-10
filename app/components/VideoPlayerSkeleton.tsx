import type { CSSProperties } from "react";

interface VideoPlayerSkeletonProps {
  maxWidth?: string;
  style?: CSSProperties;
}

export default function VideoPlayerSkeleton({
  maxWidth = "960px",
  style,
}: VideoPlayerSkeletonProps) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth,
        aspectRatio: "16 / 9",
        backgroundColor: "#1a1a1a",
        borderRadius: "8px",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
          animation: "shimmer 1.5s infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.1)",
          }}
        />
        <div
          style={{
            width: "120px",
            height: "12px",
            borderRadius: "6px",
            backgroundColor: "rgba(255,255,255,0.08)",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "40px",
          backgroundColor: "rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "4px",
            backgroundColor: "rgba(255,255,255,0.1)",
          }}
        />
        <div
          style={{
            flex: 1,
            height: "4px",
            borderRadius: "2px",
            backgroundColor: "rgba(255,255,255,0.1)",
          }}
        />
        <div
          style={{
            width: "48px",
            height: "12px",
            borderRadius: "6px",
            backgroundColor: "rgba(255,255,255,0.08)",
          }}
        />
      </div>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
