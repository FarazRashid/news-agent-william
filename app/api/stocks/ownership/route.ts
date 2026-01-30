import { NextResponse } from "next/server"

export const revalidate = 86400

type CacheEntry = {
  payload: any
  fetchedAt: number
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const ownershipCache = new Map<string, CacheEntry>()

type EarningsfeedCompanySearchItem = {
  cik?: number
  name?: string
  ticker?: string | null
}

type EarningsfeedCompanySearchResponse = {
  items?: EarningsfeedCompanySearchItem[]
}

type EarningsfeedCompanyResponse = {
  cik?: number
  name?: string
}

type EarningsfeedHoldingItem = {
  issuerName?: string
  shares?: number
  sharesType?: string | null
  putCall?: string | null
  managerCik?: number | string | null
  managerName?: string | null
  reportPeriodDate?: string | null
  filedAt?: string | null
}

type EarningsfeedHoldingsResponse = {
  items?: EarningsfeedHoldingItem[]
  nextCursor?: string | null
  hasMore?: boolean
}


async function fetchJson<T>(url: string, apiKey: string, timeoutMs = 12000): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
      signal: controller.signal,
    })
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error(`Earningsfeed request timed out (${url})`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }

  const contentType = res.headers.get("content-type") || ""
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    const detail = body ? ` - ${body.slice(0, 200)}` : ""
    throw new Error(`Earningsfeed request failed: ${res.status} ${res.statusText} (${url})${detail}`)
  }
  if (!contentType.includes("application/json")) {
    throw new Error("Earningsfeed returned non-JSON response")
  }

  const data = (await res.json().catch(() => null)) as T | null
  if (!data) throw new Error("Earningsfeed returned empty response")
  return data
}


