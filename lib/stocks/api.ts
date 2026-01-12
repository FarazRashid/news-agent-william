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
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Generate mock data
  const basePrice = 100 + Math.random() * 200
  const change = (Math.random() - 0.5) * 10
  const changePercent = (change / basePrice) * 100
  
  const mockInfo = MOCK_STOCKS[formattedSymbol] || {
    name: `${formattedSymbol} Company`,
    sector: "Unknown",
    industry: "Unknown",
    description: `${formattedSymbol} is a publicly traded company.`,
  }
  
  return {
    symbol: formattedSymbol,
    name: mockInfo.name!,
    exchange: "NASDAQ",
    price: basePrice,
    change,
    changePercent,
    open: basePrice - Math.random() * 5,
    high: basePrice + Math.random() * 5,
    low: basePrice - Math.random() * 5,
    previousClose: basePrice - change,
    volume: Math.floor(50_000_000 + Math.random() * 50_000_000),
    avgVolume: Math.floor(60_000_000 + Math.random() * 40_000_000),
    marketCap: Math.floor(1_000_000_000_000 + Math.random() * 2_000_000_000_000),
    peRatio: 20 + Math.random() * 20,
    dividendYield: Math.random() * 3,
    week52High: basePrice + Math.random() * 50,
    week52Low: basePrice - Math.random() * 50,
    beta: 0.8 + Math.random() * 0.8,
    eps: 3 + Math.random() * 5,
    sector: mockInfo.sector,
    industry: mockInfo.industry,
    description: mockInfo.description,
    ceo: mockInfo.ceo,
    employees: mockInfo.employees,
    website: mockInfo.website,
    founded: mockInfo.founded,
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
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // Generate mock price data
  const dataPoints = getDataPointsForTimeRange(timeRange)
  const basePrice = 100 + Math.random() * 200
  const prices: StockPrice[] = []
  
  let currentPrice = basePrice
  const now = Date.now()
  
  for (let i = dataPoints; i >= 0; i--) {
    const timestamp = now - (i * getIntervalForTimeRange(timeRange))
    const volatility = 0.02 // 2% volatility
    const change = (Math.random() - 0.5) * currentPrice * volatility
    
    currentPrice = Math.max(1, currentPrice + change)
    
    const open = currentPrice
    const high = open + Math.random() * currentPrice * 0.01
    const low = open - Math.random() * currentPrice * 0.01
    const close = low + Math.random() * (high - low)
    
    prices.push({
      timestamp,
      date: new Date(timestamp).toISOString(),
      open,
      high,
      low,
      close,
      volume: Math.floor(50_000_000 + Math.random() * 50_000_000),
    })
  }
  
  return {
    symbol: formattedSymbol,
    prices,
    timeRange,
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
 * Generate AI summary for a stock
 * TODO: Replace with real AI generation or API call
 */
export async function fetchStockSummary(symbol: string, stockData: StockData): Promise<StockSummary> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400))
  
  const sentiment = stockData.changePercent > 2 ? "bullish" : stockData.changePercent < -2 ? "bearish" : "neutral"
  
  const summaries = {
    bullish: `${symbol} has shown strong positive momentum, gaining ${stockData.changePercent.toFixed(2)}% today. The stock is trading above its recent support levels, indicating sustained buyer interest. Recent market conditions and company fundamentals suggest continued strength in the near term.`,
    bearish: `${symbol} is experiencing downward pressure, declining ${Math.abs(stockData.changePercent).toFixed(2)}% today. The stock has broken below key support levels, raising concerns among investors. Market sentiment remains cautious amid current economic conditions.`,
    neutral: `${symbol} is trading relatively flat with minimal volatility today. The stock is consolidating within its recent range as investors await new catalysts. Current market conditions suggest a wait-and-see approach among traders.`,
  }
  
  const keyFactors = {
    bullish: [
      "Strong quarterly earnings reported",
      "Positive analyst sentiment and upgrades",
      "Market sector performing well",
      "Institutional buying activity increasing",
    ],
    bearish: [
      "Concerns about quarterly guidance",
      "Negative analyst sentiment",
      "Sector headwinds affecting performance",
      "Profit-taking after recent gains",
    ],
    neutral: [
      "Mixed earnings results",
      "Awaiting key economic data",
      "Consolidation after recent move",
      "Low trading volume indicating caution",
    ],
  }
  
  return {
    symbol,
    summary: summaries[sentiment],
    sentiment,
    keyFactors: keyFactors[sentiment],
    riskFactors: [
      "Market volatility may impact short-term performance",
      "Economic headwinds remain a concern",
      "Sector-specific challenges persist",
    ],
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
