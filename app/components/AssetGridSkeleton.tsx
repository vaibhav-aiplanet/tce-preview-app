import { Card, Skeleton } from "@heroui/react";

interface AssetGridSkeletonProps {
  count?: number;
}

export default function AssetGridSkeleton({ count = 12 }: AssetGridSkeletonProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5 p-6 pt-2">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden p-0" variant="default">
          {/* Thumbnail placeholder */}
          <Skeleton className="aspect-video w-full rounded-none" />
          {/* Text placeholders */}
          <div className="flex flex-col gap-2 p-3">
            <Skeleton className="h-4 w-4/5 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}
