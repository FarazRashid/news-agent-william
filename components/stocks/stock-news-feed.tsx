"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

interface StockNewsFeedProps {
  symbol: string
  companyName: string
  limit?: number
  /** Optional timestamp (ms) for the point currently hovered on the price chart */
  hoveredTimestamp?: number | null
  /** Number of days back to fetch news for (default: 30) */
  daysBack?: number
}

export function StockNewsFeed({
  symbol,
  companyName,
  limit = 4,
  hoveredTimestamp,
}: StockNewsFeedProps) {
  const [articles, setArticles] = useState<
    Array<{
      id: number
      headline: string
      summary: string
      url: string
      datetime: number
      source: string
      category?: string
      tags?: string[]
    }>
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadArticles = async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/stocks/news?symbol=${encodeURIComponent(symbol)}`)
        if (!res.ok) {
          throw new Error(`Failed to fetch news (${res.status})`)
        }

        const payload = (await res.json()) as {
          symbol: string
          news: Array<{
            id: number
            category: string
            datetime: number
            headline: string
            source: string
            summary: string
            url: string
            tags?: string[]
          }>
        }

        const items = Array.isArray(payload.news) ? payload.news.slice(0, limit) : []
        setArticles(items)
      } catch (err: any) {
        console.error("Error loading stock news:", err)
        setError(err.message || "Failed to load news")
      } finally {
        setLoading(false)
      }
    }

    loadArticles()
  }, [symbol, companyName, limit])

  const filteredArticles = useMemo(() => {
    if (!hoveredTimestamp) return articles

    const hoveredDayKey = new Date(hoveredTimestamp).toISOString().slice(0, 10)

    const sameDay = articles.filter((article) => {
      const articleDate = new Date(article.datetime * 1000)
      const articleDayKey = articleDate.toISOString().slice(0, 10)
      return articleDayKey === hoveredDayKey
    })

    return sameDay
  }, [hoveredTimestamp, articles])

  if (loading) {
    return (
      <div className="space-y-3 fold:space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4 fold:p-5">
            <div className="animate-pulse space-y-3">
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
    )
  }

  if (error) {
    return (
      <Card className="p-6 fold:p-8 text-center">
        <p className="text-muted-foreground">Error loading news: {error}</p>
      </Card>
    )
  }

  if (articles.length === 0) {
    return (
      <Card className="p-6 fold:p-8 ipad:p-12 text-center">
        <div className="max-w-md mx-auto">
          <h3 className="text-lg fold:text-xl font-bold mb-2">No Recent News</h3>
          <p className="text-muted-foreground mb-4">
            No recent news found for {companyName} ({symbol}).
          </p>
        </div>
      </Card>
    )
  }

  const listToRender =
    hoveredTimestamp && filteredArticles.length > 0 ? filteredArticles : !hoveredTimestamp ? articles : []

  if (!listToRender.length) {
    // No news for this hovered date; don't render anything
    return null
  }

  return (
    <Carousel className="w-full py-1" opts={{ align: "start", skipSnaps: false }}>
      <CarouselContent>
        {listToRender.map((article) => {
          return (
            <CarouselItem
              key={article.id}
              className="basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
            >
              <Link href={article.url} target="_blank" rel="noopener noreferrer">
                <Card className="p-4 fold:p-5 h-full flex flex-col hover:border-primary/80 hover:shadow-md transition-all cursor-pointer group">
                  <div className="space-y-2 fold:space-y-3">
                    <h3 className="text-sm sm:text-base fold:text-lg font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-3">
                      {article.headline}
                    </h3>

                    {article.summary && (
                      <p className="text-xs sm:text-sm fold:text-base text-muted-foreground line-clamp-3">
                        {article.summary}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 fold:gap-3 text-[11px] sm:text-xs fold:text-sm">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-4 fold:w-6 fold:h-5 rounded bg-primary text-primary-foreground flex items-center justify-center text-[10px] sm:text-xs font-semibold">
                          {article.source?.slice(0, 1)?.toUpperCase() || "N"}
                        </div>
                        <span className="font-medium">{article.source || "Unknown"}</span>
                      </div>

                      <span className="text-muted-foreground">•</span>

                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3 fold:w-4 fold:h-4" />
                        <span>
                          {formatDistanceToNow(new Date(article.datetime * 1000), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>

                    {article.category && (
                      <div className="flex flex-wrap gap-1.5 fold:gap-2">
                        <Badge variant="secondary" className="text-[10px] sm:text-xs">
                          {article.category}
                        </Badge>

                        {Array.isArray(article.tags) &&
                          article.tags.slice(0, 4).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-[10px] sm:text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                      </div>
                    )}

                    {!article.category && Array.isArray(article.tags) && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 fold:gap-2">
                        {article.tags.slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px] sm:text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            </CarouselItem>
          )
        })}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  )
}
