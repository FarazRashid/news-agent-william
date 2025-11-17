export type Article = {
  id: string
  title: string
  description: string
  // Optional extended fields from DB for richer rendering
  subheadline?: string | null
  lead?: string | null
  conclusion?: string | null
  image: string
  imageSuggestions?: string[]
  source: {
    name: string
    domain: string
    logo: string
  }
  publishedAt: Date
  // Category comes from the database and can be any string; avoid constraining to a fixed union
  category: string
  primaryTopic?: string | null
  topics: string[]
  entities: {
    people: string[]
    companies: string[]
    stockSymbols: string[]
  }
  location: string
  content: string
  // SEO and metadata fields
  wordCount?: number
  readTimeMinutes?: number
  sentiment?: string | null
  urgency?: string | null
  audienceLevel?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  focusKeyword?: string | null
  relatedKeywords?: string[] | null
  readabilityScore?: string | null
}

export type FilterState = {
  search: string
  timeRange: {
    start: Date | null
    end: Date | null
    preset: "all" | "hour" | "day" | "week" | "month" | "3months" | "year"
  }
  categories: string[]
  primaryTopics: string[]
  entities: {
    people: string[]
    companies: string[]
  }
  domains: string[]
  stockSymbols: string[]
  locations: string[]
  sources: string[]
}

export type FilterCounts = {
  categories: Record<string, number>
  primaryTopics: Record<string, number>
  people: Record<string, number>
  companies: Record<string, number>
  locations: Record<string, number>
  sources: Record<string, number>
  domains: Record<string, number>
  stockSymbols: Record<string, number>
}
