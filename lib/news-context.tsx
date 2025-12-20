"use client"

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import type { FilterState, Article, FilterCounts } from "./types"
import { filterArticles, calculateFilterCounts, extractCategoryTokensFromArticle, canonicalizePrimaryTopic, normalizePrimarySubtopic, tokenizePrimarySubtopic } from "./filter-utils"
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
  availablePrimaryTopics: string[]
  groupedPrimaryTopics: Array<{ main: string; subtopics: string[]; count: number }>
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
  primaryTopics: [],
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [sortOrder, setSortOrderState] = useState<SortOrder>("newest")
  const [articles, setArticles] = useState<Article[]>()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPageState] = useState<number>(1)
  const [pageSize, setPageSizeState] = useState<number>(7)

  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  // Load filters from localStorage on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem('news-filters')
    const savedSort = localStorage.getItem('news-sort-order')
    
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters)
        setFilters(prev => ({ ...prev, ...parsed }))
      } catch (e) {
        console.error('Failed to parse saved filters')
      }
    }
    
    if (savedSort && (savedSort === 'newest' || savedSort === 'oldest' || savedSort === 'relevant')) {
      setSortOrderState(savedSort as SortOrder)
    }
  }, [])

  // Load filters from URL parameters - syncs whenever URL changes
  useEffect(() => {
    // Start with default filters to ensure clean state
    const urlFilters: FilterState = { ...defaultFilters }
    
    const search = searchParams.get("search")
    if (search) urlFilters.search = search

    const categories = searchParams.get("categories")
    if (categories) urlFilters.categories = categories.split(",").filter(Boolean)

    const primaryTopics = searchParams.get("primaryTopics")
    if (primaryTopics) urlFilters.primaryTopics = primaryTopics.split(",").filter(Boolean)

    const sources = searchParams.get("sources")
    if (sources) urlFilters.sources = sources.split(",").filter(Boolean)

    const locations = searchParams.get("locations")
    if (locations) urlFilters.locations = locations.split(",").filter(Boolean)

    const timeRange = searchParams.get("timeRange")
    if (timeRange && ["hour", "day", "week", "month", "3months", "year", "all"].includes(timeRange)) {
      urlFilters.timeRange = {
        start: null,
        end: null,
        preset: timeRange as any,
      }
    }

    const sort = searchParams.get("sort")
    if (sort && (sort === 'newest' || sort === 'oldest' || sort === 'relevant')) {
      setSortOrderState(sort as SortOrder)
    }

    // Replace filters entirely with URL state
    setFilters(urlFilters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('news-filters', JSON.stringify(filters))
  }, [filters])

  // Save sort order to localStorage
  useEffect(() => {
    localStorage.setItem('news-sort-order', sortOrder)
  }, [sortOrder])

  // Update URL when filters change (debounced via timeout)
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()

      if (filters.search) params.set("search", filters.search)
  if (filters.categories.length > 0) params.set("categories", filters.categories.join(","))
  if (filters.primaryTopics.length > 0) params.set("primaryTopics", filters.primaryTopics.join(","))
      if (filters.sources.length > 0) params.set("sources", filters.sources.join(","))
      if (filters.locations.length > 0) params.set("locations", filters.locations.join(","))
      if (filters.timeRange.preset !== "all") params.set("timeRange", filters.timeRange.preset)
      if (sortOrder !== "newest") params.set("sort", sortOrder)

      const query = params.toString()
      const newUrl = query ? `${pathname}?${query}` : pathname
      
      router.replace(newUrl, { scroll: false })
    }, 500)

    return () => clearTimeout(timer)
  }, [filters, sortOrder, router, pathname])

  const loadArticles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fetched = await fetchArticlesFromSupabase(supabase, { limit: 100 })
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

  const availablePrimaryTopics = useMemo(() => {
    const set = new Set<string>()
    articles?.forEach((a) => {
      if (a.primaryTopic) set.add(a.primaryTopic)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [articles])

  const groupedPrimaryTopics = useMemo(() => {
    const groups = new Map<string, { main: string; subtopics: Set<string>; count: number }>()
    articles?.forEach((a) => {
      if (!a.primaryTopic) return
      const main = canonicalizePrimaryTopic(a.primaryTopic)
      if (!main) return
      const entry = groups.get(main) || { main, subtopics: new Set<string>(), count: 0 }
      entry.subtopics.add(a.primaryTopic)
      entry.count += 1
      groups.set(main, entry)
    })
    // Dedupe similar subtopics by reducing to a canonical representative per simple stem
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .replace(/\b(cost[- ]?of[- ]?living|cola)\b/g, "coladj")
        .replace(/\badjustment(s)?\b/g, "adj")
        .replace(/\badjustments?\b/g, "adj")
        .replace(/\bplanning\b/g, "plan")
        .replace(/\bretirement\b/g, "retire")
        .replace(/\bbenefit(s)?\b/g, "benefit")
        .replace(/\bchanges?\b/g, "change")
        .replace(/\bstrateg(y|ies)\b/g, "strategy")
        .replace(/\s+/g, " ")
        .trim()

    const result = Array.from(groups.values()).map(({ main, subtopics, count }) => {
      // Build candidates with token sets ignoring common group tokens
      const candidates = Array.from(subtopics).map((label) => {
        const tokens = tokenizePrimarySubtopic(label)
        return { label, key: tokens.join(" "), tokens }
      })
      // First pass: dedupe by identical token keys
      const firstPassMap = new Map<string, { label: string; tokens: string[] }>()
      for (const c of candidates) {
        if (c.key && !firstPassMap.has(c.key)) {
          firstPassMap.set(c.key, { label: c.label, tokens: c.tokens })
        }
      }
      const firstPass = Array.from(firstPassMap.values())
      // Second pass: subset collapse. Keep shorter (more general) token sets; drop supersets.
      firstPass.sort((a, b) => a.tokens.length - b.tokens.length || a.label.localeCompare(b.label))
      const kept: { label: string; tokens: string[] }[] = []
      const keptSets: string[][] = []
      const isSubset = (small: string[], big: string[]) => {
        const setB = new Set(big)
        return small.every((t) => setB.has(t))
      }
      for (const c of firstPass) {
        let skip = false
        for (const s of keptSets) {
          if (isSubset(s, c.tokens) || isSubset(c.tokens, s)) {
            // If either is subset of the other, prefer the smaller one already kept
            if (s.length <= c.tokens.length) {
              skip = s.length <= c.tokens.length
            }
          }
        }
        if (!skip) {
          kept.push(c)
          keptSets.push(c.tokens)
        }
      }
      const deduped = kept.map((k) => k.label).sort((a, b) => a.localeCompare(b))
      return { main, subtopics: deduped, count }
    })

    return result
      .sort((a, b) => b.count - a.count || a.main.localeCompare(b.main))
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
    if (filters.primaryTopics.length > 0) count++
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
        availablePrimaryTopics,
  availableSources,
  groupedPrimaryTopics,
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
