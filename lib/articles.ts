import type { Article } from "./types"

// Minimal subset of the Supabase row we need for UI
export type ArticleRow = {
  id: number
  headline: string
  subheadline: string | null
  lead_paragraph: string | null
  body: string
  conclusion: string | null
  category: string | null
  primary_topic?: string | null
  tags: string[] | null
  secondary_topics: string[] | null
  canonical_topics: string[] | null
  sources: unknown | null
  image_suggestions: string[] | null
  geographic_focus: string[] | null
  created_at: string | null
  published_at: string | null
  post_url?: string | null
  // SEO and metadata fields
  word_count?: number | null
  read_time_minutes?: number | null
  sentiment?: string | null
  urgency?: string | null
  audience_level?: string | null
  meta_title?: string | null
  meta_description?: string | null
  focus_keyword?: string | null
  related_keywords?: string[] | null
  readability_score?: string | null
}


function pickFirst<T>(arr: T[] | null | undefined): T | undefined {
  return Array.isArray(arr) && arr.length > 0 ? arr[0] : undefined
}

/**
 * Robust parser for the `sources` column coming from the DB.
 * The column may contain (observed / anticipated formats):
 *  1. NULL
 *  2. A plain string (either a publisher name or a URL)
 *  3. A JSON stringified object with shape:
 *     {
 *        total_sources: number,
 *        primary_sources: [{ url: string, name?: string, ... }],
 *        secondary_sources: [{ url: string, name?: string, ... }],
 *        source_diversity?: string
 *     }
 *  4. A JSON stringified array of source objects.
 *  5. A direct JS object (already parsed) matching #3.
 *  6. An array of objects or strings.
 * We currently return a SINGLE representative source (for UI consistency) choosing:
 *   - First primary source if available
 *   - Else first secondary source
 *   - Else first element if array
 *   - Else derive from URL or name fields
 * Enhancement hooks: if multi-source UI is needed later we could return an array.
 */
function parseSources(sources: unknown | null): { name: string; domain: string } | null {
  if (!sources) return null

  // Helper to build { name, domain } from a URL string
  const fromUrl = (urlStr: string, explicitName?: string | null): { name: string; domain: string } | null => {
    try {
      const u = new URL(urlStr.trim())
      const originalDomain = u.hostname
      const base = originalDomain.replace(/^www\./, "").split(".")[0]
      const derived = base ? base.charAt(0).toUpperCase() + base.slice(1) : "Unknown"
      const name = explicitName?.trim() || derived
      const domain = /^(example\.com|localhost)$/i.test(originalDomain) ? "" : originalDomain
      return { name, domain }
    } catch {
      return null
    }
  }

  // Attempt to JSON.parse if it's a string that looks like JSON
  const tryParseJson = (val: string): any => {
    const trimmed = val.trim()
    if (!trimmed) return val
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return JSON.parse(trimmed)
      } catch {
        return val // fall back to original string
      }
    }
    return val
  }

  let value: any = sources
  if (typeof value === "string") {
    value = tryParseJson(value)
  }

  // Case: still a plain string after parse attempt
  if (typeof value === "string") {
    // Treat as URL first, else treat as name
    const byUrl = fromUrl(value)
    if (byUrl) return byUrl
    const name = value.trim()
  if (name) return { name, domain: "" }
    return null
  }

  // If value is an array, choose its first meaningful element
  const pickFromArray = (arr: any[]): any | null => {
    for (const el of arr) {
      if (el) return el
    }
    return null
  }

  if (Array.isArray(value)) {
    const first = pickFromArray(value)
    if (!first) return null
    // If the first is a string treat as URL/name; if object parse below.
    if (typeof first === "string") {
      const byUrl = fromUrl(first)
      if (byUrl) return byUrl
  return { name: first.trim(), domain: "" }
    }
    value = first // continue to object logic
  }

  // Composite object with primary/secondary sources
  if (typeof value === "object" && value !== null) {
    const primaryList = Array.isArray(value.primary_sources) ? value.primary_sources : []
    const secondaryList = Array.isArray(value.secondary_sources) ? value.secondary_sources : []
    const genericList = Array.isArray(value.sources) ? value.sources : [] // some schemas use `sources` key

    const orderedCandidates = [
      ...primaryList,
      ...secondaryList,
      ...genericList,
    ]

    const candidate = pickFromArray(orderedCandidates) || value // fallback to object itself

    // If candidate is string
    if (typeof candidate === "string") {
      const byUrl = fromUrl(candidate)
      if (byUrl) return byUrl
  return { name: candidate.trim(), domain: "" }
    }

    // If candidate is object attempt URL fields
    if (candidate && typeof candidate === "object") {
      const urlField = candidate.url || candidate.link || candidate.href || candidate.website
      if (typeof urlField === "string") {
        const byUrl = fromUrl(urlField, candidate.name || candidate.source || candidate.publisher)
        if (byUrl) return byUrl
      }
      // Domain fallback from domain/hostname
      let domain: string | null = null
      const rawDomain = candidate.domain || candidate.hostname
      if (typeof rawDomain === "string" && rawDomain.trim()) {
        try {
          // If rawDomain accidentally includes protocol/path, extract hostname
          const maybeUrl = rawDomain.includes("/") ? new URL(rawDomain).hostname : rawDomain
          domain = maybeUrl.trim()
        } catch {
          domain = rawDomain.trim()
        }
      }
      if (domain && /^(example\.com|localhost)$/i.test(domain)) domain = ""
  domain = domain || ""

      // Name fallback precedence
      const rawName = candidate.name || candidate.source || candidate.publisher || null
      let name: string = typeof rawName === "string" && rawName.trim() ? rawName.trim() : domain.replace(/^www\./, "").split(".")[0]
      if (!name) name = "Unknown"
      // Capitalize first character of derived token if needed
      if (name && name === name.toLowerCase()) {
        name = name.charAt(0).toUpperCase() + name.slice(1)
      }

      return { name, domain }
    }
  }

  return null
}

