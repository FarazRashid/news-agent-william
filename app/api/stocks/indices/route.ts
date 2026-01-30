import { NextResponse } from "next/server"

export const revalidate = 60

// Define the major indices using ETFs that track them (Twelve Data supports these)
const INDICES_CONFIG = [
  { symbol: "SPY", name: "S&P 500 (SPY)" },
  { symbol: "DIA", name: "Dow Jones (DIA)" },
  { symbol: "QQQ", name: "NASDAQ (QQQ)" },
  { symbol: "IWM", name: "Russell 2000 (IWM)" },
]

async function fetchIndexData(symbol: string, name: string) {
  const apiKey = process.env.TWELVE_API_KEY
  if (!apiKey) {
    throw new Error("Missing TWELVE_API_KEY")
  }

  const response = await fetch(
    `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${apiKey}`,
    { next: { revalidate: 60 } }
  )

  if (!response.ok) {
    throw new Error(`Twelve Data request failed for ${symbol}: ${response.status}`)
  }

  const data = await response.json()

  // Twelve Data returns different structure, check for valid data
  if (data.status === 'error' || !data.close || data.close === 0) {
    throw new Error(`No valid data for index ${symbol}: ${data.message || 'Unknown error'}`)
  }

  return {
    symbol: data.symbol || symbol,
    name,
    value: parseFloat(data.close) || 0,
    change: parseFloat(data.percent_change) || 0,
    changeValue: parseFloat(data.change) || 0,
  }
}

export async function GET() {
  try {
    // Fetch all indices in parallel
    const indexPromises = INDICES_CONFIG.map(({ symbol, name }) =>
      fetchIndexData(symbol, name).catch((error) => {
        console.error(`Failed to fetch ${symbol}:`, error)
        return null
      })
    )

    const results = await Promise.allSettled(indexPromises)
    const indices = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && result.value !== null)
      .map(result => result.value)

    return NextResponse.json(indices)
  } catch (error) {
    console.error("Indices fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch indices data" },
      { status: 500 }
    )
  }
}
