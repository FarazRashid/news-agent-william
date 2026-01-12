"use client"

import { useState } from "react"
import Link from "next/link"
import { TrendingUp, TrendingDown, Activity, Star } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

// Mock data - in production, fetch from real market API
const INDICES = [
  { symbol: "^GSPC", name: "S&P 500", value: 4783.45, change: 0.82, changeValue: 38.76 },
  { symbol: "^DJI", name: "Dow Jones", value: 37248.35, change: 0.45, changeValue: 165.32 },
  { symbol: "^IXIC", name: "NASDAQ", value: 15120.23, change: 1.24, changeValue: 185.12 },
  { symbol: "^RUT", name: "Russell 2000", value: 2098.54, change: -0.34, changeValue: -7.23 },
]

const TOP_GAINERS = [
  { symbol: "NVDA", name: "NVIDIA Corporation", price: 485.23, change: 5.43, volume: "48.2M" },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.92, change: 4.67, volume: "112.5M" },
  { symbol: "AMD", name: "Advanced Micro Devices", price: 178.34, change: 3.89, volume: "62.1M" },
  { symbol: "META", name: "Meta Platforms Inc.", price: 489.12, change: 3.21, volume: "28.4M" },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 168.54, change: 2.98, volume: "45.6M" },
]

const TOP_LOSERS = [
  { symbol: "NFLX", name: "Netflix Inc.", price: 594.38, change: -3.54, volume: "8.2M" },
  { symbol: "PYPL", name: "PayPal Holdings", price: 62.45, change: -2.87, volume: "15.3M" },
  { symbol: "INTC", name: "Intel Corporation", price: 43.21, change: -2.45, volume: "52.1M" },
  { symbol: "DIS", name: "Walt Disney Co.", price: 91.76, change: -1.98, volume: "12.4M" },
  { symbol: "BA", name: "Boeing Co.", price: 258.92, change: -1.67, volume: "6.8M" },
]

const MOST_ACTIVE = [
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.92, change: 4.67, volume: "112.5M" },
  { symbol: "AAPL", name: "Apple Inc.", price: 178.32, change: 2.45, volume: "89.3M" },
  { symbol: "NVDA", name: "NVIDIA Corporation", price: 485.23, change: 5.43, volume: "48.2M" },
  { symbol: "AMD", name: "Advanced Micro Devices", price: 178.34, change: 3.89, volume: "62.1M" },
  { symbol: "INTC", name: "Intel Corporation", price: 43.21, change: -2.45, volume: "52.1M" },
]

const TRENDING = [
  { symbol: "PLTR", name: "Palantir Technologies", price: 24.56, change: 8.92, volume: "45.6M" },
  { symbol: "SOFI", name: "SoFi Technologies", price: 9.87, change: 6.23, volume: "78.2M" },
  { symbol: "RIVN", name: "Rivian Automotive", price: 18.45, change: -4.56, volume: "34.8M" },
  { symbol: "NIO", name: "NIO Inc.", price: 7.23, change: 5.67, volume: "98.4M" },
  { symbol: "COIN", name: "Coinbase Global", price: 145.32, change: 3.45, volume: "12.6M" },
]

type StockListProps = {
  stocks: typeof TOP_GAINERS
}

function StockList({ stocks }: StockListProps) {
  return (
    <div className="space-y-3">
      {stocks.map((stock) => {
        const isPositive = stock.change >= 0
        return (
          <Link
            key={stock.symbol}
            href={`/stocks/${stock.symbol}`}
            className="block"
          >
            <Card className="p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold hover:text-primary transition-colors">
                      {stock.symbol}
                    </h3>
                    <Badge
                      variant={isPositive ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {isPositive ? "+" : ""}
                      {stock.change.toFixed(2)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {stock.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vol: {stock.volume}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    ${stock.price.toFixed(2)}
                  </div>
                  <div
                    className={`text-sm flex items-center justify-end gap-1 ${
                      isPositive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

export default function MarketOverview() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto padding-responsive py-6 fold:py-8">
        {/* Header */}
        <div className="mb-6 fold:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-6 w-6 fold:h-8 fold:w-8 text-primary" />
            <h1 className="text-2xl fold:text-3xl ipad:text-4xl font-bold">Market Overview</h1>
          </div>
          <p className="text-muted-foreground">
            Track market indices and discover top movers
          </p>
        </div>

        {/* Market Indices */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Major Indices</h2>
          <div className="grid grid-cols-1 fold:grid-cols-2 ipad:grid-cols-4 gap-4">
            {INDICES.map((index) => {
              const isPositive = index.change >= 0
              return (
                <Card key={index.symbol} className="p-4">
                  <h3 className="font-bold text-sm text-muted-foreground mb-2">
                    {index.name}
                  </h3>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">
                      {index.value.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={isPositive ? "default" : "destructive"}
                        className="text-xs gap-1"
                      >
                        {isPositive ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {isPositive ? "+" : ""}
                        {index.change.toFixed(2)}%
                      </Badge>
                      <span
                        className={`text-sm ${
                          isPositive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {index.changeValue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Market Movers */}
        <Tabs defaultValue="gainers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 fold:grid-cols-4">
            <TabsTrigger value="gainers">Top Gainers</TabsTrigger>
            <TabsTrigger value="losers">Top Losers</TabsTrigger>
            <TabsTrigger value="active">Most Active</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>

          <TabsContent value="gainers">
            <StockList stocks={TOP_GAINERS} />
          </TabsContent>

          <TabsContent value="losers">
            <StockList stocks={TOP_LOSERS} />
          </TabsContent>

          <TabsContent value="active">
            <StockList stocks={MOST_ACTIVE} />
          </TabsContent>

          <TabsContent value="trending">
            <StockList stocks={TRENDING} />
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="mt-8 p-6 bg-muted/50 rounded-lg">
          <h3 className="font-bold mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Link href="/stocks/watchlist">
              <Button variant="outline" size="sm" className="gap-2">
                <Star className="h-4 w-4" />
                View Watchlist
              </Button>
            </Link>
            <Link href="/feed">
              <Button variant="outline" size="sm">
                Browse Financial News
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm">
                Explore Topics
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

