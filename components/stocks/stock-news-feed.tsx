"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface StockNewsFeedProps {
  symbol: string
  companyName: string
  limit?: number
}

export function StockNewsFeed({ symbol, companyName, limit = 4 }: StockNewsFeedProps) {
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

  return (
    <div className="space-y-4 fold:space-y-5">
      {articles.map((article) => (
        <Link key={article.id} href={article.url} target="_blank" rel="noopener noreferrer">
          <Card className="p-4 mt-2 fold:p-5 hover:border-primary hover:shadow-md transition-all cursor-pointer group">
            <div className="space-y-2 fold:space-y-3">
              <h3 className="text-base fold:text-lg font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {article.headline}
              </h3>

              {article.summary && (
                <p className="text-sm fold:text-base text-muted-foreground line-clamp-2">
                  {article.summary}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 fold:gap-3 text-xs fold:text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-4 fold:w-6 fold:h-5 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                    {article.source?.slice(0, 1)?.toUpperCase() || "N"}
                  </div>
                  <span className="font-medium">{article.source || "Unknown"}</span>
                </div>

                <span className="text-muted-foreground">•</span>

                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3 h-3 fold:w-4 fold:h-4" />
                  <span>
                    {formatDistanceToNow(new Date(article.datetime * 1000), { addSuffix: true })}
                  </span>
                </div>
              </div>

              {article.category && (
                <div className="flex flex-wrap gap-1.5 fold:gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {article.category}
                  </Badge>

                  {Array.isArray(article.tags) &&
                    article.tags.slice(0, 5).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                </div>
              )}

              {!article.category && Array.isArray(article.tags) && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 fold:gap-2">
                  {article.tags.slice(0, 6).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
