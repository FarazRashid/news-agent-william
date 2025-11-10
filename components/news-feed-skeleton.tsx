"use client"

import { Skeleton } from "@/components/ui/skeleton"

function ArticleSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex gap-4">
      <div className="flex-1 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <div className="flex items-center gap-3 pt-1">
          <div className="w-5 h-5 rounded-full bg-accent" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="hidden md:block shrink-0">
        <Skeleton className="w-32 h-24 rounded" />
      </div>
    </div>
  )
}

export default function NewsFeedSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-8">
      {[...Array(Math.ceil(count / 2)).keys()].map((i) => (
        <div key={i}>
          <Skeleton className="h-5 w-48 mb-4" />
          <div className="space-y-4">
            <ArticleSkeleton />
            <ArticleSkeleton />
          </div>
        </div>
      ))}
    </div>
  )
}
