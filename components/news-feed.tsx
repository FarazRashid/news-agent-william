"use client"

import { useMemo, useState } from "react"
import { ChevronDown, ArrowUpDown } from "lucide-react"
import { useNews } from "@/lib/news-context"
import NewsArticle from "./news-article"
import NewsFeedSkeleton from "./news-feed-skeleton"
import { ArticleListSkeleton } from "./article-card-skeleton"
import { ActiveFiltersChips } from "./active-filters-chips"
import { MobileFilterSheet } from "./mobile-filter-sheet"
import { SortDropdown } from "./sort-dropdown"
import { Button } from "./ui/button"
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
    paginatedArticles,
    page,
    totalPages,
    setPage,
  } = useNews()

  const [filtersOpen, setFiltersOpen] = useState(true)

  const selectedCategory = useMemo(() => {
    if (filters.categories.length === 1) return filters.categories[0]
    if (filters.categories.length === 0) return "All"
    return null
  }, [filters.categories])

  const groupedArticles = useMemo(() => {
    const groups: Record<string, typeof filteredArticles> = {}
    paginatedArticles.forEach((article) => {
      const dateStr = article.publishedAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      })
      if (!groups[dateStr]) {
        groups[dateStr] = []
      }
      groups[dateStr].push(article)
    })
    return groups
  }, [paginatedArticles])

  const handleCategoryClick = (category: string) => {
    if (category === "All") {
      updateFilter("categories", [])
    } else if (selectedCategory === category) {
      updateFilter("categories", [])
    } else {
      updateFilter("categories", [category])
    }
  }

  return (
    <main className="flex-1 border-r border-border bg-background min-h-[calc(100vh-73px)]">
      {/* Mobile Header with Filters */}
      <div className="lg:hidden sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">
            Latest News
            <span className="ml-2 text-sm text-muted-foreground font-normal">
              ({filteredArticles.length})
            </span>
          </h1>
          
          <div className="flex items-center gap-2">
            <MobileFilterSheet />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const nextSort = sortOrder === 'newest' ? 'oldest' : sortOrder === 'oldest' ? 'relevant' : 'newest'
                setSortOrder(nextSort)
              }}
            >
              <ArrowUpDown className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Active filters chips - scrollable on mobile */}
        <div className="px-4 pb-3">
          <ActiveFiltersChips />
        </div>
      </div>

      {/* Filters Header - Desktop */}
      <div className="hidden lg:block bg-card border-b border-border p-6 sticky top-[73px] z-40">
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
            <div className="flex flex-wrap gap-2 mb-4">
              {["All", ...availableCategories].map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    (category === "All" && selectedCategory === "All") ||
                    (category !== "All" && selectedCategory === category)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
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
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        {loading ? (
          <ArticleListSkeleton count={7} />
        ) : Object.keys(groupedArticles).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedArticles).map(([dateStr, articles]) => (
              <div key={dateStr}>
                <h2 className="text-xl font-semibold text-foreground mb-5">{dateStr}</h2>
                <div className="space-y-5">
                  {articles.map((article) => (
                    <NewsArticle key={article.id} article={article} />
                  ))}
                </div>
              </div>
            ))}
            <div className="text-center py-4 text-muted-foreground text-sm">
              Page {page} of {totalPages} — {filteredArticles.length} article{filteredArticles.length !== 1 ? "s" : ""} total
            </div>
            <Pagination className="mt-2">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1) }} />
                </PaginationItem>
                {/* show a compact set of page links */}
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
