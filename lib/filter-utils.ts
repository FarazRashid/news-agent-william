import type { Article, FilterState } from "./types"

// Canonical category tokens we expose as individual filters
const CANONICAL_CATEGORY_TOKENS = [
  "Finance",
  "Markets",
  "Economics",
  "Policy",
  "Technology",
  "Business",
  "Science",
  "Health",
  "Politics",
]

function normalizeToken(s: string): string {
  const t = s.trim().replace(/[_-]+/g, " ")
  // Title-case the token
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
}

function canonicalizeToken(s: string): string | null {
  const n = normalizeToken(s)
  // Simple synonyms
  const alias: Record<string, string> = {
    Tech: "Technology",
  }
  const cand = alias[n] ?? n
  return CANONICAL_CATEGORY_TOKENS.includes(cand) ? cand : null
}

function splitComposite(value: string): string[] {
  // Split on common separators: '/', ',', '&', ' and '
  return value
    .split(/\s*[/,&]|\band\b/gi)
    .map((x) => x.trim())
    .filter(Boolean)
}

// Exported helper used by context and counters
export function extractCategoryTokensFromArticle(article: Article): string[] {
  const tokens = new Set<string>()

  if (article.category) {
    splitComposite(article.category).forEach((raw) => {
      const tok = canonicalizeToken(raw)
      if (tok) tokens.add(tok)
    })
  }

  // Also scan topics for canonical tokens
  article.topics?.forEach((topic) => {
    const tok = canonicalizeToken(topic)
    if (tok) tokens.add(tok)
  })

  return Array.from(tokens)
}

export function formatTimeRange(preset: FilterState["timeRange"]["preset"]): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now)
  let start = new Date(now)

  switch (preset) {
    case "hour":
      start = new Date(now.getTime() - 1 * 60 * 60 * 1000)
      break
    case "day":
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case "week":
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case "month":
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case "3months":
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case "year":
      start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    case "all":
    default:
      start = new Date(0)
      break
  }

  return { start, end }
}

function articleMatchesSearch(article: Article, query: string): boolean {
  const lowerQuery = query.toLowerCase()
  return (
    article.title.toLowerCase().includes(lowerQuery) ||
    article.description.toLowerCase().includes(lowerQuery) ||
    article.content.toLowerCase().includes(lowerQuery) ||
    article.source.name.toLowerCase().includes(lowerQuery)
  )
}

function isWithinTimeRange(date: Date, timeRange: FilterState["timeRange"]): boolean {
  if (timeRange.preset === "all") return true
  const { start, end } = formatTimeRange(timeRange.preset)
  return date >= start && date <= end
}

export function filterArticles(articles: Article[], filters: FilterState): Article[] {
  return articles.filter((article) => {
    // Search filter
    if (filters.search && !articleMatchesSearch(article, filters.search)) {
      return false
    }

    // Time filter
    if (!isWithinTimeRange(article.publishedAt, filters.timeRange)) {
      return false
    }

    // Category filter (OR logic) — match against canonical tokens derived from the row
    if (filters.categories.length > 0) {
      const tokens = extractCategoryTokensFromArticle(article)
      const matches = filters.categories.some((c) => tokens.includes(c) || article.category === c)
      if (!matches) return false
    }

    // People filter (OR logic)
    if (
      filters.entities.people.length > 0 &&
      !filters.entities.people.some((person) => article.entities.people.includes(person))
    ) {
      return false
    }

    // Companies filter (OR logic)
    if (
      filters.entities.companies.length > 0 &&
      !filters.entities.companies.some((company) => article.entities.companies.includes(company))
    ) {
      return false
    }

    // Domain filter
    if (filters.domains.length > 0 && !filters.domains.includes(article.source.domain)) {
      return false
    }

    // Stock symbol filter
    if (
      filters.stockSymbols.length > 0 &&
      !filters.stockSymbols.some((symbol) => article.entities.stockSymbols.includes(symbol))
    ) {
      return false
    }

    // Location filter
    if (filters.locations.length > 0 && !filters.locations.includes(article.location)) {
      return false
    }

    // Source filter
    if (filters.sources.length > 0 && !filters.sources.includes(article.source.domain)) {
      return false
    }

    return true
  })
}

export function calculateFilterCounts(articles: Article[]) {
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
    // Categories — count per canonical token rather than composite string
    const tokens = extractCategoryTokensFromArticle(article)
    if (tokens.length === 0 && article.category) {
      // fallback to raw category if we couldn't tokenize
      counts.categories[article.category] = (counts.categories[article.category] || 0) + 1
    } else {
      tokens.forEach((t) => {
        counts.categories[t] = (counts.categories[t] || 0) + 1
      })
    }

    // People
    article.entities.people.forEach((person) => {
      counts.people[person] = (counts.people[person] || 0) + 1
    })

    // Companies
    article.entities.companies.forEach((company) => {
      counts.companies[company] = (counts.companies[company] || 0) + 1
    })

    // Locations
    counts.locations[article.location] = (counts.locations[article.location] || 0) + 1

    // Sources
    if (article.source.name && article.source.name.trim()) {
      counts.sources[article.source.name] = (counts.sources[article.source.name] || 0) + 1
    }
    if (article.source.domain && article.source.domain.trim()) {
      counts.domains[article.source.domain] = (counts.domains[article.source.domain] || 0) + 1
    }

    // Stock symbols
    article.entities.stockSymbols.forEach((symbol) => {
      counts.stockSymbols[symbol] = (counts.stockSymbols[symbol] || 0) + 1
    })
  })

  return counts
}
