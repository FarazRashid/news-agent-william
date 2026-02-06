"use client"

import { useMemo, useState } from "react"
import { ChevronDown, ArrowUpDown } from "lucide-react"
import { canonicalizePrimaryTopic, normalizePrimarySubtopic } from "@/lib/filter-utils"
import { useNews } from "@/lib/news-context"
import NewsArticle from "./news-article"
import NewsFeedSkeleton from "./news-feed-skeleton"
import { ArticleListSkeleton } from "./article-card-skeleton"
import { ActiveFiltersChips } from "./active-filters-chips"
import { MobileFilterSheet } from "./mobile-filter-sheet"
import { SortDropdown } from "./sort-dropdown"
import { Button } from "./ui/button"
import ReferenceArticleCard from "./reference-article-card"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export default function NewsFeed() {
  const {
    filters,
    filteredArticles,
    sortOrder,
    setSortOrder,
    updateFilter,
    loading,
    error,
    availableCategories,
    availablePrimaryTopics,
    filterCounts,
    groupedPrimaryTopics,
    paginatedArticles,
    page,
    totalPages,
    setPage,
  } = useNews()

  const [filtersOpen, setFiltersOpen] = useState(true)
  const [showAllTopics, setShowAllTopics] = useState(false)
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null)
  const [olderShown, setOlderShown] = useState<number>(0)
  const [showAllOlder, setShowAllOlder] = useState<boolean>(false)
  const [olderPage, setOlderPage] = useState<number>(1)

  const formatLabel = (s: string) =>
    s
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ")

  // Track which primary topic is selected (single-select UX like before)
  const selectedPrimaryTopic = useMemo(() => {
    if (filters.primaryTopics.length === 0) return "All"
    const first = filters.primaryTopics[0]
    const canon = canonicalizePrimaryTopic(first)
    return canon || first
  }, [filters.primaryTopics])

  const groupedArticles = useMemo(() => {
    // Deprecated date grouping; retaining hook structure if needed for future grouping strategies
    return {}
  }, [paginatedArticles])

  const handlePrimaryTopicClick = (topic: string) => {
    if (topic === "All") {
      updateFilter("primaryTopics", [])
      setSelectedSubtopic(null)
    } else if (selectedPrimaryTopic === topic) {
      updateFilter("primaryTopics", [])
      setSelectedSubtopic(null)
    } else {
      updateFilter("primaryTopics", [topic])
      setSelectedSubtopic(null)
    }
  }

  // Sort primary topics by frequency desc then alphabetically
  const sortedPrimaryTopics = useMemo(() => {
    // Use grouped mains for deduped list
    return groupedPrimaryTopics.map((g) => g.main)
  }, [groupedPrimaryTopics])

  const TOPIC_LIMIT = 8
  const displayedTopics = useMemo(
    () => (showAllTopics ? sortedPrimaryTopics : sortedPrimaryTopics.slice(0, TOPIC_LIMIT)),
    [showAllTopics, sortedPrimaryTopics]
  )

  // Basic related topics by shared keyword with selected topic (exclude very short words)
  const relatedTopics = useMemo(() => {
    if (!selectedPrimaryTopic || selectedPrimaryTopic === "All") return [] as string[]
    const grp = groupedPrimaryTopics.find((g) => g.main === selectedPrimaryTopic)
    if (!grp) return []
    const mainNorm = normalizePrimarySubtopic(selectedPrimaryTopic)
    const cleaned = grp.subtopics.filter((s) => normalizePrimarySubtopic(s) !== mainNorm)
    return cleaned.slice(0, 15)
  }, [selectedPrimaryTopic, groupedPrimaryTopics])

  // When a topic is selected, show latest summary article for that topic
  const latestSummaryArticle = useMemo(() => {
    if (!selectedPrimaryTopic || selectedPrimaryTopic === "All") return null
    if (!filteredArticles || filteredArticles.length === 0) return null
    const sorted = [...filteredArticles].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    return sorted[0]
  }, [filteredArticles, selectedPrimaryTopic])

  const olderArticles = useMemo(() => {
    if (!selectedPrimaryTopic || selectedPrimaryTopic === "All") return [] as typeof filteredArticles
    if (!filteredArticles || filteredArticles.length <= 1) return [] as typeof filteredArticles
    const sorted = [...filteredArticles].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    return sorted.slice(1)
  }, [filteredArticles, selectedPrimaryTopic])

  return (
    <main className="flex-1 border-r border-border bg-background min-h-[calc(100vh-73px)]">
      {/* Mobile/Tablet Header with Filters */}
      <div className="ipad-pro:hidden sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center justify-between p-3 fold:p-4">
          <h1 className="text-lg fold:text-xl font-bold">
            Latest News
            <span className="ml-2 text-xs fold:text-sm text-muted-foreground font-normal">
              ({filteredArticles.length})
            </span>
          </h1>
          
          <div className="flex items-center gap-1 fold:gap-2">
            <MobileFilterSheet />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const nextSort =
                  sortOrder === "newest"
                    ? "oldest"
                    : sortOrder === "oldest"
                    ? "relevant"
                    : "newest"
                setSortOrder(nextSort)
              }}
              className="tap-target flex items-center gap-1"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span className="text-xs capitalize">
                {sortOrder === "newest"
                  ? "Newest"
                  : sortOrder === "oldest"
                  ? "Oldest"
                  : "Relevant"}
              </span>
            </Button>
          </div>
        </div>
        
        {/* Active filters chips - scrollable on mobile/fold */}
        <div className="px-3 fold:px-4 pb-2 fold:pb-3 overflow-x-auto scrollbar-hide">
          <ActiveFiltersChips />
        </div>
      </div>

  {/* Filters Header - Desktop/Large Tablets */}
  <div className="hidden ipad-pro:block bg-card border-b border-border p-4 ipad:p-6">
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="flex items-center justify-between w-full group"
        >
          <h3 className="font-semibold text-foreground text-sm">Topics</h3>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
        </button>
        {filtersOpen && (
          <div className="mt-4">
            {(loading || error) && (
              <div className={`mb-3 text-xs ${error ? "text-red-500" : "text-muted-foreground"}`}>
                {error ? `Error loading articles: ${error}` : "Loading latest articles from database..."}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mb-2">
              {(["All", ...displayedTopics] as string[]).map((topic) => (
                <button
                  type="button"
                  key={topic}
                  onClick={() => handlePrimaryTopicClick(topic)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    (topic === "All" && selectedPrimaryTopic === "All") ||
                    (topic !== "All" && selectedPrimaryTopic === topic)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  {formatLabel(topic)}
                </button>
              ))}
              {sortedPrimaryTopics.length > TOPIC_LIMIT && (
                <button
                  onClick={() => setShowAllTopics((v) => !v)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80"
                >
                  {showAllTopics ? "Less" : "More"}
                </button>
              )}
            </div>
            {/* {selectedPrimaryTopic && selectedPrimaryTopic !== "All" && relatedTopics.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-muted-foreground mb-2">More under {formatLabel(selectedPrimaryTopic)}:</div>
                <div className="flex flex-wrap gap-2">
                  {relatedTopics.map((topic) => (
                    <button
                      type="button"
                      key={topic}
                      onClick={() => { setSelectedSubtopic(topic); updateFilter("primaryTopics", [topic]) }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        (selectedSubtopic && normalizePrimarySubtopic(selectedSubtopic) === normalizePrimarySubtopic(topic))
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {formatLabel(topic)}
                    </button>
                  ))}
                </div>
              </div>
            )} */}
            <div className="flex items-center gap-2">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="text-sm text-foreground bg-input border border-border rounded px-2 py-1 cursor-pointer hover:border-primary transition-colors"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="relevant">Most Relevant</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Articles */}
      <div className="p-3 fold:p-4 ipad:p-6 trifold:p-8 max-w-5xl mx-auto">
        {loading ? (
          <ArticleListSkeleton count={7} />
        ) : paginatedArticles.length > 0 ? (
          <div className="space-y-6">
            {selectedPrimaryTopic !== "All" ? (
              <>
                <h2 className="text-xl font-semibold text-foreground">AI Generated Summary Article</h2>
                {latestSummaryArticle ? (
                  <div className="space-y-5">
                    <NewsArticle key={latestSummaryArticle.id} article={latestSummaryArticle} />
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No summary available for this topic.</div>
                )}
                {/* Reference Articles */}
                {latestSummaryArticle && latestSummaryArticle.originalSources && latestSummaryArticle.originalSources.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground">Reference Articles</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {latestSummaryArticle.originalSources
                        .filter((s) => !!s.url)
                        .map((s, idx) => (
                          <ReferenceArticleCard
                            key={`${s.url}-${idx}`}
                            refArticle={{ name: s.name, url: s.url, domain: s.domain, title: s.title }}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Older Summaries Progressive Reveal */}
                {olderArticles.length > 0 && !showAllOlder && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground">Older Summaries</h3>
                    {olderShown > 0 && (
                      <div className="space-y-5">
                        {olderArticles.slice(0, olderShown).map((article) => (
                          <NewsArticle key={article.id} article={article} />
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      {olderShown < olderArticles.length && (
                        <Button variant="outline" size="sm" onClick={() => setOlderShown((n) => Math.min(n + 2, olderArticles.length))}>
                          View older
                        </Button>
                      )}
                      {olderShown >= 4 && olderShown < olderArticles.length && (
                        <Button variant="ghost" size="sm" onClick={() => { setShowAllOlder(true); setOlderPage(1) }}>
                          Show all
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Older Summaries - Full List with Pagination */}
                {olderArticles.length > 0 && showAllOlder && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground">Older Summaries</h3>
                    {(() => {
                      const pageSize = 7
                      const totalPages = Math.max(1, Math.ceil(olderArticles.length / pageSize))
                      const safePage = Math.min(olderPage, totalPages)
                      const start = (safePage - 1) * pageSize
                      const end = start + pageSize
                      const pageItems = olderArticles.slice(start, end)
                      return (
                        <>
                          <div className="space-y-5">
                            {pageItems.map((article) => (
                              <NewsArticle key={article.id} article={article} />
                            ))}
                          </div>
                          <div className="text-center py-2 text-muted-foreground text-xs">
                            Page {safePage} of {totalPages} — {olderArticles.length} older article{olderArticles.length !== 1 ? "s" : ""}
                          </div>
                          <Pagination className="mt-2">
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (safePage > 1) setOlderPage(safePage - 1) }} />
                              </PaginationItem>
                              {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .slice(Math.max(0, safePage - 3), Math.max(0, safePage - 3) + 5)
                                .map((p) => (
                                  <PaginationItem key={p}>
                                    <PaginationLink href="#" isActive={p === safePage} onClick={(e) => { e.preventDefault(); setOlderPage(p) }}>
                                      {p}
                                    </PaginationLink>
                                  </PaginationItem>
                                ))}
                              <PaginationItem>
                                <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (safePage < totalPages) setOlderPage(safePage + 1) }} />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        </>
                      )
                    })()}
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-foreground">AI Generated Summary Articles</h2>
                <div className="space-y-5">
                  {paginatedArticles.map((article) => (
                    <NewsArticle key={article.id} article={article} />
                  ))}
                </div>
              </>
            )}
            {selectedPrimaryTopic === "All" && (
              <>
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Page {page} of {totalPages} — {filteredArticles.length} article{filteredArticles.length !== 1 ? "s" : ""} total
                </div>
                <Pagination className="mt-2">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1) }} />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5).map((p) => (
                      <PaginationItem key={p}>
                        <PaginationLink href="#" isActive={p === page} onClick={(e) => { e.preventDefault(); setPage(p) }}>
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage(page + 1) }} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No articles match your filters
          </div>
        )}
      </div>
    </main>
  )
}
