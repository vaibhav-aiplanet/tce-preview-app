import { Skeleton } from "@heroui/react";

interface VideoPlayerSkeletonProps {
  maxWidth?: string;
}

export default function VideoPlayerSkeleton({
  maxWidth = "960px",
}: VideoPlayerSkeletonProps) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-xl bg-black/90"
      style={{ maxWidth, aspectRatio: "16 / 9" }}
    >
      {/* Main shimmer area */}
      <Skeleton className="absolute inset-0 rounded-none" />

      {/* Play button placeholder */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="h-14 w-14 rounded-full bg-white/10" />
        <div className="h-3 w-28 rounded-md bg-white/8" />
      </div>

      {/* Controls bar placeholder */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2.5 bg-white/5 px-3 py-2">
        <div className="h-6 w-6 rounded bg-white/10" />
        <div className="h-1 flex-1 rounded-full bg-white/10" />
        <div className="h-3 w-12 rounded-md bg-white/8" />
      </div>
    </div>
  );
}
