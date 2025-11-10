import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Skeleton loading state for article cards
 * Shows while filters are being applied or articles are loading
 */
export function ArticleCardSkeleton() {
  return (
    <Card className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6">
      {/* Image skeleton - full width on mobile, side on desktop */}
      <Skeleton className="shrink-0 w-full h-48 sm:w-40 sm:h-28 md:w-48 md:h-32 rounded-md sm:order-2" />
      
      <div className="flex-1 sm:order-1 space-y-3">
        {/* Title skeleton - 2 lines */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>
        
        {/* Description skeleton - 2-3 lines */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        
        {/* Meta info skeleton */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </Card>
  )
}

/**
 * Multiple skeleton cards for loading state
 */
export function ArticleListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: count }).map((_, i) => (
        <ArticleCardSkeleton key={i} />
      ))}
    </div>
  )
}