// Collect all potential source entries (names/domains) instead of just representative one
function collectAllSources(sources: unknown | null): { name: string; domain: string; url?: string; title?: string }[] {
  if (!sources) return []
  const results: { name: string; domain: string; url?: string; title?: string }[] = []
  const pushUnique = (name: string, domain: string, url?: string, title?: string) => {
    const key = (url || domain || name).toLowerCase()
    if (!key) return
    if (!results.some(r => (r.url || r.domain || r.name).toLowerCase() === key)) {
      results.push({ name, domain, url, title })
    }
  }
  const deriveTitle = (urlStr: string): string | undefined => {
    try {
      const u = new URL(urlStr)
      let segment = u.pathname.split('/').filter(Boolean).pop() || ''
      if (!segment) return undefined
      segment = segment.replace(/\.(html?|php|aspx?)$/i, '')
      // Remove trailing date fragments if present (e.g., ...-2025-10-30)
      segment = segment.replace(/-?\d{4}-\d{2}-\d{2}$/,'')
      const words = segment.split(/[-_]+/).filter(w => w && w.length > 0)
      if (!words.length) return undefined
      const title = words.map(w => w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      return title
    } catch { return undefined }
  }
  const tryFromUrl = (urlStr: string, explicitName?: string | null) => {
    try {
      const u = new URL(urlStr.trim())
      const originalDomain = u.hostname
      const domain = /^(example\.com|localhost)$/i.test(originalDomain) ? "" : originalDomain
      const base = domain.replace(/^www\./, "").split(".")[0]
      const derived = base ? base.charAt(0).toUpperCase() + base.slice(1) : "Unknown"
      const name = explicitName?.trim() || derived
      const title = deriveTitle(urlStr)
      pushUnique(name, domain, urlStr, title)
    } catch {
      const name = urlStr.trim()
      if (name) pushUnique(name, "", urlStr, deriveTitle(urlStr))
    }
  }
  const normalizeObj = (obj: any) => {
    if (!obj || typeof obj !== "object") return
    const urlField = obj.url || obj.link || obj.href || obj.website
    if (typeof urlField === "string") {
      tryFromUrl(urlField, obj.name || obj.source || obj.publisher)
      return
    }
    let domain: string = ""
    const rawDomain = obj.domain || obj.hostname
    if (typeof rawDomain === "string" && rawDomain.trim()) {
      try {
        domain = rawDomain.includes("/") ? new URL(rawDomain).hostname : rawDomain.trim()
      } catch {
        domain = rawDomain.trim()
      }
    }
    if (domain && /^(example\.com|localhost)$/i.test(domain)) domain = ""
    const rawName = obj.name || obj.source || obj.publisher || domain.replace(/^www\./, '').split('.')[0]
    if (rawName) {
      const name = typeof rawName === 'string' ? rawName.trim() : String(rawName)
      if (name) pushUnique(name.charAt(0).toUpperCase() + name.slice(1), domain)
    }
  }
  const recurse = (val: any) => {
    if (!val) return
    if (typeof val === 'string') {
      // JSON attempt
      const trimmed = val.trim()
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try { val = JSON.parse(trimmed) } catch { /* keep as string */ }
      }
    }
    if (typeof val === 'string') {
      tryFromUrl(val)
      return
    }
    if (Array.isArray(val)) {
      for (const el of val) recurse(el)
      return
    }
    if (typeof val === 'object') {
      // Check composite lists
      const lists = [val.primary_sources, val.secondary_sources, val.sources]
      lists.forEach(list => { if (Array.isArray(list)) list.forEach(item => recurse(item)) })
      normalizeObj(val)
      return
    }
  }
  recurse(sources)
  return results
}

