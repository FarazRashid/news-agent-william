"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client"
import { mapArticleRowToArticle } from "@/lib/articles"
import type { Article } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

interface StockNewsFeedProps {
  symbol: string
  companyName: string
  limit?: number
}

export function StockNewsFeed({ symbol, companyName, limit = 4 }: StockNewsFeedProps) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadArticles = async () => {
      setLoading(true)
      setError(null)

      try {
        const supabase = createSupabaseBrowserClient()

        // Search for articles mentioning the company or symbol
        // This uses your existing articles database
        const { data, error: fetchError } = await supabase
          .from("articles")
          .select("*")
          .or(
            `headline.ilike.%${companyName}%,` +
            `headline.ilike.%${symbol}%,` +
            `lead_paragraph.ilike.%${companyName}%,` +
            `body.ilike.%${companyName}%`
          )
          .order("published_at", { ascending: false })
          .limit(limit)

        if (fetchError) throw fetchError

        if (data) {
          const mappedArticles = data.map(mapArticleRowToArticle)
          setArticles(mappedArticles)
        }
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
            No news articles found mentioning {companyName} ({symbol}) in our database yet.
          </p>
          <p className="text-sm text-muted-foreground">
            💡 As articles are added to the system, company mentions will automatically appear here.
          </p>
        </div>
      </Card>
    )
  }

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
      case "bullish":
        return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
      case "negative":
      case "bearish":
        return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-4 fold:space-y-5">
      {articles.map((article) => (
        <Link key={article.id} href={`/article/${article.id}`}>
          <Card className="p-4 mt-2 fold:p-5 hover:border-primary hover:shadow-md transition-all cursor-pointer group">
            <div className="space-y-2 fold:space-y-3">
              {/* Title */}
              <h3 className="text-base fold:text-lg font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {article.title}
              </h3>

              {/* Description */}
              {article.description && (
                <p className="text-sm fold:text-base text-muted-foreground line-clamp-2">
                  {article.description}
                </p>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-2 fold:gap-3 text-xs fold:text-sm">
                {/* Source */}
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-4 fold:w-6 fold:h-5 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                    {article.source.logo}
                  </div>
                  <span className="font-medium">{article.source.name}</span>
                </div>

                <span className="text-muted-foreground">•</span>

                {/* Time */}
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3 h-3 fold:w-4 fold:h-4" />
                  <span>{formatDistanceToNow(article.publishedAt, { addSuffix: true })}</span>
                </div>

                {/* Sentiment */}
                {article.sentiment && (
                  <>
                    <span className="text-muted-foreground hidden fold:inline">•</span>
                    <div className="flex items-center gap-1">
                      {getSentimentIcon(article.sentiment)}
                      <span className="capitalize text-muted-foreground">{article.sentiment}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Topics */}
              {article.topics && article.topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 fold:gap-2">
                  {article.topics.slice(0, 3).map((topic, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                  {article.topics.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{article.topics.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
