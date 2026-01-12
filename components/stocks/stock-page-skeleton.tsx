"use client"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function StockPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Skeleton */}
      <div className="border-b border-border">
        <div className="container mx-auto padding-responsive py-3 fold:py-4">
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto padding-responsive py-6 fold:py-8 ipad:py-10">
        {/* Stock Header Skeleton */}
        <Card className="p-4 fold:p-5 ipad:p-6 mb-4 fold:mb-6 animate-pulse">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="w-12 h-12 fold:w-14 fold:h-14 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="w-10 h-10 rounded-md" />
              <Skeleton className="w-10 h-10 rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-1 fold:grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </Card>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 ipad:grid-cols-3 gap-4 fold:gap-6">
          {/* Left Column */}
          <div className="ipad:col-span-2 space-y-4 fold:space-y-6">
            {/* Chart Skeleton */}
            <Card className="p-4 fold:p-5 ipad:p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-32" />
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <Skeleton key={i} className="h-7 w-12" />
                  ))}
                </div>
              </div>
              <Skeleton className="h-64 fold:h-72 ipad:h-80 w-full rounded-lg" />
            </Card>

            {/* AI Summary Skeleton */}
            <Card className="p-4 fold:p-5 ipad:p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </Card>
          </div>

          {/* Right Column: Metrics Skeleton */}
          <div className="ipad:col-span-1">
            <Card className="p-4 fold:p-5 ipad:p-6 animate-pulse">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="grid grid-cols-2 ipad:grid-cols-1 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* News Skeleton */}
        <div className="mt-6 fold:mt-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="space-y-3 fold:space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-4 fold:p-5 animate-pulse">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
