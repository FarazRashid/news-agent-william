// Stock API integration layer
// This provides a mock implementation that can be replaced with real API calls

import type { StockData, StockChartData, StockPrice, TimeRange, StockSummary } from "./types"
import { calculateChange, formatSymbol } from "./utils"

// Mock data for demonstration
// Replace these functions with real API calls to Finnhub, Alpha Vantage, etc.

const MOCK_STOCKS: Record<string, Partial<StockData>> = {
  AAPL: {
    name: "Apple Inc.",
    sector: "Technology",
    industry: "Consumer Electronics",
    description: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.",
    ceo: "Tim Cook",
    employees: 164000,
    website: "https://www.apple.com",
    founded: 1976,
  },
  TSLA: {
    name: "Tesla Inc.",
    sector: "Automotive",
    industry: "Electric Vehicles",
    description: "Tesla, Inc. designs, develops, manufactures, and sells electric vehicles and energy storage systems.",
    ceo: "Elon Musk",
    employees: 127855,
    website: "https://www.tesla.com",
    founded: 2003,
  },
  MSFT: {
    name: "Microsoft Corporation",
    sector: "Technology",
    industry: "Software",
    description: "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.",
    ceo: "Satya Nadella",
    employees: 221000,
    website: "https://www.microsoft.com",
    founded: 1975,
  },
  GOOGL: {
    name: "Alphabet Inc.",
    sector: "Technology",
    industry: "Internet Services",
    description: "Alphabet Inc. offers various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.",
    ceo: "Sundar Pichai",
    employees: 190234,
    website: "https://abc.xyz",
    founded: 1998,
  },
}

/**
 * Fetch current stock data
 * TODO: Replace with real API call (Finnhub, Alpha Vantage, etc.)
 */