function normalizeIssuerName(value: string): string {
  return value.replace(/[.,]/g, "").trim()
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")

  if (!symbol) {
    return NextResponse.json({ error: "Missing required query param: symbol" }, { status: 400 })
  }

  const apiKey = process.env.EARNINGSFEED_API_KEY

  const cacheKey = symbol.toUpperCase()
  const cached = ownershipCache.get(cacheKey)
  const now = Date.now()
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(
      { ...cached.payload, cached: true },
      {
        headers: {
          "cache-control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=3600",
        },
      }
    )
  }

  const normalizedSymbol = symbol.toUpperCase()
  let issuerName = ""
  if (!apiKey) {
    return NextResponse.json({ error: "Missing server env var: EARNINGSFEED_API_KEY" }, { status: 500 })
  }

  try {
    const searchUrl = new URL("https://earningsfeed.com/api/v1/companies/search")
    searchUrl.searchParams.set("q", normalizedSymbol)
    const searchPayload = await fetchJson<EarningsfeedCompanySearchResponse>(searchUrl.toString(), apiKey)
    const items = Array.isArray(searchPayload?.items) ? searchPayload.items : []
    const exact = items.find((item) => (item?.ticker || "").toUpperCase() === normalizedSymbol)
    const picked = exact ?? items[0]
    const cik = picked?.cik

    if (cik) {
      const companyUrl = `https://earningsfeed.com/api/v1/companies/${cik}`
      const company = await fetchJson<EarningsfeedCompanyResponse>(companyUrl, apiKey)
      issuerName = company?.name ? String(company.name) : ""
    }

    if (!issuerName && picked?.name) {
      issuerName = String(picked.name)
    }
  } catch (e: any) {
    if (cached) {
      return NextResponse.json({ ...cached.payload, cached: true, stale: true })
    }
    return NextResponse.json({ error: e?.message || "Failed to resolve issuer name" }, { status: 502 })
  }

  if (!issuerName) {
    const payload = {
      symbol: normalizedSymbol,
      owners: [],
      updatedAt: new Date().toISOString(),
    }
    ownershipCache.set(cacheKey, { payload, fetchedAt: now })
    return NextResponse.json(payload, {
      headers: {
        "cache-control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=3600",
      },
    })
  }

  const holdings: EarningsfeedHoldingItem[] = []
  const pageLimit = 50
  let cursor: string | null | undefined = null
  let pages = 0
  const maxPages = 2
  const queryIssuerName = normalizeIssuerName(issuerName).toUpperCase() || issuerName

  try {
    for (;;) {
      const holdingsUrl = new URL("https://earningsfeed.com/api/v1/institutional/holdings")
      holdingsUrl.searchParams.set("issuerName", queryIssuerName)
      holdingsUrl.searchParams.set("limit", String(pageLimit))
      if (cursor) holdingsUrl.searchParams.set("cursor", cursor)

      const page = await fetchJson<EarningsfeedHoldingsResponse>(holdingsUrl.toString(), apiKey)
      const items = Array.isArray(page?.items) ? page.items : []
      holdings.push(...items)

      cursor = page?.nextCursor || null
      pages += 1
      if (!page?.hasMore || !cursor) break
      if (pages >= maxPages) break
    }
  } catch (e: any) {
    if (cached) {
      return NextResponse.json({ ...cached.payload, cached: true, stale: true })
    }
    return NextResponse.json({ error: e?.message || "Failed to query holdings" }, { status: 502 })
  }

  if (holdings.length === 0 && queryIssuerName !== issuerName) {
      try {
        const fallbackUrl = new URL("https://earningsfeed.com/api/v1/institutional/holdings")
        fallbackUrl.searchParams.set("issuerName", issuerName)
        fallbackUrl.searchParams.set("limit", String(pageLimit))
        const page = await fetchJson<EarningsfeedHoldingsResponse>(fallbackUrl.toString(), apiKey)
        const items = Array.isArray(page?.items) ? page.items : []
        holdings.push(...items)
      } catch (fallbackError: any) {
        if (cached) {
          return NextResponse.json({ ...cached.payload, cached: true, stale: true })
        }
        return NextResponse.json({ error: fallbackError?.message || "Failed to query holdings" }, { status: 502 })
      }
  }

  const holderByManager = new Map<
    string,
    {
      name: string
      share: number
      filingDate: string
      filedAtMs: number
    }
  >()

  for (const row of holdings) {
    const shares = row?.shares
    const sharesType = row?.sharesType
    const putCall = row?.putCall
    if (typeof shares !== "number" || shares <= 0) continue
    if (typeof sharesType === "string" && sharesType !== "SH") continue
    if (typeof putCall === "string" && putCall.trim()) continue

    const name = row?.managerName ? String(row.managerName) : row?.managerCik ? String(row.managerCik) : ""
    if (!name) continue

    const filingDate = row?.reportPeriodDate ? String(row.reportPeriodDate).slice(0, 10) : ""
    const filedAtMs = row?.filedAt ? Date.parse(String(row.filedAt)) : 0
    const existing = holderByManager.get(name)

    if (!existing) {
      holderByManager.set(name, {
        name,
        share: shares,
        filingDate,
        filedAtMs: Number.isFinite(filedAtMs) ? filedAtMs : 0,
      })
      continue
    }

    existing.share += shares
    if (Number.isFinite(filedAtMs) && filedAtMs > existing.filedAtMs) {
      existing.filedAtMs = filedAtMs
      if (filingDate) existing.filingDate = filingDate
    }
  }

  const topOwners = Array.from(holderByManager.values())
    .sort((a, b) => b.share - a.share)
    .slice(0, 10)
    .map((row) => ({
      name: row.name,
      share: row.share,
      change: 0,
      portfolioPercent: 0,
      filingDate: row.filingDate,
    }))

  const payload = {
    symbol: normalizedSymbol,
    owners: topOwners,
    updatedAt: new Date().toISOString(),
  }

  ownershipCache.set(cacheKey, { payload, fetchedAt: now })

  return NextResponse.json(payload, {
    headers: {
      "cache-control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=3600",
    },
  })
}
