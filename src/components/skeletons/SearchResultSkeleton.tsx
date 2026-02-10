import { Skeleton } from "@/components/ui/skeleton";

export function SearchResultSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg">
      {/* File thumbnail */}
      <Skeleton className="flex-shrink-0 w-[100px] h-[100px] rounded-lg" />

      {/* File info */}
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* File size */}
      <Skeleton className="flex-shrink-0 h-4 w-16 hidden sm:block" />

      {/* Navigate button */}
      <Skeleton className="flex-shrink-0 h-7 w-20" />
    </div>
  );
}