export async function fetchStockData(symbol: string): Promise<StockData> {
  const formattedSymbol = formatSymbol(symbol)

  const quoteUrl =
    typeof window === "undefined"
      ? (() => {
          const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
          const url = new URL("/api/stocks/quote", base)
          url.searchParams.set("symbol", formattedSymbol)
          return url.toString()
        })()
      : `/api/stocks/quote?symbol=${encodeURIComponent(formattedSymbol)}`

  const metricUrl =
    typeof window === "undefined"
      ? (() => {
          const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
          const url = new URL("/api/stocks/metric", base)
          url.searchParams.set("symbol", formattedSymbol)
          return url.toString()
        })()
      : `/api/stocks/metric?symbol=${encodeURIComponent(formattedSymbol)}`

  const profileUrl =
    typeof window === "undefined"
      ? (() => {
          const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
          const url = new URL("/api/stocks/profile", base)
          url.searchParams.set("symbol", formattedSymbol)
          return url.toString()
        })()
      : `/api/stocks/profile?symbol=${encodeURIComponent(formattedSymbol)}`

  const dailyChartUrl =
    typeof window === "undefined"
      ? (() => {
          const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
          const url = new URL("/api/stocks/charts-data", base)
          url.searchParams.set("symbol", formattedSymbol)
          url.searchParams.set("interval", "1day")
          url.searchParams.set("outputsize", "30")
          return url.toString()
        })()
      : `/api/stocks/charts-data?symbol=${encodeURIComponent(formattedSymbol)}&interval=1day&outputsize=30`

  const [quoteRes, metricRes, profileRes] = await Promise.all([
    fetch(quoteUrl),
    fetch(metricUrl),
    fetch(profileUrl),
  ])

  if (!quoteRes.ok) {
    throw new Error(`Failed to fetch quote for ${formattedSymbol}`)
  }

  const quote = (await quoteRes.json()) as {
    symbol: string
    c: number
    d: number
    dp: number
    h: number
    l: number
    o: number
    pc: number
    t: number
  }

  const metricPayload = (await (async () => {
    if (!metricRes.ok) return null
    return (await metricRes.json().catch(() => null)) as null | {
      symbol: string
      metric?: Record<string, unknown>
    }
  })())

  const metric = metricPayload?.metric || {}

  const pickNumber = (keys: string[]): number | undefined => {
    for (const key of keys) {
      const val = (metric as Record<string, unknown>)[key]
      if (typeof val === "number" && Number.isFinite(val)) return val
      if (typeof val === "string") {
        const n = Number(val)
        if (Number.isFinite(n)) return n
      }
    }
    return undefined
  }

  const profilePayload = await (async () => {
    if (!profileRes.ok) return null
    return (await profileRes.json().catch(() => null)) as null | {
      symbol: string
      name?: string
      exchange?: string
      logo?: string
      marketCapitalization?: number
      country?: string
      currency?: string
      estimateCurrency?: string
      finnhubIndustry?: string
      ipo?: string
      phone?: string
      shareOutstanding?: number
      ticker?: string
      weburl?: string
      gics?: string
      sector?: string
      industry?: string
      description?: string
      employees?: number | string
    }
  })()

  const marketCapUsd = (() => {
    const mc = profilePayload?.marketCapitalization
    if (typeof mc !== "number" || !Number.isFinite(mc)) return 0
    // Finnhub profile2 returns marketCapitalization in *million USD*
    return mc * 1_000_000
  })()

  const dailyVolumePayload = await (async () => {
    // Only fetch daily candles if we still don't have volume data.
    // (Avoid extra requests when Finnhub plan/fields already provide it.)
    const existingVol = pickNumber(["volume"]) ?? 0
    const existingAvgVol = pickNumber(["avgVolume", "avgVolume10Day", "averageVolume10Day", "avgVol10Day"]) ?? 0
    if (existingVol > 0 && existingAvgVol > 0) return null

    const res = await fetch(dailyChartUrl).catch(() => null)
    if (!res || !res.ok) return null

    return (await res.json().catch(() => null)) as null | {
      values?: Array<{
        datetime: string
        volume: string
      }>
    }
  })()

  const dailyVolumes = (dailyVolumePayload?.values || [])
    .map((v) => {
      const n = Number(v.volume)
      return Number.isFinite(n) ? n : null
    })
    .filter((n): n is number => n !== null)

  // Twelve Data returns latest first; we reverse for charts elsewhere.
  // For volume we just need last trading day and average.
  const derivedVolume = dailyVolumes.length > 0 ? dailyVolumes[0] : 0
  const derivedAvgVolume =
    dailyVolumes.length > 0
      ? dailyVolumes.reduce((sum, n) => sum + n, 0) / dailyVolumes.length
      : 0

  const dividendYieldValue = (() => {
    // Finnhub sometimes returns dividendYieldIndicatedAnnual as 0 even when a yield exists.
    // Prefer non-zero values; fall back to other common keys.
    const primary = pickNumber(["dividendYieldIndicatedAnnual", "dividendYieldTTM", "dividendYield5Y"])
    if (typeof primary === "number" && primary > 0) return primary
    const alt = pickNumber([
      "currentDividendYieldTTM",
      "dividendYieldAnnual",
      "dividendYield",
      "dividendYieldAvg5Y",
    ])
    if (typeof alt === "number" && alt > 0) return alt
    return undefined
  })()

  const mockInfo = MOCK_STOCKS[formattedSymbol] || {
    name: `${formattedSymbol} Company`,
    sector: "Unknown",
    industry: "Unknown",
    description: `${formattedSymbol} is a publicly traded company.`,
  }

  return {
    symbol: formattedSymbol,
    name: profilePayload?.name || mockInfo.name!,
    exchange: "NASDAQ",
    price: quote.c,
    change: quote.d,
    changePercent: quote.dp,
    open: quote.o,
    high: quote.h,
    low: quote.l,
    previousClose: quote.pc,
    volume: pickNumber(["volume"]) ?? derivedVolume,
    avgVolume:
      pickNumber(["avgVolume", "avgVolume10Day", "averageVolume10Day", "avgVol10Day"]) ??
      derivedAvgVolume,
    marketCap: marketCapUsd || (pickNumber(["marketCapitalization", "marketCap"]) ?? 0),
    week52High: pickNumber(["52WeekHigh", "52WeekHighAdjusted", "week52High"]) ?? quote.h,
    week52Low: pickNumber(["52WeekLow", "52WeekLowAdjusted", "week52Low"]) ?? quote.l,
    peRatio: pickNumber(["peTTM", "peBasicExclExtraTTM", "peInclExtraTTM", "peNormalizedAnnual"]),
    dividendYield: dividendYieldValue,
    beta: pickNumber(["beta"]) ?? undefined,
    eps: pickNumber(["epsTTM", "epsBasicExclExtraItemsTTM", "epsInclExtraItemsTTM"]) ?? undefined,
    sector: profilePayload?.gics || profilePayload?.sector || mockInfo.sector,
    industry: profilePayload?.finnhubIndustry || profilePayload?.industry || mockInfo.industry,
    description: profilePayload?.description || mockInfo.description,
    ceo: mockInfo.ceo, // Finnhub doesn't provide CEO in basic profile
    employees: profilePayload?.employees ? (typeof profilePayload.employees === 'string' ? Number(profilePayload.employees) : profilePayload.employees) : mockInfo.employees,
    website: profilePayload?.weburl || mockInfo.website,
    founded: profilePayload?.ipo || mockInfo.founded, // Using IPO date as founded fallback
    logoUrl: profilePayload?.logo || undefined,
  }
}

