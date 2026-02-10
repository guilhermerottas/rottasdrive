import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ArquivoItemSkeletonProps {
  viewMode: "list" | "grid" | "masonry";
}

export function ArquivoItemSkeleton({ viewMode }: ArquivoItemSkeletonProps) {
  // Masonry layout - Pinterest style
  if (viewMode === "masonry") {
    return (
      <div className="break-inside-avoid mb-4">
        {/* Image/Preview Container */}
        <div className="relative overflow-hidden rounded-2xl bg-muted">
          <Skeleton className="w-full aspect-[4/3]" />
        </div>

        {/* Info below image */}
        <div className="mt-2 px-1">
          <Skeleton className="h-4 w-2/3 mb-1" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    );
  }

  // Grid layout
  if (viewMode === "grid") {
    return (
      <div className="flex flex-col items-center p-4 rounded-lg border">
        {/* Icon/Preview */}
        <Skeleton className="h-20 w-20 rounded mb-3" />

        {/* Info */}
        <Skeleton className="h-4 w-3/4 mb-1" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    );
  }

  // List layout
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border">
      {/* Thumbnail */}
      <Skeleton className="h-10 w-10 rounded flex-shrink-0" />

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  );
}
