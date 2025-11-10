import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { FilterState } from "@/lib/types"

/**
 * Hook to sync filter state with URL parameters
 * Benefits:
 * - Shareable URLs with filters applied
 * - Browser back/forward works with filters
 * - Page refresh preserves filters
 * 
 * Integration into news-context.tsx:
 * 
 * Add this hook to NewsProvider component
 */
export function useFilterURLSync(
  filters: FilterState,
  updateFilters: (filters: Partial<FilterState>) => void
) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Load filters from URL on mount
  useEffect(() => {
    const urlFilters: Partial<FilterState> = {}
    
    const search = searchParams.get("search")
    if (search) urlFilters.search = search

    const categories = searchParams.get("categories")
    if (categories) urlFilters.categories = categories.split(",")

    const sources = searchParams.get("sources")
    if (sources) urlFilters.sources = sources.split(",")

    const timeRange = searchParams.get("timeRange")
    if (timeRange && isValidTimePreset(timeRange)) {
      urlFilters.timeRange = {
        ...filters.timeRange,
        preset: timeRange as any,
      }
    }

    if (Object.keys(urlFilters).length > 0) {
      updateFilters(urlFilters)
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update URL when filters change (debounced to avoid too many history entries)
  useEffect(() => {
    const params = new URLSearchParams()

    if (filters.search) params.set("search", filters.search)
    if (filters.categories.length > 0) params.set("categories", filters.categories.join(","))
    if (filters.sources.length > 0) params.set("sources", filters.sources.join(","))
    if (filters.timeRange.preset !== "all") params.set("timeRange", filters.timeRange.preset)

    const query = params.toString()
    const newUrl = query ? `/?${query}` : "/"
    
    // Use replace to avoid cluttering history
    router.replace(newUrl, { scroll: false })
  }, [filters, router])
}

function isValidTimePreset(value: string): boolean {
  return ["all", "hour", "day", "week", "month", "3months", "year"].includes(value)
}

/**
 * Add this to your news-context.tsx NewsProvider:
 * 
 * export function NewsProvider({ children }: { children: React.ReactNode }) {
 *   const [filters, setFilters] = useState<FilterState>(initialFilters)
 *   
 *   // Add this hook
 *   useFilterURLSync(filters, (newFilters) => {
 *     setFilters(prev => ({ ...prev, ...newFilters }))
 *   })
 *   
 *   // ... rest of your code
 * }
 */
