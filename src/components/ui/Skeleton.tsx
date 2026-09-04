/**
 * Skeletons mirror the shape of what is loading, so the layout doesn't jump
 * when content arrives. They pulse rather than shimmer — one less animation.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`block animate-pulse rounded bg-sunken ${className}`} aria-hidden="true" />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-card">
      <Skeleton className="h-4 w-2/5" />
      <Skeleton className="mt-2.5 h-3 w-3/5" />
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
    </div>
  );
}