/**
 * Generate chart data for different time ranges
 * TODO: Replace with real historical data API
 */
export async function fetchStockChartData(
  symbol: string,
  timeRange: TimeRange = "1D"
): Promise<StockChartData> {
  const formattedSymbol = formatSymbol(symbol)

  const interval = (() => {
    switch (timeRange) {
      case "1D":
        return "5min"
      case "5D":
        return "15min"
      case "1M":
        return "1day"
      case "3M":
        return "1day"
      case "6M":
        return "1day"
      case "1Y":
        return "1day"
      case "5Y":
        return "1week"
      case "MAX":
        return "1month"
      default:
        return "1day"
    }
  })()

  const outputSize = (() => {
    switch (timeRange) {
      case "1D":
        return 78 // 5-minute intervals during market hours
      case "5D":
        return 390 // 5 days of data
      case "1M":
        return 30
      case "3M":
        return 90
      case "6M":
        return 180
      case "1Y":
        return 252
      case "5Y":
        return 260 // 5 years of weekly data
      case "MAX":
        return 120 // 10 years of monthly data
      default:
        return 30
    }
  })()

  const chartsDataUrl =
    typeof window === "undefined"
      ? (() => {
          const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
          const url = new URL("/api/stocks/charts-data", base)
          url.searchParams.set("symbol", formattedSymbol)
          url.searchParams.set("interval", interval)
          url.searchParams.set("outputsize", String(outputSize))
          return url.toString()
        })()
      : `/api/stocks/charts-data?symbol=${encodeURIComponent(formattedSymbol)}&interval=${encodeURIComponent(interval)}&outputsize=${encodeURIComponent(String(outputSize))}`

  try {
    const res = await fetch(chartsDataUrl)

    if (!res.ok) {
      throw new Error(`Charts data request failed: ${res.status} ${res.statusText}`)
    }

    const data = (await res.json()) as {
      status?: string
      message?: string
      values?: Array<{
        datetime: string
        open: string
        high: string
        low: string
        close: string
        volume: string
      }>
    }

    if (data.status === "error" || data.message) {
      throw new Error(`Charts data API error: ${data.message || "Unknown error"}`)
    }

    if (!data.values || data.values.length === 0) {
      throw new Error("No data available from charts data")
    }

    // Convert Twelve Data format to our StockPrice format
    const prices: StockPrice[] = data.values.map((item) => ({
      timestamp: new Date(item.datetime).getTime(),
      date: new Date(item.datetime).toISOString(),
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: parseInt(item.volume, 10),
    })).reverse() // Reverse to get chronological order

    return {
      symbol: formattedSymbol,
      prices,
      timeRange,
    }
  } catch (error) {
    console.warn(`Charts data API failed for ${formattedSymbol}, falling back to quote data:`, error)
    
    // Fallback: Use Finnhub quote data to create a simple chart
    const quoteUrl =
      typeof window === "undefined"
        ? (() => {
            const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
            const url = new URL("/api/stocks/quote", base)
            url.searchParams.set("symbol", formattedSymbol)
            return url.toString()
          })()
        : `/api/stocks/quote?symbol=${encodeURIComponent(formattedSymbol)}`

    const quoteRes = await fetch(quoteUrl)
    if (!quoteRes.ok) {
      throw new Error(`Failed to fetch quote for ${formattedSymbol}`)
    }

    const quote = (await quoteRes.json()) as {
      symbol: string
      c: number
      d: number
      dp: number
      h: number
      l: number
      o: number
      pc: number
      t: number
    }

    // Create a simple chart with current and previous close
    const prices: StockPrice[] = [
      {
        timestamp: quote.t * 1000 - 86400000, // Previous day
        date: new Date(quote.t * 1000 - 86400000).toISOString(),
        open: quote.pc,
        high: quote.pc,
        low: quote.pc,
        close: quote.pc,
        volume: 0,
      },
      {
        timestamp: quote.t * 1000, // Current
        date: new Date(quote.t * 1000).toISOString(),
        open: quote.o,
        high: quote.h,
        low: quote.l,
        close: quote.c,
        volume: 0,
      },
    ]

    return {
      symbol: formattedSymbol,
      prices,
      timeRange,
    }
  }
}

