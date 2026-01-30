import { NextResponse } from "next/server"

export const revalidate = 86400

type CacheEntry = {
  payload: any
  fetchedAt: number
}

function parseFiledAtMs(value: string | undefined): number {
  if (!value) return 0
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : 0
}

async function post13fHoldingsQuery(apiKey: string, body: Record<string, any>): Promise<SecApiHoldingsResponse> {
  const res = await fetch("https://api.sec-api.io/form-13f/holdings", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      Authorization: apiKey,
    },
    cache: "no-store",
    body: JSON.stringify(body),
  })

  const contentType = res.headers.get("content-type") || ""
  if (!res.ok) {
    throw new Error(`SEC API 13F holdings request failed: ${res.status} ${res.statusText}`)
  }
  if (!contentType.includes("application/json")) {
    throw new Error("SEC API 13F holdings returned non-JSON response")
  }

  const data = (await res.json().catch(() => null)) as SecApiHoldingsResponse | null
  return data ?? {}
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const ownershipCache = new Map<string, CacheEntry>()

type NameCacheEntry = {
  name: string
  fetchedAt: number
}

const NAME_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const filerNameCache = new Map<string, NameCacheEntry>()

type SecApiHolding = {
  ticker?: string
  value?: number
  shrsOrPrnAmt?: {
    sshPrnamt?: number
    sshPrnamtType?: string
  }
}

type SecApiFiler = {
  name?: string
}

type SecApiFiling = {
  cik?: string
  filedAt?: string
  periodOfReport?: string
  filingManager?: SecApiFiler
  holdings?: SecApiHolding[]
}

type SecApiHoldingsResponse = {
  data?: SecApiFiling[]
}

type SecApiEdgarEntitiesResponse = {
  data?: Array<{
    name?: string
  }>
}

async function resolveFilerNameByCik(cik: string, apiKey: string): Promise<string | null> {
  const normalizedCik = String(cik).trim()
  if (!normalizedCik) return null

  const cached = filerNameCache.get(normalizedCik)
  const now = Date.now()
  if (cached && now - cached.fetchedAt < NAME_CACHE_TTL_MS) return cached.name

  const url = new URL("https://api.sec-api.io/edgar-entities")
  url.searchParams.set("cik", normalizedCik)

  const res = await fetch(url.toString(), {
    headers: {
      accept: "application/json",
      Authorization: apiKey,
    },
    next: { revalidate },
  })

  if (!res.ok) return null

  const contentType = res.headers.get("content-type") || ""
  if (!contentType.includes("application/json")) return null

  const payload = (await res.json().catch(() => null)) as SecApiEdgarEntitiesResponse | null
  const name = payload?.data?.[0]?.name
  if (typeof name !== "string" || !name.trim()) return null

  filerNameCache.set(normalizedCik, { name: name.trim(), fetchedAt: now })
  return name.trim()
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")

  if (!symbol) {
    return NextResponse.json({ error: "Missing required query param: symbol" }, { status: 400 })
  }

  const apiKey = process.env.SEC_API_KEY || process.env.SEC_API_IO_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Missing server env var: SEC_API_KEY" }, { status: 500 })
  }

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
  let latestPeriodOfReport = ""
  try {
    const head = await post13fHoldingsQuery(apiKey, {
      query: `formType:\"13F\" AND holdings.ticker:${normalizedSymbol}`,
      from: "0",
      size: "1",
      sort: [{ periodOfReport: { order: "desc" } }],
    })
    const first = Array.isArray(head?.data) ? head.data[0] : undefined
    latestPeriodOfReport = first?.periodOfReport ? String(first.periodOfReport).slice(0, 10) : ""
  } catch (e: any) {
    if (cached) {
      return NextResponse.json({ ...cached.payload, cached: true, stale: true })
    }
    return NextResponse.json({ error: e?.message || "Failed to query SEC API 13F holdings" }, { status: 502 })
  }

  if (!latestPeriodOfReport) {
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

  const holderByCik = new Map<
    string,
    {
      filedAtMs: number
      name: string
      share: number
      portfolioPercent: number
      filingDate: string
    }
  >()

  const pageSize = 50
  let from = 0
  try {
    for (;;) {
      const page = await post13fHoldingsQuery(apiKey, {
        query: `formType:\"13F\" AND holdings.ticker:${normalizedSymbol} AND periodOfReport:${latestPeriodOfReport}`,
        from: String(from),
        size: String(pageSize),
        sort: [{ filedAt: { order: "desc" } }],
      })

      const filings = Array.isArray(page?.data) ? page.data : []
      if (filings.length === 0) break

      for (const filing of filings) {
        const cik = filing?.cik ? String(filing.cik) : ""
        if (!cik) continue

        const holdings = Array.isArray(filing?.holdings) ? filing.holdings : []
        const holding = holdings.find((h) => (h?.ticker || "").toUpperCase() === normalizedSymbol)
        if (!holding) continue

        const share = holding?.shrsOrPrnAmt?.sshPrnamt
        const shareType = holding?.shrsOrPrnAmt?.sshPrnamtType
        if (typeof share !== "number" || share <= 0) continue
        if (typeof shareType === "string" && shareType !== "SH") continue

        const positionValue = typeof holding?.value === "number" && holding.value > 0 ? holding.value : 0
        let totalValue = 0
        for (const h of holdings) {
          const v = h?.value
          if (typeof v === "number" && v > 0) totalValue += v
        }
        const portfolioPercent = totalValue > 0 ? (positionValue / totalValue) * 100 : 0

        const filedAtMs = parseFiledAtMs(filing?.filedAt)
        const existing = holderByCik.get(cik)
        if (existing && existing.filedAtMs >= filedAtMs) continue

        holderByCik.set(cik, {
          filedAtMs,
          name: filing?.filingManager?.name || cik,
          share,
          portfolioPercent,
          filingDate: latestPeriodOfReport,
        })
      }

      from += pageSize
      if (filings.length < pageSize) break
      if (from >= 10000) break
    }
  } catch (e: any) {
    if (cached) {
      return NextResponse.json({ ...cached.payload, cached: true, stale: true })
    }
    return NextResponse.json({ error: e?.message || "Failed to query SEC API 13F holdings" }, { status: 502 })
  }

  const ownersWithCik = Array.from(holderByCik.entries()).map(([cik, row]) => ({
    cik,
    name: row.name,
    share: row.share,
    change: 0,
    portfolioPercent: row.portfolioPercent,
    filingDate: row.filingDate,
  }))

  const topOwnersWithCik = ownersWithCik.sort((a, b) => b.share - a.share).slice(0, 10)

  const resolvedTopOwners = await Promise.all(
    topOwnersWithCik.map(async (o) => {
      if (o.name !== o.cik) return o
      if (!o.cik) return o
      const resolved = await resolveFilerNameByCik(o.cik, apiKey)
      return resolved ? { ...o, name: resolved } : o
    })
  )

  const topOwners = resolvedTopOwners.map(({ cik: _cik, ...rest }) => rest)

  const payload = {
    symbol: symbol.toUpperCase(),
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
