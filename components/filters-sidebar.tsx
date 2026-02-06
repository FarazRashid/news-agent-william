"use client"

import { useState, useMemo, useEffect } from "react"
import { ChevronDown, Search, Clock, Zap, MapPin, LinkIcon, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useNews } from "@/lib/news-context"
import { Textarea } from "@/components/ui/textarea"
import { useDebounce } from "@/hooks/use-debounce"

const TIME_PRESETS = [
  { value: "hour", label: "Past Hour" },
  { value: "day", label: "Past 24 Hours" },
  { value: "week", label: "Past Week" },
  { value: "month", label: "Past Month" },
  { value: "3months", label: "Past 3 Months" },
  { value: "year", label: "Past Year" },
  { value: "all", label: "All Time" },
]

// Categories are derived dynamically from loaded articles via context

type SectionKey = "search" | "time" | "topics" | "entities" | "locations" | "sources"

export default function FiltersSidebar() {
  const {
    filters,
    updateFilter,
    resetFilters,
    filterCounts,
    availableCategories,
    availablePrimaryTopics,
    groupedPrimaryTopics,
    availableSources,
  } = useNews()
  
  // Debounced search input
  const [searchInput, setSearchInput] = useState(filters.search)
  const debouncedSearch = useDebounce(searchInput, 300)
  
  // Update filter when debounced value changes
  useEffect(() => {
    updateFilter("search", debouncedSearch)
  }, [debouncedSearch, updateFilter])
  
  // Sync local search input with external filter changes
  useEffect(() => {
    setSearchInput(filters.search)
  }, [filters.search])
  
  // Hydration guard: render dynamic counts only after mount
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  const [collapsed, setCollapsed] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    search: true,
    time: false,
    topics: false,
    entities: false,
    locations: false,
    sources: false,
  })

  const [showAllPrimaryTopics, setShowAllPrimaryTopics] = useState(false)

  const formatLabel = (s: string) =>
    s
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ")

  const sortedPrimaryTopics = useMemo(() => groupedPrimaryTopics.map((g) => g.main), [groupedPrimaryTopics])

  const PRIMARY_TOPIC_LIMIT = 12
  const displayedPrimaryTopics = useMemo(
    () => (showAllPrimaryTopics ? sortedPrimaryTopics : sortedPrimaryTopics.slice(0, PRIMARY_TOPIC_LIMIT)),
    [showAllPrimaryTopics, sortedPrimaryTopics]
  )

  const toggleSection = (section: SectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const allPeople = useMemo(() => Object.keys(filterCounts.people).sort((a, b) => a.localeCompare(b)), [filterCounts])
  const allCompanies = useMemo(
    () => Object.keys(filterCounts.companies).sort((a, b) => a.localeCompare(b)),
    [filterCounts],
  )
  const allLocations = useMemo(
    () => Object.keys(filterCounts.locations).sort((a, b) => a.localeCompare(b)),
    [filterCounts],
  )
  if (collapsed) {
    return (
      <aside className="hidden md:flex flex-col w-10 border-r border-border bg-card items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCollapsed(false)}
          aria-label="Show filters sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </aside>
    )
  }

  return (
    <aside className="hidden md:flex flex-col w-64 md:w-72 lg:w-80 border-r border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 md:px-4 py-3 md:py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCollapsed(true)}
            aria-label="Hide filters sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="font-semibold text-foreground text-sm md:text-base">Filters</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7 md:h-8 px-2 md:px-3 shrink-0 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={resetFilters}
        >
          Clear All
        </Button>
      </div>

      {/* Scrollable Filter Area */}
      {/* Scrollable Filter Area */}
      <div className="flex-1 overflow-y-auto px-2 md:px-3 lg:px-4 py-2">
        {/* Search */}
        <div className="mb-2 md:mb-3">
          <button 
            onClick={() => toggleSection("search")} 
            className="flex items-center justify-between w-full py-2 md:py-3 px-1.5 md:px-2 hover:bg-muted/50 rounded-md transition-colors touch-manipulation"
          >
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs md:text-sm font-medium truncate">Search</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
              {hydrated && filters.search && (
                <div className="bg-primary text-primary-foreground text-xs px-1.5 md:px-2 py-0.5 rounded-full font-medium">1</div>
              )}
              <ChevronDown className={`w-3.5 md:w-4 h-3.5 md:h-4 text-muted-foreground transition-transform ${expandedSections.search ? "rotate-180" : ""}`} />
            </div>
          </button>
          {expandedSections.search && (
            <div className="px-1.5 md:px-2 pb-2 md:pb-3 pt-1.5 md:pt-2">
              <Input
                placeholder="Search articles..."
                className="text-xs md:text-sm h-8 md:h-9"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && searchInput !== debouncedSearch && (
                <p className="text-xs text-muted-foreground mt-1 px-1">Searching...</p>
              )}
            </div>
          )}
        </div>

        {/* Time */}
        <div className="mb-2 md:mb-3">
          <button 
            onClick={() => toggleSection("time")} 
            className="flex items-center justify-between w-full py-2 md:py-3 px-1.5 md:px-2 hover:bg-muted/50 rounded-md transition-colors touch-manipulation"
          >
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs md:text-sm font-medium truncate">Time Range</span>
            </div>
            <ChevronDown className={`w-3.5 md:w-4 h-3.5 md:h-4 text-muted-foreground transition-transform shrink-0 ${expandedSections.time ? "rotate-180" : ""}`} />
          </button>
          {expandedSections.time && (
            <div className="px-1.5 md:px-2 pb-2 md:pb-3 pt-1.5 md:pt-2">
              <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                {TIME_PRESETS.map((preset) => (
                  <label key={preset.value} className="flex items-center gap-1.5 cursor-pointer text-xs md:text-sm hover:bg-muted/30 p-1.5 md:p-2 rounded touch-manipulation">
                    <input
                      type="radio"
                      name="time"
                      value={preset.value}
                      checked={filters.timeRange.preset === preset.value}
                      onChange={(e) =>
                        updateFilter("timeRange", {
                          ...filters.timeRange,
                          preset: e.target.value as any,
                        })
                      }
                      className="w-3.5 md:w-4 h-3.5 md:h-4 accent-primary shrink-0"
                    />
                    <span className="text-foreground truncate">{preset.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Topics & Types */}
        <div className="mb-2 md:mb-3">
          <button 
            onClick={() => toggleSection("topics")} 
            className="flex items-center justify-between w-full py-2 md:py-3 px-1.5 md:px-2 hover:bg-muted/50 rounded-md transition-colors touch-manipulation"
          >
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <Zap className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs md:text-sm font-medium truncate">Topics & Types</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
              {filters.categories.length > 0 && (
                <div className="bg-primary text-primary-foreground text-xs px-1.5 md:px-2 py-0.5 rounded-full font-medium">
                  {filters.categories.length}
                </div>
              )}
              <ChevronDown className={`w-3.5 md:w-4 h-3.5 md:h-4 text-muted-foreground transition-transform ${expandedSections.topics ? "rotate-180" : ""}`} />
            </div>
          </button>
          {expandedSections.topics && (
            <div className="px-1.5 md:px-2 pb-2 md:pb-3 pt-1.5 md:pt-2">
              {/* Primary topics from DB */}
              <div className="space-y-1 mb-2">
                <h4 className="font-medium text-foreground mb-1 text-xs text-muted-foreground uppercase">Primary topics</h4>
                <div className="space-y-0.5 max-h-40 md:max-h-48 overflow-y-auto">
                  {displayedPrimaryTopics.map((topic: string) => (
                    <label key={topic} className="flex items-center gap-2 cursor-pointer text-xs md:text-sm hover:bg-muted/30 p-1.5 md:p-2 rounded touch-manipulation min-w-0">
                      <Checkbox
                        checked={filters.primaryTopics.includes(topic)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFilter("primaryTopics", [...filters.primaryTopics, topic])
                          } else {
                            updateFilter(
                              "primaryTopics",
                              filters.primaryTopics.filter((t) => t !== topic),
                            )
                          }
                        }}
                        className="shrink-0"
                      />
                      <span className="text-foreground flex-1 truncate">{formatLabel(topic)}</span>
                      <span className="text-xs text-muted-foreground shrink-0" suppressHydrationWarning>
                        {hydrated ? (filterCounts.primaryTopics?.[topic] || 0) : ""}
                      </span>
                    </label>
                  ))}
                </div>
                {sortedPrimaryTopics.length > PRIMARY_TOPIC_LIMIT && (
                  <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={() => setShowAllPrimaryTopics((v) => !v)}>
                      {showAllPrimaryTopics ? "Show less" : "Show more"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Existing category tokens (secondary) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0.5 md:gap-1">
                {availableCategories.map((category) => (
                  <label key={category} className="flex items-center gap-2 cursor-pointer text-xs md:text-sm hover:bg-muted/30 p-1.5 md:p-2 rounded touch-manipulation min-w-0">
                    <Checkbox
                      checked={filters.categories.includes(category)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateFilter("categories", [...filters.categories, category])
                        } else {
                          updateFilter(
                            "categories",
                            filters.categories.filter((c) => c !== category),
                          )
                        }
                      }}
                      className="shrink-0"
                    />
                    <span className="text-foreground flex-1 truncate">{category}</span>
                    <span
                      className="text-xs text-muted-foreground shrink-0"
                      suppressHydrationWarning
                    >
                      {hydrated ? (filterCounts.categories[category] || 0) : ""}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Entities */}
        <div className="mb-2 md:mb-3">
          <button
            onClick={() => toggleSection("entities")}
            className="flex items-center justify-between w-full py-2 md:py-3 px-1.5 md:px-2 hover:bg-muted/50 rounded-md transition-colors touch-manipulation"
          >
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <span className="text-muted-foreground shrink-0">#</span>
              <span className="text-xs md:text-sm font-medium truncate">Entities</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
              {hydrated && (filters.entities.people.length > 0 || filters.entities.companies.length > 0) && (
                <span className="bg-primary text-primary-foreground text-xs px-1.5 md:px-2 py-0.5 rounded-full font-medium">
                  {filters.entities.people.length + filters.entities.companies.length}
                </span>
              )}
              <ChevronDown className={`w-3.5 md:w-4 h-3.5 md:h-4 text-muted-foreground transition-transform ${expandedSections.entities ? "rotate-180" : ""}`} />
            </div>
          </button>
          {expandedSections.entities && (
            <div className="px-1.5 md:px-2 pb-2 md:pb-3 pt-1.5 md:pt-2 space-y-2 md:space-y-3">
              <div>
                <h4 className="font-medium text-foreground mb-1.5 md:mb-2 text-xs text-muted-foreground uppercase">People</h4>
                {!hydrated ? (
                  <p className="text-xs text-muted-foreground">Loading...</p>
                ) : allPeople.length > 0 ? (
                  <div className="space-y-0.5 md:space-y-1 max-h-40 md:max-h-48 overflow-y-auto">
                    {allPeople.map((person) => (
                      <label key={person} className="flex items-center gap-2 cursor-pointer text-xs hover:bg-muted/30 p-1.5 md:p-2 rounded touch-manipulation min-w-0">
                        <Checkbox
                          checked={filters.entities.people.includes(person)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateFilter("entities", {
                                ...filters.entities,
                                people: [...filters.entities.people, person],
                              })
                            } else {
                              updateFilter("entities", {
                                ...filters.entities,
                                people: filters.entities.people.filter((p) => p !== person),
                              })
                            }
                          }}
                          className="shrink-0"
                        />
                        <span className="flex-1 truncate">{person}</span>
                        <span
                          className="text-muted-foreground shrink-0"
                          suppressHydrationWarning
                        >
                          {hydrated ? (filterCounts.people[person] || 0) : ""}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No people found</p>
                )}
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1.5 md:mb-2 text-xs text-muted-foreground uppercase">Companies</h4>
                {!hydrated ? (
                  <p className="text-xs text-muted-foreground">Loading...</p>
                ) : allCompanies.length > 0 ? (
                  <div className="space-y-0.5 md:space-y-1 max-h-40 md:max-h-48 overflow-y-auto">
                    {allCompanies.map((company) => (
                      <label key={company} className="flex items-center gap-2 cursor-pointer text-xs hover:bg-muted/30 p-1.5 md:p-2 rounded touch-manipulation min-w-0">
                        <Checkbox
                          checked={filters.entities.companies.includes(company)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateFilter("entities", {
                                ...filters.entities,
                                companies: [...filters.entities.companies, company],
                              })
                            } else {
                              updateFilter("entities", {
                                ...filters.entities,
                                companies: filters.entities.companies.filter((c) => c !== company),
                              })
                            }
                          }}
                          className="shrink-0"
                        />
                        <span className="flex-1 truncate">{company}</span>
                        <span
                          className="text-muted-foreground shrink-0"
                          suppressHydrationWarning
                        >
                          {hydrated ? (filterCounts.companies[company] || 0) : ""}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No companies found</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Locations */}
        <div className="mb-2 md:mb-3">
          <button
            onClick={() => toggleSection("locations")}
            className="flex items-center justify-between w-full py-2 md:py-3 px-1.5 md:px-2 hover:bg-muted/50 rounded-md transition-colors touch-manipulation"
          >
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs md:text-sm font-medium truncate">Locations</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
              {hydrated && filters.locations.length > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-1.5 md:px-2 py-0.5 rounded-full font-medium">
                  {filters.locations.length}
                </span>
              )}
              <ChevronDown className={`w-3.5 md:w-4 h-3.5 md:h-4 text-muted-foreground transition-transform ${expandedSections.locations ? "rotate-180" : ""}`} />
            </div>
          </button>
          {expandedSections.locations && (
            <div className="px-1.5 md:px-2 pb-2 md:pb-3 pt-1.5 md:pt-2 space-y-0.5 md:space-y-1">
              {!hydrated ? (
                <p className="text-xs text-muted-foreground">Loading...</p>
              ) : (
                <div className="max-h-48 md:max-h-60 overflow-y-auto space-y-0.5 md:space-y-1">
                  {allLocations.map((location) => (
                    <label key={location} className="flex items-center gap-2 cursor-pointer text-xs md:text-sm hover:bg-muted/30 p-1.5 md:p-2 rounded touch-manipulation min-w-0">
                      <Checkbox
                        checked={filters.locations.includes(location)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFilter("locations", [...filters.locations, location])
                          } else {
                            updateFilter(
                              "locations",
                              filters.locations.filter((l) => l !== location),
                            )
                          }
                        }}
                        className="shrink-0"
                      />
                      <span className="text-foreground flex-1 truncate">{location}</span>
                      <span
                        className="text-xs text-muted-foreground shrink-0"
                        suppressHydrationWarning
                      >
                        {hydrated ? (filterCounts.locations[location] || 0) : ""}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sources */}
        <div className="mb-2 md:mb-3">
          <button
            onClick={() => toggleSection("sources")}
            className="flex items-center justify-between w-full py-2 md:py-3 px-1.5 md:px-2 hover:bg-muted/50 rounded-md transition-colors touch-manipulation"
          >
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs md:text-sm font-medium truncate">Sources</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
              {hydrated && filters.sources.length > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-1.5 md:px-2 py-0.5 rounded-full font-medium">
                  {filters.sources.length}
                </span>
              )}
              <ChevronDown className={`w-3.5 md:w-4 h-3.5 md:h-4 text-muted-foreground transition-transform ${expandedSections.sources ? "rotate-180" : ""}`} />
            </div>
          </button>
          {expandedSections.sources && (
            <div className="px-1.5 md:px-2 pb-2 md:pb-3 pt-1.5 md:pt-2 space-y-1.5 md:space-y-2">
              {/* Active sources as tags */}
              {hydrated && filters.sources.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2 md:mb-3">
                  {filters.sources.map((source) => (
                    <div
                      key={source}
                      className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs flex items-center gap-1 max-w-full"
                    >
                      <span className="truncate">{source}</span>
                      <X
                        className="w-3 h-3 cursor-pointer hover:opacity-70 shrink-0 touch-manipulation"
                        onClick={() =>
                          updateFilter(
                            "sources",
                            filters.sources.filter((s) => s !== source),
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
              {/* Source selector (always show full domain list from all articles) */}
              <div className="space-y-0.5 md:space-y-1 max-h-48 md:max-h-60 overflow-y-auto">
                {!hydrated ? (
                  <p className="text-xs text-muted-foreground">Loading...</p>
                ) : (
                  availableSources.map((domain) => (
                    <label key={domain} className="flex items-center gap-2 cursor-pointer text-xs hover:bg-muted/30 p-1.5 md:p-2 rounded touch-manipulation min-w-0">
                    <Checkbox
                      checked={filters.sources.includes(domain)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateFilter("sources", [...filters.sources, domain])
                        } else {
                          updateFilter(
                            "sources",
                            filters.sources.filter((s) => s !== domain),
                          )
                        }
                      }}
                      className="shrink-0"
                    />
                    <span className="truncate flex-1">{domain}</span>
                    <span
                      className="text-muted-foreground ml-auto shrink-0"
                      suppressHydrationWarning
                    >
                      {hydrated ? (filterCounts.domains[domain] || 0) : ""}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Chat Interface at Bottom */}
      
    </aside>
  )
}