/**
 * Get number of data points for time range
 */
function getDataPointsForTimeRange(timeRange: TimeRange): number {
  switch (timeRange) {
    case "1D":
      return 78 // 5-minute intervals during market hours
    case "5D":
      return 390 // 5 days of 5-minute intervals
    case "1M":
      return 30 // Daily data for 1 month
    case "3M":
      return 90
    case "6M":
      return 180
    case "1Y":
      return 252 // Trading days in a year
    case "5Y":
      return 1260
    case "MAX":
      return 2520 // ~10 years
    default:
      return 78
  }
}

/**
 * Get interval in milliseconds for time range
 */
function getIntervalForTimeRange(timeRange: TimeRange): number {
  switch (timeRange) {
    case "1D":
      return 5 * 60 * 1000 // 5 minutes
    case "5D":
      return 5 * 60 * 1000
    case "1M":
      return 24 * 60 * 60 * 1000 // 1 day
    case "3M":
      return 24 * 60 * 60 * 1000
    case "6M":
      return 24 * 60 * 60 * 1000
    case "1Y":
      return 24 * 60 * 60 * 1000
    case "5Y":
      return 24 * 60 * 60 * 1000
    case "MAX":
      return 24 * 60 * 60 * 1000
    default:
      return 5 * 60 * 1000
  }
}

/**
 * Generate AI summary for a stock based on real news data
 */
