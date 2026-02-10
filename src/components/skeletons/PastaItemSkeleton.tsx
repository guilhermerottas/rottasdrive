import { Skeleton } from "@/components/ui/skeleton";

export function PastaItemSkeleton() {
  return (
    <div className="w-[180px] h-[160px] flex flex-col items-center">
      {/* Folder Structure */}
      <div className="relative w-[140px] h-[100px]">
        {/* Folder Tab */}
        <Skeleton className="absolute top-0 left-6 w-[50px] h-4 rounded-t-lg" />

        {/* Folder Body */}
        <Skeleton className="absolute top-3 left-0 w-[140px] h-[90px] rounded-[10px]" />
      </div>

      {/* Folder Label */}
      <div className="mt-2 space-y-1 w-full px-2">
        <Skeleton className="h-4 w-3/4 mx-auto" />
        <Skeleton className="h-3 w-1/2 mx-auto" />
      </div>
    </div>
  );
}
