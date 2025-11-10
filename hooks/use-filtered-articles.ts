import { useMemo } from "react"
import type { Article, FilterState } from "@/lib/types"

/**
 * Optimized filtering with memoization
 * Replace the filtering logic in news-context.tsx with this approach
 * 
 * Benefits:
 * - Only recalculates when articles or filters change
 * - Prevents unnecessary re-renders
 * - Better performance for large datasets
 */

export function useFilteredArticles(
  articles: Article[],
  filters: FilterState
): Article[] {
  return useMemo(() => {
    let result = [...articles]

    // 1. Text search - case insensitive, searches title + description
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        (article) =>
          article.title.toLowerCase().includes(searchLower) ||
          article.description.toLowerCase().includes(searchLower) ||
          article.content?.toLowerCase().includes(searchLower)
      )
    }

    // 2. Category filter
    if (filters.categories.length > 0) {
      result = result.filter((article) =>
        filters.categories.includes(article.category)
      )
    }

    // 3. Source filter
    if (filters.sources.length > 0) {
      result = result.filter((article) =>
        filters.sources.includes(article.source.name)
      )
    }

    // 4. Location filter
    if (filters.locations.length > 0) {
      result = result.filter((article) =>
        filters.locations.includes(article.location)
      )
    }

    // 5. People filter
    if (filters.entities.people.length > 0) {
      result = result.filter((article) =>
        filters.entities.people.some((person) =>
          article.entities.people.includes(person)
        )
      )
    }

    // 6. Companies filter
    if (filters.entities.companies.length > 0) {
      result = result.filter((article) =>
        filters.entities.companies.some((company) =>
          article.entities.companies.includes(company)
        )
      )
    }

    // 7. Time range filter
    if (filters.timeRange.preset !== "all") {
      const now = new Date()
      const cutoff = new Date(now)

      switch (filters.timeRange.preset) {
        case "hour":
          cutoff.setHours(now.getHours() - 1)
          break
        case "day":
          cutoff.setDate(now.getDate() - 1)
          break
        case "week":
          cutoff.setDate(now.getDate() - 7)
          break
        case "month":
          cutoff.setMonth(now.getMonth() - 1)
          break
        case "3months":
          cutoff.setMonth(now.getMonth() - 3)
          break
        case "year":
          cutoff.setFullYear(now.getFullYear() - 1)
          break
      }

      result = result.filter((article) => article.publishedAt >= cutoff)
    }

    // Custom date range if set
    if (filters.timeRange.start) {
      result = result.filter((article) => article.publishedAt >= filters.timeRange.start!)
    }
    if (filters.timeRange.end) {
      result = result.filter((article) => article.publishedAt <= filters.timeRange.end!)
    }

    return result
  }, [articles, filters])
}

/**
 * Compute filter counts efficiently
 */
export function useFilterCounts(articles: Article[]) {
  return useMemo(() => {
    const counts = {
      categories: {} as Record<string, number>,
      people: {} as Record<string, number>,
      companies: {} as Record<string, number>,
      locations: {} as Record<string, number>,
      sources: {} as Record<string, number>,
      domains: {} as Record<string, number>,
      stockSymbols: {} as Record<string, number>,
    }

    articles.forEach((article) => {
      // Count categories
      counts.categories[article.category] = (counts.categories[article.category] || 0) + 1

      // Count locations
      counts.locations[article.location] = (counts.locations[article.location] || 0) + 1

      // Count sources
      counts.sources[article.source.name] = (counts.sources[article.source.name] || 0) + 1
      if (article.source.domain) {
        counts.domains[article.source.domain] = (counts.domains[article.source.domain] || 0) + 1
      }

      // Count entities
      article.entities.people.forEach((person) => {
        counts.people[person] = (counts.people[person] || 0) + 1
      })
      article.entities.companies.forEach((company) => {
        counts.companies[company] = (counts.companies[company] || 0) + 1
      })
      article.entities.stockSymbols.forEach((symbol) => {
        counts.stockSymbols[symbol] = (counts.stockSymbols[symbol] || 0) + 1
      })
    })

    return counts
  }, [articles])
}

/**
 * Usage in news-context.tsx:
 * 
 * export function NewsProvider({ children }: { children: React.ReactNode }) {
 *   const [allArticles, setAllArticles] = useState<Article[]>([])
 *   const [filters, setFilters] = useState<FilterState>(initialFilters)
 *   
 *   // Replace your current filtering with:
 *   const filteredArticles = useFilteredArticles(allArticles, filters)
 *   const filterCounts = useFilterCounts(filteredArticles)
 *   
 *   // ... rest of code
 * }
 */