export async function fetchStockSummary(symbol: string, stockData: StockData): Promise<StockSummary> {
  try {
    const summaryUrl =
      typeof window === "undefined"
        ? (() => {
            const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
            const url = new URL("/api/stocks/summary", base)
            url.searchParams.set("symbol", symbol)
            return url.toString()
          })()
        : `/api/stocks/summary?symbol=${encodeURIComponent(symbol)}`

    const res = await fetch(summaryUrl, { cache: "no-store" })
    if (!res.ok) {
      throw new Error(`Summary API failed: ${res.status}`)
    }

    const summaryData = (await res.json()) as {
      symbol: string
      summary: string
      sentiment: "bullish" | "bearish" | "neutral"
      keyFactors: string[]
      riskFactors?: string[]
      lastUpdated: string
    }

    return {
      symbol: summaryData.symbol,
      summary: summaryData.summary,
      sentiment: summaryData.sentiment,
      keyFactors: summaryData.keyFactors || [],
      riskFactors: summaryData.riskFactors || [],
      lastUpdated: new Date(summaryData.lastUpdated),
    }
  } catch (error) {
    console.warn(`Failed to fetch summary for ${symbol}, showing placeholder:`, error)

    return {
      symbol,
      summary: "Summary is being generated. Please check back soon.",
      sentiment: "neutral",
      keyFactors: ["Awaiting latest market data", "Analyzing recent news", "Generating AI insights"],
      riskFactors: [],
      lastUpdated: new Date(),
    }
  }
}

/**
 * Analyze news headlines for sentiment
 */
function analyzeNewsSentiment(news: any[]): "bullish" | "bearish" | "neutral" | null {
  if (!news.length) return null

  const bullishKeywords = ["surge", "rally", "jump", "gain", "rise", "strong", "beat", "growth", "upgrade", "positive"]
  const bearishKeywords = ["fall", "drop", "decline", "slump", "weak", "miss", "cut", "downgrade", "negative", "concern"]
  
  let bullishCount = 0
  let bearishCount = 0

  news.slice(0, 5).forEach(article => {
    const headline = article.headline?.toLowerCase() || ""
    bullishKeywords.forEach(keyword => {
      if (headline.includes(keyword)) bullishCount++
    })
    bearishKeywords.forEach(keyword => {
      if (headline.includes(keyword)) bearishCount++
    })
  })

  if (bullishCount > bearishCount) return "bullish"
  if (bearishCount > bullishCount) return "bearish"
  return "neutral"
}

/**
 * Generate summary from actual news data
 */
function generateSummaryFromNews(symbol: string, stockData: StockData, news: any[], sentiment: string): string {
  if (!news.length) {
    return `${symbol} is currently trading at $${stockData.price.toFixed(2)} with a change of ${stockData.changePercent >= 0 ? '+' : ''}${stockData.changePercent.toFixed(2)}%. Limited recent news is available for analysis.`
  }

  const recentHeadlines = news.slice(0, 3).map(n => n.headline).join(". ")
  
  const sentimentDescriptions = {
    bullish: `${symbol} has shown positive momentum with ${stockData.changePercent >= 0 ? 'a gain of' : 'a change of'} ${stockData.changePercent.toFixed(2)}%. Recent news highlights: ${recentHeadlines}. Market sentiment appears favorable based on recent developments.`,
    bearish: `${symbol} is facing pressure with ${stockData.changePercent < 0 ? 'a decline of' : 'a change of'} ${Math.abs(stockData.changePercent).toFixed(2)}%. Recent news indicates: ${recentHeadlines}. Investors should monitor these developments closely.`,
    neutral: `${symbol} is trading at $${stockData.price.toFixed(2)} with minimal movement. Recent news includes: ${recentHeadlines}. The stock appears to be consolidating as investors digest recent information.`
  }

  return sentimentDescriptions[sentiment as keyof typeof sentimentDescriptions] || sentimentDescriptions.neutral
}

/**
 * Extract key factors from news
 */
