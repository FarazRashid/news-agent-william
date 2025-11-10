"use client"

import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { useNews } from "@/lib/news-context"

/**
 * Display active filters as removable chips
 * Shows users what filters are applied and allows quick removal
 * Scrollable on mobile for better UX
 */
export function ActiveFiltersChips() {
  const { filters, updateFilter, resetFilters } = useNews()

  const activeFilters: Array<{
    label: string
    onRemove: () => void
  }> = []

  // Search filter
  if (filters.search.trim()) {
    activeFilters.push({
      label: `Search: "${filters.search}"`,
      onRemove: () => updateFilter("search", ""),
    })
  }

  // Time range filter
  if (filters.timeRange.preset !== "all") {
    const labels = {
      hour: "Past Hour",
      day: "Past 24 Hours",
      week: "Past Week",
      month: "Past Month",
      "3months": "Past 3 Months",
      year: "Past Year",
    }
    activeFilters.push({
      label: labels[filters.timeRange.preset] || filters.timeRange.preset,
      onRemove: () =>
        updateFilter("timeRange", {
          ...filters.timeRange,
          preset: "all",
          start: null,
          end: null,
        }),
    })
  }

  // Categories
  filters.categories.forEach((category) => {
    activeFilters.push({
      label: `Category: ${category}`,
      onRemove: () =>
        updateFilter(
          "categories",
          filters.categories.filter((c) => c !== category)
        ),
    })
  })

  // Sources
  filters.sources.forEach((source) => {
    activeFilters.push({
      label: `Source: ${source}`,
      onRemove: () =>
        updateFilter(
          "sources",
          filters.sources.filter((s) => s !== source)
        ),
    })
  })

  // Locations
  filters.locations.forEach((location) => {
    activeFilters.push({
      label: `Location: ${location}`,
      onRemove: () =>
        updateFilter(
          "locations",
          filters.locations.filter((l) => l !== location)
        ),
    })
  })

  // People
  filters.entities.people.forEach((person) => {
    activeFilters.push({
      label: `Person: ${person}`,
      onRemove: () =>
        updateFilter("entities", {
          ...filters.entities,
          people: filters.entities.people.filter((p) => p !== person),
        }),
    })
  })

  // Companies
  filters.entities.companies.forEach((company) => {
    activeFilters.push({
      label: `Company: ${company}`,
      onRemove: () =>
        updateFilter("entities", {
          ...filters.entities,
          companies: filters.entities.companies.filter((c) => c !== company),
        }),
    })
  })

  if (activeFilters.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        Active filters:
      </span>
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        {activeFilters.map((filter, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="gap-1 pr-1 whitespace-nowrap"
          >
            <span className="text-xs">{filter.label}</span>
            <button
              onClick={filter.onRemove}
              className="hover:bg-muted rounded-full p-0.5 transition-colors"
              aria-label={`Remove ${filter.label} filter`}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        {activeFilters.length > 1 && (
          <button
            onClick={resetFilters}
            className="text-xs text-muted-foreground hover:text-foreground underline whitespace-nowrap ml-2"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Add this CSS to your globals.css for hiding scrollbar:
 * 
 * @layer utilities {
 *   .scrollbar-hide {
 *     -ms-overflow-style: none;
 *     scrollbar-width: none;
 *   }
 *   .scrollbar-hide::-webkit-scrollbar {
 *     display: none;
 *   }
 * }
 */
