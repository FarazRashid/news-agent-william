"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StockHeader } from "@/components/stocks/stock-header"
import { StockChart } from "@/components/stocks/stock-chart"
import { StockMetrics } from "@/components/stocks/stock-metrics"
import { StockAISummary } from "@/components/stocks/stock-ai-summary"
import { StockNewsFeed } from "@/components/stocks/stock-news-feed"
import { StockOwnership } from "@/components/stocks/stock-ownership"
import { StockPageSkeleton } from "@/components/stocks/stock-page-skeleton"
import { fetchStockData, fetchStockSummary } from "@/lib/stocks/api"
import { generateStockMetrics } from "@/lib/stocks/utils"
import type { StockData, StockSummary } from "@/lib/stocks/types"

interface StockPageClientProps {
  symbol: string
}

export function StockPageClient({ symbol }: StockPageClientProps) {
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [summary, setSummary] = useState<StockSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isWatchlisted, setIsWatchlisted] = useState(false)

  useEffect(() => {
    const loadStockData = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchStockData(symbol)
        const summaryData = await fetchStockSummary(symbol, data)

        setStockData(data)
        setSummary(summaryData)
      } catch (err: any) {
        console.error("Error loading stock data:", err)
        setError(err.message || "Failed to load stock data")
      } finally {
        setLoading(false)
      }
    }

    loadStockData()
  }, [symbol])

  useEffect(() => {
    if (!stockData || !summary) return

    const isStale = Date.now() - summary.lastUpdated.getTime() > 8 * 60 * 60 * 1000
    if (!isStale) return

    const BASE_DELAY_MS = 30000
    const MAX_DELAY_MS = 5 * 60 * 1000
    const MAX_ATTEMPTS = 5
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let attempts = 0

    const scheduleNext = (delay: number) => {
      if (cancelled) return
      timeoutId = setTimeout(() => {
        void poll()
      }, delay)
    }

    const poll = async () => {
      attempts += 1

      try {
        const updated = await fetchStockSummary(symbol, stockData)
        if (cancelled) return
        setSummary(updated)

        const updatedIsStale = Date.now() - updated.lastUpdated.getTime() > 8 * 60 * 60 * 1000
        if (!updatedIsStale) return
      } catch {
        // keep trying on transient errors
      }

      if (attempts >= MAX_ATTEMPTS) return
      const nextDelay = Math.min(BASE_DELAY_MS * 2 ** (attempts - 1), MAX_DELAY_MS)
      scheduleNext(nextDelay)
    }

    void poll()

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [symbol, stockData, summary?.lastUpdated?.getTime()])

  const handleToggleWatchlist = () => {
    setIsWatchlisted(!isWatchlisted)
    // TODO: Implement actual watchlist functionality with database
    console.log(`${isWatchlisted ? "Removed from" : "Added to"} watchlist:`, symbol)
  }

  const handleShare = () => {
    // Implement share functionality
    if (navigator.share && stockData) {
      navigator
        .share({
          title: `${stockData.symbol} - ${stockData.name}`,
          text: `Check out ${stockData.symbol} stock - $${stockData.price} (${stockData.changePercent >= 0 ? "+" : ""}${stockData.changePercent.toFixed(2)}%)`,
          url: window.location.href,
        })
        .catch((err) => console.error("Error sharing:", err))
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      console.log("Link copied to clipboard!")
    }
  }

  const handleSetAlert = () => {
    // TODO: Implement price alert functionality
    console.log("Set price alert for:", symbol)
  }

  if (loading) {
    return <StockPageSkeleton />
  }

  if (error || !stockData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">
            {error ? "Error Loading Stock" : "Stock Not Found"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {error || `Unable to find stock data for symbol: ${symbol.toUpperCase()}`}
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const metrics = generateStockMetrics(stockData)
  const isSummaryStale = summary
    ? Date.now() - new Date(summary.lastUpdated).getTime() > 8 * 60 * 60 * 1000
    : false

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="border-b border-border">
        <div className="container mx-auto padding-responsive py-3 sm:py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto padding-responsive py-6 sm:py-8 md:py-10">
        {/* Stock Header */}
        <StockHeader
          symbol={stockData.symbol}
          name={stockData.name}
          price={stockData.price}
          change={stockData.change}
          changePercent={stockData.changePercent}
          logoUrl={stockData.logoUrl}
          exchange={stockData.exchange}
          isWatchlisted={isWatchlisted}
          onToggleWatchlist={handleToggleWatchlist}
          onShare={handleShare}
          onSetAlert={handleSetAlert}
        />

        {/* Two-Column Layout: Chart + Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Left Column: Chart & About (2/3 width on larger screens) */}
          <div className="md:col-span-2 space-y-4 sm:space-y-6">
            <StockChart symbol={stockData.symbol} currentPrice={stockData.price} />

            <StockOwnership symbol={stockData.symbol} />
            
            {/* Company Info Section */}
            {stockData.description && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                  About {stockData.name}
                </h2>
                <div className="bg-card border border-border rounded-lg p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
                  <p className="text-sm sm:text-base text-foreground leading-relaxed">
                    {stockData.description}
                  </p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-border">
                    {stockData.sector && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Sector</p>
                        <p className="text-sm sm:text-base font-medium">{stockData.sector}</p>
                      </div>
                    )}
                    {stockData.industry && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Industry</p>
                        <p className="text-sm sm:text-base font-medium">{stockData.industry}</p>
                      </div>
                    )}
                    {stockData.ceo && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">CEO</p>
                        <p className="text-sm sm:text-base font-medium">{stockData.ceo}</p>
                      </div>
                    )}
                    {stockData.employees && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Employees</p>
                        <p className="text-sm sm:text-base font-medium">
                          {stockData.employees.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {stockData.founded && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Founded</p>
                        <p className="text-sm sm:text-base font-medium">{stockData.founded}</p>
                      </div>
                    )}
                    {stockData.website && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Website</p>
                        <a
                          href={stockData.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm sm:text-base font-medium text-primary hover:underline"
                        >
                          Visit Site
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: AI Summary & Metrics Sidebar (1/3 width on larger screens) */}
          <div className="md:col-span-1 space-y-4 sm:space-y-6">
            {summary && <StockAISummary summary={summary} isUpdating={isSummaryStale} />}
            <StockMetrics metrics={metrics} />
          </div>
        </div>

        {/* News Section */}
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">
            Latest News for {stockData.symbol}
          </h2>
          <StockNewsFeed symbol={stockData.symbol} companyName={stockData.name} limit={4} />
        </div>
      </div>
    </div>
  )
}
