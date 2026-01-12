// Stock-related TypeScript types

export interface StockData {
  symbol: string
  name: string
  exchange: string
  price: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  previousClose: number
  volume: number
  avgVolume: number
  marketCap: number
  peRatio?: number
  dividendYield?: number
  week52High: number
  week52Low: number
  beta?: number
  eps?: number
  logoUrl?: string
  description?: string
  sector?: string
  industry?: string
  ceo?: string
  employees?: number
  website?: string
  founded?: number
}

export interface StockPrice {
  timestamp: number
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface StockChartData {
  symbol: string
  prices: StockPrice[]
  timeRange: TimeRange
}

export type TimeRange = "1D" | "5D" | "1M" | "3M" | "6M" | "1Y" | "5Y" | "MAX"

export interface StockNews {
  id: string
  title: string
  summary: string
  url: string
  publishedAt: Date
  source: string
  sentiment?: "bullish" | "bearish" | "neutral"
  image?: string
}

export interface StockMetricData {
  label: string
  value: string | number
  subValue?: string
  trend?: "up" | "down" | "neutral"
  description?: string
}

export interface StockSummary {
  symbol: string
  summary: string
  sentiment: "bullish" | "bearish" | "neutral"
  keyFactors: string[]
  riskFactors?: string[]
  lastUpdated: Date
}

export interface WatchlistItem {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  addedAt: Date
  notes?: string
}

export interface PriceAlert {
  id: string
  symbol: string
  targetPrice: number
  condition: "above" | "below"
  createdAt: Date
  triggered: boolean
}

export interface MarketStatus {
  isOpen: boolean
  nextOpen?: Date
  nextClose?: Date
  timezone: string
}
