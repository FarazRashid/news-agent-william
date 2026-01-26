import { NextResponse } from "next/server"

export const revalidate = 60

// Broad stock universe to analyze for market movers
const STOCK_UNIVERSE = [
  // Tech Giants
  "AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "AMD", "INTC",
  // Financial Services
  "JPM", "BAC", "WFC", "GS", "MS", "C", "AXP", "BLK", "V", "MA",
  // Healthcare
  "JNJ", "UNH", "PFE", "ABT", "TMO", "DHR", "ABBV", "CVS", "MDT", "AMGN",
  // Consumer
  "WMT", "HD", "MCD", "NKE", "SBUX", "COST", "KO", "PEP", "DIS", "NFLX",
  // Energy & Industrial
  "XOM", "CVX", "COP", "SLB", "BA", "CAT", "GE", "MMM", "HON", "UPS",
  // Popular Growth/Meme Stocks
  "PLTR", "SOFI", "RIVN", "NIO", "COIN", "GME", "AMC", "BB", "ROKU",
  // ETFs & Indices
  "SPY", "QQQ", "IWM", "DIA", "VTI", "VOO", "GLD", "SLV", "TLT", "HYG",
  // Add TSLA separately to avoid duplication
  "TSLA"
]

const POPULAR_STOCKS = [
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "TSLA",
  "NVDA",
  "META",
  "NFLX",
]

function formatVolume(volume: number): string {
  if (volume >= 1e9) {
    return `${(volume / 1e9).toFixed(1)}B`
  } else if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(1)}M`
  } else if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(1)}K`
  }
  return volume.toString()
}

async function fetchStockData(symbol: string) {
  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    throw new Error("Missing FINNHUB_API_KEY")
  }

  // Fetch quote and profile data in parallel
  const [quoteResponse, profileResponse] = await Promise.all([
    fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`, {
      next: { revalidate: 60 }
    }),
    fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`, {
      next: { revalidate: 3600 }
    })
  ])

  if (!quoteResponse.ok) {
    throw new Error(`Quote request failed for ${symbol}: ${quoteResponse.status}`)
  }
  if (!profileResponse.ok) {
    throw new Error(`Profile request failed for ${symbol}: ${profileResponse.status}`)
  }

  const [quoteData, profileData] = await Promise.all([
    quoteResponse.json(),
    profileResponse.json()
  ])

  // Calculate volume from shares outstanding if available
  let volume = "N/A"
  if (profileData.shareOutstanding && typeof profileData.shareOutstanding === 'number') {
    volume = formatVolume(profileData.shareOutstanding * 1000000)
  }

  return {
    symbol: symbol.toUpperCase(),
    name: profileData.name || symbol,
    price: quoteData.c || 0,
    change: quoteData.dp || 0,
    changeValue: quoteData.d || 0,
    volume,
    // Add raw volume for sorting
    rawVolume: profileData.shareOutstanding ? profileData.shareOutstanding * 1000000 : 0
  }
}

export async function GET() {
  try {
    // Remove duplicates from stock universe first
    const uniqueStockUniverse = [...new Set(STOCK_UNIVERSE)]
    
    // Fetch all stock data in parallel with rate limiting
    const BATCH_SIZE = 5 // Process 5 stocks at a time to avoid rate limits
    const stockPromises: Promise<any>[] = []
    
    for (let i = 0; i < uniqueStockUniverse.length; i += BATCH_SIZE) {
      const batch = uniqueStockUniverse.slice(i, i + BATCH_SIZE)
      const batchPromises = batch.map(symbol => 
        fetchStockData(symbol).catch((error) => {
          console.error(`Failed to fetch ${symbol}:`, error)
          return null
        })
      )
      stockPromises.push(...batchPromises)
      
      // Add small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < uniqueStockUniverse.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    const results = await Promise.allSettled(stockPromises)
    const allStocks = results
      .filter((result): result is PromiseFulfilledResult<any> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value)
      .filter(stock => stock.price > 0) // Filter out invalid stocks

    // Calculate dynamic market movers
    const gainers = [...allStocks]
      .filter(stock => stock.change > 0)
      .sort((a, b) => b.change - a.change)
      .slice(0, 5)

    const losers = [...allStocks]
      .filter(stock => stock.change < 0)
      .sort((a, b) => a.change - b.change)
      .slice(0, 5)

    const mostActive = [...allStocks]
      .filter(stock => stock.rawVolume > 0)
      .sort((a, b) => b.rawVolume - a.rawVolume)
      .slice(0, 5)

    // Trending: High volatility + significant volume
    const trending = [...allStocks]
      .filter(stock => Math.abs(stock.change) > 2 && stock.rawVolume > 1000000)
      .sort((a, b) => {
        // Score by absolute change + volume factor
        const scoreA = Math.abs(a.change) * Math.log10(a.rawVolume + 1)
        const scoreB = Math.abs(b.change) * Math.log10(b.rawVolume + 1)
        return scoreB - scoreA
      })
      .slice(0, 5)

    const popular = POPULAR_STOCKS
      .map((symbol) => allStocks.find((s) => s.symbol === symbol))
      .filter(Boolean)

    // Clean up rawVolume before returning and ensure unique symbols
    const cleanStocks = (stocks: any[]) => {
      const uniqueStocks = stocks.filter((stock, index, arr) => 
        arr.findIndex(s => s.symbol === stock.symbol) === index
      )
      return uniqueStocks.map(({ rawVolume, ...stock }) => stock)
    }

    const dashboardData = {
      gainers: cleanStocks(gainers),
      losers: cleanStocks(losers),
      active: cleanStocks(mostActive),
      trending: cleanStocks(trending),
      popular: cleanStocks(popular as any[]),
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error("Dashboard stocks fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard stocks data" },
      { status: 500 }
    )
  }
}
