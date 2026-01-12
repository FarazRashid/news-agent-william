"use client"

import { useEffect, useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Article } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Eye, TrendingUp } from "lucide-react"
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client"
import { fetchArticleById, fetchArticlesFromSupabase } from "@/lib/articles"
import { ArticleMetadata, ArticleSEOKeywords } from "@/components/article-metadata"
import { ArticleContextBlock } from "@/components/article-context-block"
import { ArticleKeyInsights } from "@/components/article-key-insights"
import { ArticleNavigation } from "@/components/article-navigation"
import { 
  TrendingStoriesWidget, 
  SourcesUsedWidget, 
  StoryStatsWidget,
  CompaniesTagsWidget,
  StoryHistoryWidget 
} from "@/components/article-sidebar-widgets"
import { ContinueExploring } from "@/components/continue-exploring"
import { ArticlePageSkeleton } from "@/components/article-page-skeleton"

export default function ArticleClient({ id }: { id: string }) {
  const [article, setArticle] = useState<Article | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const supabase = createSupabaseBrowserClient()
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const parsedId = isNaN(Number(id)) ? id : Number(id)
        const [fetchedArticle, allArticles] = await Promise.all([
          fetchArticleById(supabase, parsedId),
          fetchArticlesFromSupabase(supabase, { limit: 20 })
        ])
        if (!cancelled) {
          setArticle(fetchedArticle)
          // Filter related articles (same primary topic or topics)
          const related = allArticles
            .filter(a => a.id !== fetchedArticle?.id)
            .filter(a => 
              a.primaryTopic === fetchedArticle?.primaryTopic ||
              a.topics.some(t => fetchedArticle?.topics.includes(t))
            )
            .slice(0, 10)
          setRelatedArticles(related)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load article")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id])

  // Normalize content by converting escaped newlines to real newlines
  const normalizedContent = article?.content
    ? article.content.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim()
    : ""

  // Generate TL;DR and insights from content
  const tldrPoints = useMemo(() => {
    if (!article?.lead) return ["Key updates in this developing story"]
    const sentences = article.lead.split(/[.!?]+/).filter(s => s.trim().length > 20)
    return sentences.slice(0, 3).map(s => s.trim())
  }, [article])

  const whyItMatters = useMemo(() => {
    return article?.description || "This story provides important context for understanding current market developments and their potential impact on your financial decisions."
  }, [article])

  const keyInsights = useMemo(() => ({
    whatsGoingOn: article?.lead || article?.description || "Breaking developments in this ongoing story.",
    whatItMeans: article?.conclusion || "These developments may have significant implications for markets, investors, and economic policy.",
    whoIsAffected: article ? [
      ...article.entities.companies.slice(0, 3),
      ...article.topics.slice(0, 2)
    ].filter(Boolean) : []
  }), [article])

  const trendingTags = useMemo(() => {
    const allTopics = relatedArticles
      .flatMap(a => a.topics)
      .map(t => t.trim())
      .filter(t => t.length > 0)
    
    // Use case-insensitive deduplication
    const seen = new Map<string, string>()
    allTopics.forEach(topic => {
      const lowerTopic = topic.toLowerCase()
      if (!seen.has(lowerTopic)) {
        seen.set(lowerTopic, topic)
      }
    })
    
    const uniqueTopics = Array.from(seen.values())
    const topicCounts = uniqueTopics.reduce((acc, topic) => {
      acc[topic] = allTopics.filter(t => t.toLowerCase() === topic.toLowerCase()).length
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([topic]) => topic)
      .slice(0, 8)
  }, [relatedArticles])

  const suggestedSectors = useMemo(() => {
    const allCategories = relatedArticles
      .map(a => a.category)
      .filter(Boolean)
      .flatMap(cat => cat.split('/'))
      .map(s => s.trim())
    return Array.from(new Set(allCategories)).slice(0, 6)
  }, [relatedArticles])

  if (loading) {
    return <ArticlePageSkeleton />
  }

  if (error || !article) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{error ? "Failed to load article" : "Article not found"}</h1>
          <Link href="/">
            <Button variant="default">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Persistent Navigation */}
      <ArticleNavigation trendingTags={trendingTags} />

      {/* Article Header - Full Width */}
      <div className="container mx-auto padding-responsive py-6 fold:py-8 ipad:py-10">
        <div className="mb-6 fold:mb-8">
          <div className="grid grid-cols-1 ipad:grid-cols-3 gap-4 fold:gap-6 mb-4 fold:mb-6">
            {/* Header Content */}
            <div className="order-2 ipad:order-1 ipad:col-span-2">
              <h1 className="text-2xl fold:text-3xl ipad:text-4xl trifold:text-5xl font-bold leading-tight mb-3 fold:mb-4">
                {article.title}
              </h1>
              {article.subheadline && (
                <p className="text-base fold:text-lg ipad:text-xl text-muted-foreground mb-3 fold:mb-4">{article.subheadline}</p>
              )}
              
              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-2 fold:gap-3 text-xs fold:text-sm text-muted-foreground border-t border-b border-border py-2 fold:py-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-5 fold:w-8 fold:h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                    {article.source.logo}
                  </div>
                  <span className="font-medium">{article.source.name}</span>
                </div>
                <span className="hidden fold:inline">•</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(article.publishedAt)}</span>
                </div>
                {article.readTimeMinutes && (
                  <>
                    <span className="hidden fold:inline">•</span>
                    <span>{article.readTimeMinutes} min read</span>
                  </>
                )}
                {article.sentiment && (
                  <>
                    <span className="hidden fold:inline">•</span>
                    <Badge variant="secondary" className="capitalize text-xs">
                      {article.sentiment}
                    </Badge>
                  </>
                )}
              </div>
              
              {/* AI Byline */}
              <p className="text-xs fold:text-sm text-muted-foreground italic mt-2 fold:mt-3">
                Generated by <span className="font-medium">ai AI</span> using analysis and synthesis of the referenced news sources.
              </p>
            </div>

            {/* Smaller Hero Image - Aligned Right */}
            <div className="order-1 ipad:order-2 flex justify-center ipad:justify-end">
              <div className="relative w-full max-w-md h-48 fold:h-56 ipad:h-64 bg-muted rounded-lg overflow-hidden">
                <Image 
                  src={article.image || "/placeholder.svg"} 
                  alt={article.title} 
                  fill 
                  className="object-cover" 
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 ipad:grid-cols-12 gap-6 fold:gap-8">
          
          {/* Main Content - Center Column (Wider) */}
          <main className="ipad:col-span-8 trifold:col-span-9">

            {/* Article Context Block */}
            <ArticleContextBlock 
              tldr={tldrPoints}
              whyItMatters={whyItMatters}
              sentiment={article.sentiment}
            />

            {/* Key Insights Section */}
            <ArticleKeyInsights
              whatsGoingOn={keyInsights.whatsGoingOn}
              whatItMeans={keyInsights.whatItMeans}
              whoIsAffected={keyInsights.whoIsAffected}
            />

            {/* Main Article Body */}
            <Card className="p-4 fold:p-6 ipad:p-8 mb-4 fold:mb-6">
              {article.lead && (
                <div className="mb-4 fold:mb-6 pb-4 fold:pb-6 border-b border-border">
                  <p className="text-base fold:text-lg leading-relaxed font-medium text-foreground">
                    {article.lead}
                  </p>
                </div>
              )}

              {normalizedContent ? (
                <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-20">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ node, ...props }) => <h1 className="mt-8 mb-4 font-bold text-3xl md:text-4xl leading-tight" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="mt-8 mb-4 font-bold text-2xl md:text-3xl leading-tight" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="mt-6 mb-3 font-semibold text-xl md:text-2xl" {...props} />,
                      h4: ({ node, ...props }) => <h4 className="mt-4 mb-2 font-semibold text-lg md:text-xl" {...props} />,
                      h5: ({ node, ...props }) => <h5 className="mt-4 mb-2 font-semibold text-base md:text-lg" {...props} />,
                      h6: ({ node, ...props }) => <h6 className="mt-4 mb-2 font-semibold text-sm md:text-base" {...props} />,
                      p: ({ node, ...props }) => <p className="leading-relaxed text-foreground mb-4" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-6 space-y-2 mb-4" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal pl-6 space-y-2 mb-4" {...props} />,
                      li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                      a: ({ node, ...props }) => <a className="text-primary hover:underline font-medium" {...props} />,
                      blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-primary pl-6 py-2 italic my-6 text-muted-foreground bg-muted/30 rounded-r" {...props} />
                      ),
                      code: ({ node, inline, ...props }: any) =>
                        inline ? (
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono" {...props} />
                        ) : (
                          <code className="block bg-muted p-4 rounded text-sm font-mono overflow-x-auto" {...props} />
                        ),
                      pre: ({ node, ...props }) => <pre className="bg-muted p-4 rounded overflow-x-auto mb-4" {...props} />,
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto mb-6 rounded-lg border border-border">
                          <table className="min-w-full border-collapse" {...props} />
                        </div>
                      ),
                      th: ({ node, ...props }) => <th className="border border-border px-4 py-3 bg-muted font-semibold text-left" {...props} />,
                      td: ({ node, ...props }) => <td className="border border-border px-4 py-3" {...props} />,
                      hr: ({ node, ...props }) => <hr className="my-8 border-border" {...props} />,
                    }}
                  >
                    {normalizedContent}
                  </ReactMarkdown>
                </article>
              ) : (
                <p className="text-muted-foreground">No content available for this article.</p>
              )}

              {article.conclusion && (
                <div className="mt-8 pt-6 border-t border-border">
                  <h3 className="text-xl font-bold mb-3">Conclusion</h3>
                  <p className="text-foreground leading-relaxed">{article.conclusion}</p>
                </div>
              )}

              {/* Sources Attribution */}
              {(article.originalSources && article.originalSources.length > 0) && (
                <div className="mt-8 pt-6 border-t border-dashed border-border">
                  <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-3">
                    Sources Referenced
                  </p>
                  <ul className="space-y-3 text-sm">
                    {article.originalSources.map((s, i) => (
                      <li key={`${s.url||s.domain||s.name}-${i}`} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <div className="flex-1">
                          {s.url ? (
                            <a 
                              href={s.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline font-medium block"
                            >
                              {s.title || s.name}
                            </a>
                          ) : (
                            <span className="font-medium block">{s.title || s.name}</span>
                          )}
                          {s.domain && (
                            <span className="text-xs text-muted-foreground">{s.domain}</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground italic mt-4">
                    Content is AI-generated; verify critical information against the original publishers.
                  </p>
                </div>
              )}
            </Card>

            {/* Continue Exploring Section */}
            <ContinueExploring
              relatedArticles={relatedArticles}
              trendingTopics={trendingTags}
              suggestedSectors={suggestedSectors}
            />
          </main>

          {/* Right Sidebar - Engagement & Discovery Widgets */}
          <aside className="ipad:col-span-4 trifold:col-span-3 space-y-4 fold:space-y-6">
            {/* Trending Stories */}
            <TrendingStoriesWidget articles={relatedArticles} />

            {/* Sources Used */}
            <SourcesUsedWidget sources={article.originalSources || []} />

            {/* Story Stats */}
            <StoryStatsWidget
              totalSources={article.originalSources?.length || 0}
              articleCount={relatedArticles.length}
              publishRange={formatDate(article.publishedAt)}
              sentiment={article.sentiment}
            />

            {/* Companies & Tags */}
            <CompaniesTagsWidget
              companies={article.entities.companies}
              topics={article.topics}
              primaryTopic={article.primaryTopic}
            />

            {/* Story History - only if we have related articles */}
            {relatedArticles.length > 0 && (
              <StoryHistoryWidget
                events={relatedArticles.slice(0, 5).map(a => ({
                  date: a.publishedAt,
                  headline: a.title,
                  source: a.source.name
                }))}
              />
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
