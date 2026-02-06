"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { SlidersHorizontal, Search, Clock } from "lucide-react"
import { useNews } from "@/lib/news-context"
import { Badge } from "@/components/ui/badge"

const TIME_PRESETS = [
  { value: "hour", label: "Past Hour" },
  { value: "day", label: "Past 24 Hours" },
  { value: "week", label: "Past Week" },
  { value: "month", label: "Past Month" },
  { value: "3months", label: "Past 3 Months" },
  { value: "year", label: "Past Year" },
  { value: "all", label: "All Time" },
]

/**
 * Mobile-optimized filter sheet
 * Usage: Add this to your news-feed.tsx header for mobile screens
 */
export function MobileFilterSheet() {
  const [open, setOpen] = useState(false)
  const {
    filters,
    updateFilter,
    resetFilters,
    activeFilterCount,
    availableCategories,
    filterCounts,
    availableSources,
  } = useNews()
  const [searchInput, setSearchInput] = useState(filters.search)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden relative">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:w-96 overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Filters</SheetTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetFilters}
              className="border-destructive/50 mr-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              Clear All
            </Button>
          </div>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Search */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Search</h3>
            </div>
            <Input
              placeholder="Search articles..."
              className="text-sm"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                updateFilter("search", e.target.value)
              }}
            />
          </div>

          {/* Time Range */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Time Range</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TIME_PRESETS.map((preset) => (
                <div key={preset.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`mobile-time-${preset.value}`}
                    checked={filters.timeRange.preset === preset.value}
                    onCheckedChange={() =>
                      updateFilter("timeRange", {
                        ...filters.timeRange,
                        preset: preset.value as any,
                      })
                    }
                  />
                  <label
                    htmlFor={`mobile-time-${preset.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {preset.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Categories</h3>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {availableCategories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`mobile-cat-${category}`}
                    checked={filters.categories.includes(category)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFilter("categories", [...filters.categories, category])
                      } else {
                        updateFilter("categories", filters.categories.filter((c) => c !== category))
                      }
                    }}
                  />
                  <label
                    htmlFor={`mobile-cat-${category}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 truncate"
                  >
                    {category}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({filterCounts.categories[category] || 0})
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Sources (by domain, consistent with desktop filters; always show full list) */}
          {availableSources.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Sources</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableSources.map((domain) => {
                  const count = filterCounts.domains[domain] || 0
                  return (
                    <div key={domain} className="flex items-center space-x-2">
                      <Checkbox
                        id={`mobile-source-${domain}`}
                        checked={filters.sources.includes(domain)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFilter("sources", [...filters.sources, domain])
                          } else {
                            updateFilter("sources", filters.sources.filter((s) => s !== domain))
                          }
                        }}
                      />
                      <label
                        htmlFor={`mobile-source-${domain}`}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 truncate"
                      >
                        {domain}
                        <span className="ml-2 text-xs text-muted-foreground">({count})</span>
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Locations */}
          {Object.keys(filterCounts.locations).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Locations</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {Object.entries(filterCounts.locations)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 15)
                  .map(([location, count]) => (
                    <div key={location} className="flex items-center space-x-2">
                      <Checkbox
                        id={`mobile-loc-${location}`}
                        checked={filters.locations.includes(location)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFilter("locations", [...filters.locations, location])
                          } else {
                            updateFilter("locations", filters.locations.filter((l) => l !== location))
                          }
                        }}
                      />
                      <label
                        htmlFor={`mobile-loc-${location}`}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {location}
                        <span className="ml-2 text-xs text-muted-foreground">({count})</span>
                      </label>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
