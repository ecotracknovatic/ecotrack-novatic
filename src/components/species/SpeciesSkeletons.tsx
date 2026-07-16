function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

export function SpeciesCardSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border p-4">
      <Bone className="h-32 w-full rounded-xl" />
      <Bone className="h-4 w-2/3" />
      <Bone className="h-3 w-1/2" />
      <div className="flex gap-2 pt-1">
        <Bone className="h-5 w-16 rounded-full" />
        <Bone className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function SpeciesGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SpeciesCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function SpeciesTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-2 rounded-lg border p-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Bone key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
