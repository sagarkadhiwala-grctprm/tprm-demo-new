export function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-white/10 rounded-lg ${className}`}
      aria-hidden
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-white/10 p-6 space-y-4">
      <SkeletonBox className="h-6 w-1/3" />
      <SkeletonBox className="h-4 w-full" />
      <SkeletonBox className="h-4 w-5/6" />
      <SkeletonBox className="h-4 w-4/6" />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <SkeletonBox className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBox key={i} className="h-14 w-full" />
      ))}
    </div>
  )
}

export function ReportSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <SkeletonBox className="h-32 w-full lg:w-2/3" />
        <SkeletonBox className="h-40 w-40 rounded-full mx-auto" />
      </div>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  )
}
