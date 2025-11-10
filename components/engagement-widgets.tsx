"use client"

import { useMemo } from "react"
import { useNews } from "@/lib/news-context"
import { useSidebarContext } from "@/components/header"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function EngagementWidgets() {
  const { filterCounts, filteredArticles, filters, updateFilter } = useNews()
  const { isRightCollapsed, toggleRightSidebar } = useSidebarContext()

  const relatedTopics = useMemo(() => {
    const topics: Record<string, number> = {}
    const normalize = (topic: string) => {
      // Convert to lowercase and trim
      let t = topic.toLowerCase().trim()

      // Merge similar terms into one
      if (t.includes("retirement")) t = "retirement"
      if (t.includes("finance")) t = "finance"
      if (t.includes("investment")) t = "investment"
      if (t.includes("health")) t = "health"

      return t
    }

    filteredArticles.forEach((article) => {
      article.topics.forEach((topic) => {
        const normalized = normalize(topic)
        topics[normalized] = (topics[normalized] || 0) + 1
      })
    })

    return Object.entries(topics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
  }, [filteredArticles])


  const trendingPublishers = useMemo(() => {
    return Object.entries(filterCounts.sources)
      .map(([name, count]) => ({
        name,
        count,
        percentage: ((count / filteredArticles.length) * 100).toFixed(1),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [filterCounts, filteredArticles])

  const trendingSources = useMemo(() => {
    // Stable pseudo-change metric derived from domain string so SSR/CSR match
    return Object.entries(filterCounts.domains)
      .map(([domain, count]) => {
        // Simple hash to create deterministic change between -5 and +14
        let hash = 0
        for (let i = 0; i < domain.length; i++) {
          hash = (hash * 31 + domain.charCodeAt(i)) >>> 0
        }
        const change = (hash % 20) - 5
        return { domain, count, change }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [filterCounts])

  return (
    <>
      {/* Collapsed state - thin bar on the right */}
      {isRightCollapsed && (
        <div className="hidden xl:flex flex-col w-12 border-l border-border bg-card items-center py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRightSidebar}
            className="h-10 w-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Expanded state - full sidebar */}
      {!isRightCollapsed && (
        <aside className="hidden xl:flex flex-col w-80 border-l border-border bg-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground text-base">Insights</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleRightSidebar}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Related Topics */}
            <div className="mb-8">
              <h3 className="font-semibold text-foreground mb-4 text-sm">Related Topics</h3>
              <div className="space-y-2">
                {relatedTopics.map(([topic, count]) => (
                  <div
                    key={topic}
                    onClick={() => {
                      // Add topic filter logic if needed
                    }}
                    className="flex items-center justify-between text-sm hover:bg-muted p-2 rounded cursor-pointer transition-colors"
                  >
                    <span className="text-foreground">{topic}</span>
                    <span className="text-muted-foreground font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Publishers */}
            <div className="mb-8">
              <h3 className="font-semibold text-foreground mb-4 text-sm">Trending Publishers</h3>
              <div className="space-y-2">
                {trendingPublishers.map((publisher) => (
                  <div
                    key={publisher.name}
                    onClick={() => {
                      updateFilter("sources", [publisher.name])
                    }}
                    className="flex items-center justify-between text-sm hover:bg-muted p-2 rounded cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        {publisher.name.charAt(0)}
                      </div>
                      <span className="text-foreground">{publisher.name}</span>
                    </div>
                    <span className="font-medium text-sm text-success">{publisher.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Sources */}
            <div>
              <h3 className="font-semibold text-foreground mb-4 text-sm">Trending Sources</h3>
              <div className="space-y-2">
                {trendingSources.map((source) => (
                  <div
                    key={source.domain}
                    onClick={() => {
                      updateFilter("sources", [...filters.sources, source.domain])
                    }}
                    className="flex items-center justify-between text-sm hover:bg-muted p-2 rounded cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        {source.domain.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-foreground">{source.domain}</span>
                    </div>
                    <span className={`font-medium text-sm ${source.change > 0 ? "text-success" : "text-error"}`}>
                      {source.change > 0 ? "+" : ""}
                      {source.change}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      )}
    </>
  )
}
