import { CardSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="space-y-8">
      <span className="sr-only">Loading</span>
      <div>
        <Skeleton className="h-6 w-56" />
        <Skeleton className="mt-2.5 h-4 w-80 max-w-full" />
      </div>
      <CardSkeleton />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton />
      </div>
    </div>
  );
}