export function mapArticleRowToArticle(row: ArticleRow): Article {
  let source = parseSources(row.sources)
  const allSources = collectAllSources(row.sources)
  // Fallback: derive domain from post_url if available
  if (!source) {
  let domain = ""
    try {
      if (row.post_url) {
        const u = new URL(row.post_url)
        domain = u.hostname || domain
        if (domain && /^(example\.com|localhost)$/i.test(domain)) domain = ""
      }
    } catch {}
    // Derive a readable name from domain
    const name = domain.replace(/^www\./, "").split(".")[0]
    source = { name: name ? name.charAt(0).toUpperCase() + name.slice(1) : "Unknown", domain }
  }
  const publishedAtISO = row.published_at ?? row.created_at ?? new Date().toISOString()

  // Local sample images to use as suggestions when DB has none
  const defaultImageSuggestions = [
    "/finance.jpg",
    "/financial-news-trading.jpg",
    "/stock-market-trading-floor.png",
    "/nvidia-ai-chips.jpg",
    "/tesla-manufacturing-mexico.jpg",
    "/apple-privacy-features.jpg",
    "/healthcare-ai-medical-technology.jpg",
    "/bitcoin-trading-all-time-high.jpg",
    "/climate-summit-renewable-energy.jpg",
    "/china-technology-regulation.jpg",
  ]

  // Build a deterministic fallback image per-article so the list looks diverse
  const rotateFallback = (id: number): string => {
    const pool = defaultImageSuggestions
    if (!pool.length) return "/placeholder.jpg"
    const idx = Math.abs(id) % pool.length
    return pool[idx]
  }

  // Filter DB suggestions to only include valid image paths (starting with / or http)
  const validImagePath = (path: string): boolean => {
    if (!path || typeof path !== 'string') return false
    const trimmed = path.trim()
    return trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')
  }

  const validDbSuggestions = Array.isArray(row.image_suggestions) 
    ? row.image_suggestions.filter(validImagePath)
    : []
  
  const hasDbSuggestions = validDbSuggestions.length > 0
  const imageSuggestions = hasDbSuggestions ? validDbSuggestions : defaultImageSuggestions

  // Pick the first DB suggestion if present; otherwise pick a rotated fallback from our pool
  const image = hasDbSuggestions ? validDbSuggestions[0] : rotateFallback(row.id)

  // Heuristic logo: first character of source name or domain
  const logo = (source.name || source.domain || "?").trim().charAt(0).toUpperCase() || "?"

  const topics: string[] = [
    ...(row.secondary_topics ?? []),
    ...(row.canonical_topics ?? []),
    ...(row.tags ?? []),
  ]
  // Also push split tokens from primary_topic and category to aid filtering (e.g., "Finance/Markets/Policy")
  const composite = [row.primary_topic, row.category].filter(Boolean).join("/")
  if (composite) {
    composite
      .split(/\s*[/,&]|\band\b/gi)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((tok) => topics.push(tok))
  }

  return {
    id: String(row.id),
    title: row.headline,
    description: row.subheadline ?? row.lead_paragraph ?? "",
    subheadline: row.subheadline ?? null,
    lead: row.lead_paragraph ?? null,
    conclusion: row.conclusion ?? null,
    image,
    imageSuggestions,
    // Override display source name/logo with AI agent branding, retain original via originalSourceName
    source: {
      name: "William AI",
      domain: source.domain,
      logo: "W",
    },
    publishedAt: new Date(publishedAtISO),
    category: (row.category ?? "Uncategorized").trim(),
    primaryTopic: row.primary_topic ?? null,
    topics,
    entities: {
      people: [],
      companies: [],
      stockSymbols: [],
    },
    location: pickFirst(row.geographic_focus) ?? "Global",
    content: row.body ?? "",
    // SEO and metadata fields
    wordCount: row.word_count ?? undefined,
    readTimeMinutes: row.read_time_minutes ?? undefined,
    sentiment: row.sentiment ?? null,
    urgency: row.urgency ?? null,
    audienceLevel: row.audience_level ?? null,
    metaTitle: row.meta_title ?? null,
    metaDescription: row.meta_description ?? null,
    focusKeyword: row.focus_keyword ?? null,
    relatedKeywords: row.related_keywords ?? null,
    readabilityScore: row.readability_score ?? null,
    originalSources: allSources,
    originalSourceName: source.name,
  }
}

export type GetArticlesOptions = {
  limit?: number
}

export async function fetchArticlesFromSupabase(supabase: any, opts: GetArticlesOptions = {}): Promise<Article[]> {
  const limit = opts.limit ?? 200
  const { data, error } = await supabase
    .from("articles")
    .select(
      "id, headline, subheadline, lead_paragraph, body, conclusion, category, primary_topic, tags, secondary_topics, canonical_topics, sources, image_suggestions, geographic_focus, created_at, published_at, post_url, word_count, read_time_minutes, sentiment, urgency, audience_level, meta_title, meta_description, focus_keyword, related_keywords, readability_score"
    )
    .order("published_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  const rows = (data ?? []) as ArticleRow[]
  return rows.map(mapArticleRowToArticle)
}

export async function fetchArticleById(supabase: any, id: string | number): Promise<Article | null> {
  const { data, error } = await supabase
    .from("articles")
    .select(
      "id, headline, subheadline, lead_paragraph, body, conclusion, category, primary_topic, tags, secondary_topics, canonical_topics, sources, image_suggestions, geographic_focus, created_at, published_at, post_url, word_count, read_time_minutes, sentiment, urgency, audience_level, meta_title, meta_description, focus_keyword, related_keywords, readability_score"
    )
    .eq("id", id)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return mapArticleRowToArticle(data as ArticleRow)
}
