import { Skeleton } from "@/components/ui/skeleton";

export function TrashItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
      {/* Preview/Icon */}
      <Skeleton className="h-12 w-12 rounded flex-shrink-0" />

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      {/* Expiration Info (hidden on mobile) */}
      <div className="hidden md:flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <div className="space-y-1">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  );
}
