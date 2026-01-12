// Stock utility functions

import type { StockMetricData } from "./types"

/**
 * Format large numbers (billions, millions, etc.)
 */
export function formatMarketCap(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(2)}T`
  }
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`
  }
  return `$${value.toFixed(2)}`
}

/**
 * Format volume numbers
 */
export function formatVolume(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`
  }
  return value.toLocaleString()
}

/**
 * Format price with appropriate decimal places
 */
export function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toFixed(2)
  }
  if (price >= 1) {
    return price.toFixed(2)
  }
  return price.toFixed(4)
}

/**
 * Format percentage
 */
export function formatPercent(percent: number): string {
  const sign = percent >= 0 ? "+" : ""
  return `${sign}${percent.toFixed(2)}%`
}

/**
 * Get market cap category
 */
export function getMarketCapCategory(marketCap: number): string {
  if (marketCap >= 200_000_000_000) return "Mega Cap"
  if (marketCap >= 10_000_000_000) return "Large Cap"
  if (marketCap >= 2_000_000_000) return "Mid Cap"
  if (marketCap >= 300_000_000) return "Small Cap"
  return "Micro Cap"
}

/**
 * Generate stock metrics from stock data
 */
export function generateStockMetrics(stock: any): StockMetricData[] {
  return [
    {
      label: "Market Cap",
      value: formatMarketCap(stock.marketCap),
      subValue: getMarketCapCategory(stock.marketCap),
    },
    {
      label: "P/E Ratio",
      value: stock.peRatio ? stock.peRatio.toFixed(2) : "N/A",
      trend: stock.peRatio > 25 ? "up" : stock.peRatio < 15 ? "down" : "neutral",
    },
    {
      label: "Dividend Yield",
      value: stock.dividendYield ? `${stock.dividendYield.toFixed(2)}%` : "N/A",
      trend: stock.dividendYield > 2 ? "up" : "neutral",
    },
    {
      label: "52W High",
      value: `$${formatPrice(stock.week52High)}`,
    },
    {
      label: "52W Low",
      value: `$${formatPrice(stock.week52Low)}`,
    },
    {
      label: "Volume",
      value: formatVolume(stock.volume),
      subValue: `Avg: ${formatVolume(stock.avgVolume)}`,
    },
    {
      label: "Open",
      value: `$${formatPrice(stock.open)}`,
    },
    {
      label: "Previous Close",
      value: `$${formatPrice(stock.previousClose)}`,
    },
  ]
}

/**
 * Determine sentiment from change
 */
export function getSentimentFromChange(change: number): "bullish" | "bearish" | "neutral" {
  if (change > 2) return "bullish"
  if (change < -2) return "bearish"
  return "neutral"
}

/**
 * Get sentiment color
 */
export function getSentimentColor(sentiment: "bullish" | "bearish" | "neutral"): string {
  switch (sentiment) {
    case "bullish":
      return "text-green-600 dark:text-green-400"
    case "bearish":
      return "text-red-600 dark:text-red-400"
    default:
      return "text-muted-foreground"
  }
}

/**
 * Get sentiment badge variant
 */
export function getSentimentBadgeVariant(
  sentiment: "bullish" | "bearish" | "neutral"
): "default" | "destructive" | "secondary" {
  switch (sentiment) {
    case "bullish":
      return "default"
    case "bearish":
      return "destructive"
    default:
      return "secondary"
  }
}

/**
 * Validate stock symbol
 */
export function isValidStockSymbol(symbol: string): boolean {
  return /^[A-Z]{1,5}$/.test(symbol.toUpperCase())
}

/**
 * Format stock symbol (uppercase, trim)
 */
export function formatSymbol(symbol: string): string {
  return symbol.toUpperCase().trim()
}

/**
 * Calculate price change
 */
export function calculateChange(current: number, previous: number): {
  change: number
  changePercent: number
} {
  const change = current - previous
  const changePercent = (change / previous) * 100
  return { change, changePercent }
}