function extractKeyFactors(news: any[], sentiment: string): string[] {
  if (!news.length) {
    return ["Limited recent news available", "Monitoring market conditions", "Awaiting next catalyst"]
  }

  const factors = news.slice(0, 5).map(article => {
    const headline = article.headline
    // Extract key themes from headlines
    if (headline.toLowerCase().includes("earnings")) return "Quarterly earnings performance"
    if (headline.toLowerCase().includes("guidance")) return "Company guidance updates"
    if (headline.toLowerCase().includes("analyst")) return "Analyst ratings and price targets"
    if (headline.toLowerCase().includes("market")) return "Overall market conditions"
    if (headline.toLowerCase().includes("product")) return "Product developments and launches"
    return headline.length > 50 ? headline.substring(0, 47) + "..." : headline
  })

  return [...new Set(factors)].slice(0, 4) // Remove duplicates and limit to 4
}

/**
 * Extract risk factors from news
 */
function extractRiskFactors(news: any[]): string[] {
  if (!news.length) {
    return ["Market volatility risks", "Economic uncertainty", "Sector-specific challenges"]
  }

  const riskKeywords = ["risk", "concern", "challenge", "downside", "volatility", "uncertainty", "regulation", "competition"]
  const risks = new Set<string>()

  news.slice(0, 10).forEach(article => {
    const text = (article.headline + " " + (article.summary || "")).toLowerCase()
    riskKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        if (keyword === "risk") risks.add("Market and operational risks")
        if (keyword === "concern") risks.add("Investor concerns about performance")
        if (keyword === "challenge") risks.add("Business and regulatory challenges")
        if (keyword === "volatility") risks.add("Stock price volatility")
        if (keyword === "uncertainty") risks.add("Economic and regulatory uncertainty")
        if (keyword === "regulation") risks.add("Regulatory and compliance risks")
        if (keyword === "competition") risks.add("Competitive pressures")
      }
    })
  })

  const riskArray = Array.from(risks)
  if (riskArray.length === 0) {
    return ["Market volatility may impact performance", "Economic headwinds remain a concern", "Sector-specific challenges persist"]
  }

  return riskArray.slice(0, 3)
}

/**
 * Fallback mock summary generator
 */
function generateMockSummary(symbol: string, stockData: StockData): StockSummary {
  const sentiment = stockData.changePercent > 2 ? "bullish" : stockData.changePercent < -2 ? "bearish" : "neutral"
  
  const summaries = {
    bullish: `${symbol} has shown strong positive momentum, gaining ${stockData.changePercent.toFixed(2)}% today. The stock is trading above its recent support levels, indicating sustained buyer interest.`,
    bearish: `${symbol} is experiencing downward pressure, declining ${Math.abs(stockData.changePercent).toFixed(2)}% today. The stock has broken below key support levels, raising concerns among investors.`,
    neutral: `${symbol} is trading relatively flat with minimal volatility today. The stock is consolidating within its recent range as investors await new catalysts.`,
  }
  
  const keyFactors = {
    bullish: ["Strong technical indicators", "Positive market sentiment", "Sector momentum"],
    bearish: ["Technical weakness", "Market headwinds", "Profit-taking pressure"],
    neutral: ["Consolidation phase", "Awaiting catalysts", "Balanced risk/reward"],
  }
  
  return {
    symbol,
    summary: summaries[sentiment],
    sentiment,
    keyFactors: keyFactors[sentiment],
    riskFactors: ["Market volatility risks", "Economic uncertainty", "Sector-specific challenges"],
    lastUpdated: new Date(),
  }
}

/**
 * Check if market is currently open
 * TODO: Replace with real market status API
 */
export function isMarketOpen(): boolean {
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()
  
  // Weekends
  if (day === 0 || day === 6) return false
  
  // Market hours: 9:30 AM - 4:00 PM EST (simplified)
  return hour >= 9 && hour < 16
}

/**
 * Format time range display
 */
export function formatTimeRangeDisplay(timeRange: TimeRange): string {
  const displays: Record<TimeRange, string> = {
    "1D": "Today",
    "5D": "5 Days",
    "1M": "1 Month",
    "3M": "3 Months",
    "6M": "6 Months",
    "1Y": "1 Year",
    "5Y": "5 Years",
    "MAX": "All Time",
  }
  return displays[timeRange]
}
