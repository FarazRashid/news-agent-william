"use client"

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from "react"
import type { FilterState, Article, FilterCounts } from "./types"
import { filterArticles, calculateFilterCounts, extractCategoryTokensFromArticle } from "./filter-utils"
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client"
import { fetchArticlesFromSupabase } from "./articles"

type SortOrder = "newest" | "oldest" | "relevant"

interface NewsContextType {
  articles: Article[]
  filters: FilterState
  sortOrder: SortOrder
  setFilters: (filters: FilterState) => void
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  resetFilters: () => void
  setSortOrder: (order: SortOrder) => void
  filteredArticles: Article[]
  filterCounts: FilterCounts
  activeFilterCount: number
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  availableCategories: string[]
  availableSources: string[]
  minPublishedAt: Date | null
  maxPublishedAt: Date | null
  page: number
  pageSize: number
  totalPages: number
  paginatedArticles: Article[]
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  nextPage: () => void
  prevPage: () => void
}

const defaultFilters: FilterState = {
  search: "",
  timeRange: {
    start: null,
    end: null,
    preset: "all",
  },
  categories: [],
  entities: {
    people: [],
    companies: [],
  },
  domains: [],
  stockSymbols: [],
  locations: [],
  sources: [],
}

const NewsContext = createContext<NewsContextType | undefined>(undefined)

export function NewsProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [sortOrder, setSortOrderState] = useState<SortOrder>("newest")
  const [articles, setArticles] = useState<Article[]>()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPageState] = useState<number>(1)
  const [pageSize, setPageSizeState] = useState<number>(7)

  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const loadArticles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fetched = await fetchArticlesFromSupabase(supabase, { limit: 200 })
      if (fetched.length > 0) {
        setArticles(fetched)
      } else {
        // fallback if table empty
        setArticles([])
      }
    } catch (e: any) {
      setError(e.message || "Failed to fetch articles")
      setArticles([])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    // initial load
    loadArticles()
  }, [loadArticles])

  const refetch = useCallback(async () => {
    await loadArticles()
  }, [loadArticles])

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
    // Reset page to 1 whenever any filter changes
    setPageState(1)
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
    setSortOrderState("newest")
    setPageState(1)
  }, [])

  const filteredArticles = useMemo(() => {
    let current = filterArticles(articles ?? [], filters)

    // Sort articles
    if (sortOrder === "newest") {
      current = current.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    } else if (sortOrder === "oldest") {
      current = current.sort((a, b) => a.publishedAt.getTime() - b.publishedAt.getTime())
    } else if (sortOrder === "relevant") {
      // For now, treat relevant as newest
      current = current.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    }

    return current
  }, [filters, sortOrder, articles])

  // Pagination derived from filteredArticles client-side
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredArticles.length / pageSize)), [filteredArticles, pageSize])

  const safePage = Math.min(page, totalPages)
  const paginatedArticles = useMemo(() => {
    const start = (safePage - 1) * pageSize
    const end = start + pageSize
    return filteredArticles.slice(start, end)
  }, [filteredArticles, safePage, pageSize])

  const setPage = useCallback((p: number) => {
    setPageState((prev) => {
      const next = Math.min(Math.max(1, p), totalPages)
      return next
    })
  }, [totalPages])

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size)
    setPageState(1) // reset to first page when size changes
  }, [])

  const nextPage = useCallback(() => setPage(page + 1), [page, setPage])
  const prevPage = useCallback(() => setPage(page - 1), [page, setPage])

  const setSortOrder = useCallback((order: SortOrder) => {
    setSortOrderState(order)
    setPageState(1)
  }, [])

  const filterCounts = useMemo(() => calculateFilterCounts(filteredArticles), [filteredArticles])

  // Dynamic lists derived from all loaded articles (not just filtered subset)
  const availableCategories = useMemo(() => {
    const set = new Set<string>()
    articles?.forEach((a) => {
      const tokens = extractCategoryTokensFromArticle(a)
      if (tokens.length === 0 && a.category) set.add(a.category)
      tokens.forEach((t) => set.add(t))
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [articles])

  const availableSources = useMemo(() => {
    const set = new Set<string>()
    articles?.forEach((a) => {
      if (a.source.domain) set.add(a.source.domain)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [articles])

  const minPublishedAt = useMemo(() => {
    if (articles?.length === 0) return null
    return articles?.reduce((min, a) => (a.publishedAt < min ? a.publishedAt : min), articles[0].publishedAt)
  }, [articles])

  const maxPublishedAt = useMemo(() => {
    if (articles?.length === 0) return null
    return articles?.reduce((max, a) => (a.publishedAt > max ? a.publishedAt : max), articles[0].publishedAt)
  }, [articles])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.timeRange.preset !== "all") count++
    if (filters.categories.length > 0) count++
    if (filters.entities.people.length > 0) count++
    if (filters.entities.companies.length > 0) count++
    if (filters.domains.length > 0) count++
    if (filters.stockSymbols.length > 0) count++
    if (filters.locations.length > 0) count++
    if (filters.sources.length > 0) count++
    return count
  }, [filters])

  return (
    <NewsContext.Provider
      value={{
        articles : articles || [],
        filters,
        sortOrder,
        setFilters,
        updateFilter,
        resetFilters,
        setSortOrder,
        filteredArticles,
        filterCounts,
        activeFilterCount,
        loading,
        error,
        refetch,
        availableCategories,
        availableSources,
        minPublishedAt : minPublishedAt || null,
        maxPublishedAt : maxPublishedAt || null,
        page: safePage,
        pageSize,
        totalPages,
        paginatedArticles,
        setPage,
        setPageSize,
        nextPage,
        prevPage,
      }}
    >
      {children}
    </NewsContext.Provider>
  )
}

export function useNews() {
  const context = useContext(NewsContext)
  if (!context) {
    throw new Error("useNews must be used within NewsProvider")
  }
  return context
}
