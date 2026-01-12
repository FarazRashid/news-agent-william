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
        // Fetch stock data and summary in parallel
        const [data, summaryData] = await Promise.all([
          fetchStockData(symbol),
          fetchStockData(symbol).then((data) => fetchStockSummary(symbol, data)),
        ])

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

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="border-b border-border">
        <div className="container mx-auto padding-responsive py-3 fold:py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden fold:inline">Back to Home</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto padding-responsive py-6 fold:py-8 ipad:py-10">
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
        <div className="grid grid-cols-1 ipad:grid-cols-3 gap-4 fold:gap-6 mb-6 fold:mb-8">
          {/* Left Column: Chart (2/3 width on larger screens) */}
          <div className="ipad:col-span-2 space-y-4 fold:space-y-6">
            <StockChart symbol={stockData.symbol} currentPrice={stockData.price} />
            {summary && <StockAISummary summary={summary} />}
          </div>

          {/* Right Column: Metrics Sidebar (1/3 width on larger screens) */}
          <div className="ipad:col-span-1">
            <StockMetrics metrics={metrics} />
          </div>
        </div>

        {/* Company Info Section */}
        {stockData.description && (
          <div className="mb-6 fold:mb-8">
            <h2 className="text-xl fold:text-2xl ipad:text-3xl font-bold mb-3 fold:mb-4">
              About {stockData.name}
            </h2>
            <div className="bg-card border border-border rounded-lg p-4 fold:p-5 ipad:p-6 space-y-3 fold:space-y-4">
              <p className="text-sm fold:text-base text-foreground leading-relaxed">
                {stockData.description}
              </p>
              
              <div className="grid grid-cols-2 fold:grid-cols-3 gap-3 fold:gap-4 pt-3 fold:pt-4 border-t border-border">
                {stockData.sector && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Sector</p>
                    <p className="text-sm fold:text-base font-medium">{stockData.sector}</p>
                  </div>
                )}
                {stockData.industry && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Industry</p>
                    <p className="text-sm fold:text-base font-medium">{stockData.industry}</p>
                  </div>
                )}
                {stockData.ceo && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">CEO</p>
                    <p className="text-sm fold:text-base font-medium">{stockData.ceo}</p>
                  </div>
                )}
                {stockData.employees && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Employees</p>
                    <p className="text-sm fold:text-base font-medium">
                      {stockData.employees.toLocaleString()}
                    </p>
                  </div>
                )}
                {stockData.founded && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Founded</p>
                    <p className="text-sm fold:text-base font-medium">{stockData.founded}</p>
                  </div>
                )}
                {stockData.website && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Website</p>
                    <a
                      href={stockData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm fold:text-base font-medium text-primary hover:underline"
                    >
                      Visit Site
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* News Section */}
        <div>
          <h2 className="text-xl fold:text-2xl ipad:text-3xl font-bold mb-4 fold:mb-6">
            Latest News for {stockData.symbol}
          </h2>
          <StockNewsFeed symbol={stockData.symbol} companyName={stockData.name} limit={10} />
        </div>
      </div>
    </div>
  )
}
