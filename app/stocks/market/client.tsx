"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { TrendingUp, TrendingDown, Activity, Star } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"

type IndexData = {
  symbol: string
  name: string
  value: number
  change: number
  changeValue: number
}

type StockData = {
  symbol: string
  name: string
  price: number
  change: number
  changeValue: number
  volume: string
}

type DashboardData = {
  gainers: StockData[]
  losers: StockData[]
  active: StockData[]
  trending: StockData[]
}

type StockListProps = {
  stocks: StockData[]
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
                    {isPositive ? "+" : ""}
                    {stock.changeValue.toFixed(2)}
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
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    gainers: [],
    losers: [],
    active: [],
    trending: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [indices, setIndices] = useState<IndexData[]>([])
  const [indicesLoading, setIndicesLoading] = useState(true)
  const [indicesError, setIndicesError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)
        const response = await fetch('/api/stocks/dashboard')
        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.status}`)
        }
        const data = await response.json()
        setDashboardData(data)
      } catch (err: any) {
        console.error("Error loading dashboard:", err)
        setError(err.message || "Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        setIndicesLoading(true)
        setIndicesError(null)
        const response = await fetch("/api/stocks/indices")
        if (!response.ok) {
          throw new Error(`Failed to fetch indices: ${response.status}`)
        }
        const data = await response.json()
        setIndices(data)
      } catch (err: any) {
        console.error("Error loading indices:", err)
        setIndicesError(err.message || "Failed to load indices")
      } finally {
        setIndicesLoading(false)
      }
    }

    fetchIndices()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto padding-responsive py-6 fold:py-8">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="h-6 w-6 fold:h-8 fold:w-8 text-primary animate-pulse" />
            <h1 className="text-2xl fold:text-3xl ipad:text-4xl font-bold">Loading Market Data...</h1>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto padding-responsive py-6 fold:py-8">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="h-6 w-6 fold:h-8 fold:w-8 text-primary" />
            <h1 className="text-2xl fold:text-3xl ipad:text-4xl font-bold">Market Overview</h1>
          </div>
          <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
            <p className="text-red-800">Failed to load market data: {error}</p>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-background">
      <Header />
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
          {indicesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-6">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-8 bg-muted rounded w-32"></div>
                    <div className="h-4 bg-muted rounded w-20"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : indicesError ? (
            <Card className="p-6">
              <div className="text-center text-muted-foreground">
                <p className="mb-2">Unable to load market indices</p>
                <p className="text-sm">{indicesError}</p>
              </div>
            </Card>
          ) : indices.length === 0 ? (
            <Card className="p-6">
              <div className="text-center text-muted-foreground">
                <p>No index data available</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {indices.map((index: IndexData) => {
                const isPositive = index.change >= 0
                return (
                  <Card key={index.symbol} className="p-6 hover:shadow-lg transition-all">
                    <h3 className="font-bold text-sm text-muted-foreground mb-3">
                      {index.name}
                    </h3>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">
                        {index.value.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
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
          )}
        </div>

        {/* Market Movers */}
        <Tabs defaultValue="gainers" className="space-y-6">
          <TabsList className="w-full flex flex-wrap sm:flex-nowrap gap-1 bg-muted p-1 rounded-xl overflow-x-auto border border-border/50">
            <TabsTrigger
              value="gainers"
              className="flex-1 min-w-[8.5rem] rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-background/60 hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border"
            >
              Top Gainers
            </TabsTrigger>
            <TabsTrigger
              value="losers"
              className="flex-1 min-w-[8.5rem] rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-background/60 hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border"
            >
              Top Losers
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="flex-1 min-w-[8.5rem] rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-background/60 hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border"
            >
              Most Active
            </TabsTrigger>
            <TabsTrigger
              value="trending"
              className="flex-1 min-w-[8.5rem] rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-background/60 hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border"
            >
              Trending
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gainers">
            <StockList stocks={dashboardData.gainers} />
          </TabsContent>

          <TabsContent value="losers">
            <StockList stocks={dashboardData.losers} />
          </TabsContent>

          <TabsContent value="active">
            <StockList stocks={dashboardData.active} />
          </TabsContent>

          <TabsContent value="trending">
            <StockList stocks={dashboardData.trending} />
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

