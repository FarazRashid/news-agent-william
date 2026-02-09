"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Star,
  Columns3,
  CheckSquare,
  Square,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Header from "@/components/header"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  getWatchlist,
  addSymbolToWatchlist,
  removeSymbolFromWatchlist,
} from "@/lib/stocks/watchlist"
import { fetchStockData } from "@/lib/stocks/api"
import type { StockData } from "@/lib/stocks/types"
import { StockComparisonTable } from "@/components/stocks/stock-comparison-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type SymbolSuggestion = {
  symbol: string
  name?: string
}

type WatchlistItem = {
  symbol: string
  addedAt: Date
}

type WatchlistStockData = {
  symbol: string
  name: string
  price: number
  change: number
  logoUrl?: string
}

const POPULAR_SYMBOLS: SymbolSuggestion[] = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "NVDA", name: "NVIDIA Corporation" },
  { symbol: "META", name: "Meta Platforms Inc." },
  { symbol: "NFLX", name: "Netflix Inc." },
]

// Mock function to get basic stock info - in production, use real API
const getStockInfo = (symbol: string): { name: string; price: number; change: number; logoUrl?: string } => {
  const mockData: Record<string, { name: string; price: number; change: number; logoUrl?: string }> = {
    AAPL: { 
      name: "Apple Inc.", 
      price: 178.32, 
      change: 2.45,
      logoUrl: "https://logo.clearbit.com/apple.com"
    },
    MSFT: { 
      name: "Microsoft Corporation", 
      price: 412.76, 
      change: -1.23,
      logoUrl: "https://logo.clearbit.com/microsoft.com"
    },
    GOOGL: { 
      name: "Alphabet Inc.", 
      price: 142.89, 
      change: 0.87,
      logoUrl: "https://logo.clearbit.com/google.com"
    },
    AMZN: { 
      name: "Amazon.com Inc.", 
      price: 168.54, 
      change: 3.21,
      logoUrl: "https://logo.clearbit.com/amazon.com"
    },
    TSLA: { 
      name: "Tesla Inc.", 
      price: 248.92, 
      change: -2.67,
      logoUrl: "https://logo.clearbit.com/tesla.com"
    },
    NVDA: { 
      name: "NVIDIA Corporation", 
      price: 485.23, 
      change: 5.43,
      logoUrl: "https://logo.clearbit.com/nvidia.com"
    },
    META: { 
      name: "Meta Platforms Inc.", 
      price: 489.12, 
      change: 1.98,
      logoUrl: "https://logo.clearbit.com/meta.com"
    },
    NFLX: { 
      name: "Netflix Inc.", 
      price: 594.38, 
      change: -0.54,
      logoUrl: "https://logo.clearbit.com/netflix.com"
    },
  }

  return mockData[symbol] || { name: symbol, price: 0, change: 0 }
}

const loadWatchlistFromSession = (): WatchlistItem[] => {
  return getWatchlist().map((item) => ({
    symbol: item.symbol,
    addedAt: new Date(item.addedAt),
  }))
}

export default function StockWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [newSymbol, setNewSymbol] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])
  const [compareStocks, setCompareStocks] = useState<StockData[]>([])
  const [compareLoading, setCompareLoading] = useState(false)
  const [compareError, setCompareError] = useState<string | null>(null)
  const [allSymbolSuggestions, setAllSymbolSuggestions] = useState<
    SymbolSuggestion[]
  >([])
  const [filteredSymbolSuggestions, setFilteredSymbolSuggestions] = useState<
    SymbolSuggestion[]
  >([])

  // Load watchlist from session storage on mount
  useEffect(() => {
    setWatchlist(loadWatchlistFromSession())
  }, [])

  // Seed suggestions with popular symbols + anything in the user's watchlist
  useEffect(() => {
    const fromWatchlist = getWatchlist().map<SymbolSuggestion>((item) => ({
      symbol: item.symbol,
    }))

    const merged = new Map<string, SymbolSuggestion>()
    for (const entry of [...POPULAR_SYMBOLS, ...fromWatchlist]) {
      const upper = entry.symbol.toUpperCase()
      if (!merged.has(upper)) {
        merged.set(upper, { symbol: upper, name: entry.name })
      }
    }

    const suggestions = Array.from(merged.values())
    setAllSymbolSuggestions(suggestions)
    setFilteredSymbolSuggestions([])
  }, [])

  const refreshWatchlist = () => {
    setWatchlist(loadWatchlistFromSession())
  }

  const handleNewSymbolChange = (value: string) => {
    setNewSymbol(value)

    const query = value.trim()
    if (!query) {
      setFilteredSymbolSuggestions([])
      return
    }

    const upperQuery = query.toUpperCase()
    const lowerQuery = query.toLowerCase()

    const base = allSymbolSuggestions.length
      ? allSymbolSuggestions
      : POPULAR_SYMBOLS

    const filtered = base
      .filter(
        (entry) =>
          entry.symbol.toUpperCase().startsWith(upperQuery) ||
          entry.symbol.toUpperCase().includes(upperQuery) ||
          (entry.name && entry.name.toLowerCase().includes(lowerQuery)),
      )
      .slice(0, 8)

    setFilteredSymbolSuggestions(filtered)
  }

  const addStock = (e: React.FormEvent) => {
    e.preventDefault()
    const symbol = newSymbol.trim().toUpperCase()
    if (!symbol) return

    addSymbolToWatchlist(symbol)
    refreshWatchlist()
    setNewSymbol("")
    setFilteredSymbolSuggestions([])
    setIsAdding(false)
  }

  const removeStock = (symbol: string) => {
    removeSymbolFromWatchlist(symbol)
    refreshWatchlist()
  }

  const toggleSelected = (symbol: string) => {
    setSelectedForCompare((prev) => {
      const exists = prev.includes(symbol)
      const next = exists ? prev.filter((s) => s !== symbol) : [...prev, symbol]

      setCompareStocks((prevStocks) =>
        prevStocks.filter((stock) => next.includes(stock.symbol)),
      )

      return next
    })
  }

  const loadComparisonData = async () => {
    const symbols = Array.from(
      new Set(selectedForCompare.map((s) => s.toUpperCase())),
    )
    if (symbols.length < 2) {
      setCompareError("Select at least two stocks to compare.")
      return
    }

    try {
      setCompareLoading(true)
      setCompareError(null)
      const data = await Promise.all(
        symbols.map((symbol) => fetchStockData(symbol)),
      )
      setCompareStocks(data)
    } catch (err: any) {
      console.error("Failed to load comparison data:", err)
      setCompareStocks([])
      setCompareError(
        err.message || "Unable to load comparison data for selected stocks.",
      )
    } finally {
      setCompareLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto padding-responsive py-6 fold:py-8">
        {/* Header */}
        <div className="mb-6 fold:mb-8">
          <div className="flex items-center justify-between mb-2 gap-4">
            <div className="flex items-center gap-3">
              <Star className="h-6 w-6 fold:h-8 fold:w-8 text-primary" />
              <h1 className="text-2xl fold:text-3xl ipad:text-4xl font-bold">My Watchlist</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-md border border-border p-0.5">
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  className="px-3 text-xs"
                  onClick={() => setViewMode("grid")}
                >
                  Grid
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === "list" ? "default" : "ghost"}
                  className="px-3 text-xs"
                  onClick={() => setViewMode("list")}
                >
                  List
                </Button>
              </div>
              <Button
                onClick={() => setIsAdding(!isAdding)}
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden fold:inline">Add Stock</span>
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground">
            Track your favorite stocks and monitor their performance
          </p>
        </div>

        {/* Add Stock Form */}
        {isAdding && (
          <Card className="p-4 mb-6">
            <form onSubmit={addStock} className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search or enter symbol (e.g., AAPL)"
                  value={newSymbol}
                  onChange={(e) => handleNewSymbolChange(e.target.value)}
                  className="w-full"
                  autoFocus
                />
                {newSymbol.trim() && filteredSymbolSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-y-auto rounded-md border border-border bg-popover text-xs sm:text-sm shadow-lg">
                    {filteredSymbolSuggestions.map((sugg) => (
                      <button
                        key={sugg.symbol}
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground"
                        onClick={() => {
                          setNewSymbol(sugg.symbol)
                          setFilteredSymbolSuggestions([])
                        }}
                      >
                        <div className="min-w-0">
                          <span className="font-semibold">{sugg.symbol}</span>
                          {sugg.name && (
                            <span className="ml-2 text-muted-foreground truncate">
                              {sugg.name}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button type="submit" disabled={!newSymbol.trim()}>
                Add
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAdding(false)
                  setNewSymbol("")
                }}
              >
                Cancel
              </Button>
            </form>
          </Card>
        )}

        {/* Watchlist */}
        {watchlist.length === 0 ? (
          <Card className="p-12 text-center">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Your watchlist is empty</h3>
            <p className="text-muted-foreground mb-6">
              Add stocks to track their performance and stay updated
            </p>
            <Button onClick={() => setIsAdding(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Stock
            </Button>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 fold:grid-cols-2 ipad:grid-cols-2 trifold:grid-cols-3 gap-4">
            {watchlist.map(({ symbol }) => {
              const info = getStockInfo(symbol)
              const isPositive = info.change >= 0
              const isSelected = selectedForCompare.includes(symbol)

              return (
                <Card key={symbol} className="p-4 fold:p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <Link href={`/stocks/${symbol}`} className="flex items-start gap-3 flex-1 min-w-0">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage
                          src={info.logoUrl}
                          alt={`${info.name} logo`}
                        />
                        <AvatarFallback className="text-xs font-semibold">
                          {symbol.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg fold:text-xl hover:text-primary transition-colors">
                          {symbol}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {info.name}
                        </p>
                      </div>
                    </Link>
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="xs"
                      className="ml-2 gap-1 rounded-full px-2 py-1 text-[11px]"
                      onClick={() => toggleSelected(symbol)}
                    >
                      <Columns3 className="h-3 w-3" />
                      {isSelected ? "Selected" : "Compare"}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 -mt-1 -mr-1"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove from watchlist?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove {symbol} from your watchlist.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeStock(symbol)}>
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl fold:text-3xl font-bold">
                        ${info.price.toFixed(2)}
                      </span>
                    </div>
                    <Badge
                      variant={isPositive ? "default" : "destructive"}
                      className="gap-1"
                    >
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {isPositive ? "+" : ""}
                      {info.change.toFixed(2)}%
                    </Badge>
                  </div>

                  <Link href={`/stocks/${symbol}`}>
                    <Button variant="outline" className="w-full mt-4" size="sm">
                      View Details
                    </Button>
                  </Link>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {watchlist.map(({ symbol }) => {
              const info = getStockInfo(symbol)
              const isPositive = info.change >= 0
              const isSelected = selectedForCompare.includes(symbol)

              return (
                <Card key={symbol} className="p-3 fold:p-4 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage
                          src={info.logoUrl}
                          alt={`${info.name} logo`}
                        />
                        <AvatarFallback className="text-xs font-semibold">
                          {symbol.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <Link href={`/stocks/${symbol}`} className="min-w-0">
                        <div className="flex items-baseline gap-2">
                          <h3 className="font-semibold text-base fold:text-lg hover:text-primary transition-colors">
                            {symbol}
                          </h3>
                        </div>
                        <p className="text-xs fold:text-sm text-muted-foreground truncate">
                          {info.name}
                        </p>
                      </Link>
                      <div className="hidden fold:flex flex-col items-start gap-1">
                        <span className="text-base fold:text-lg font-semibold">
                          ${info.price.toFixed(2)}
                        </span>
                        <Badge
                          variant={isPositive ? "default" : "destructive"}
                          className="gap-1"
                        >
                          {isPositive ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {isPositive ? "+" : ""}
                          {info.change.toFixed(2)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-end gap-1 fold:hidden">
                        <span className="text-sm font-semibold">
                          ${info.price.toFixed(2)}
                        </span>
                        <Badge
                          variant={isPositive ? "default" : "destructive"}
                          className="gap-1"
                        >
                          {isPositive ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {isPositive ? "+" : ""}
                          {info.change.toFixed(2)}%
                        </Badge>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove from watchlist?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove {symbol} from your watchlist.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeStock(symbol)}>
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Link href={`/stocks/${symbol}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className="ml-1 gap-1 rounded-full px-2 py-1 text-xs"
                        onClick={() => toggleSelected(symbol)}
                      >
                        <Columns3 className="h-3 w-3" />
                        {isSelected ? "Selected" : "Compare"}
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Comparison toolbar & table */}
        {watchlist.length > 0 && (
          <div className="mt-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-bold text-base sm:text-lg">Compare watchlist stocks</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Select at least two symbols above, then generate an interactive side-by-side view.
                </p>
              </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {selectedForCompare.length} selected
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (selectedForCompare.length === watchlist.length) {
                    setSelectedForCompare([])
                    setCompareStocks([])
                    setCompareError(null)
                  } else {
                    setSelectedForCompare(watchlist.map((w) => w.symbol))
                  }
                }}
                className="gap-1"
              >
                {selectedForCompare.length === watchlist.length ? (
                  <>
                    <CheckSquare className="h-3 w-3" />
                    Deselect all
                  </>
                ) : (
                  <>
                    <Square className="h-3 w-3" />
                    Select all
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="default"
                disabled={compareLoading || selectedForCompare.length < 2}
                onClick={loadComparisonData}
              >
                {compareLoading ? "Loading comparison..." : "Compare Selected"}
              </Button>
              {selectedForCompare.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedForCompare([])
                    setCompareStocks([])
                    setCompareError(null)
                  }}
                >
                  Clear Selection
                </Button>
              )}
            </div>
            </div>
            {compareError && (
              <p className="text-xs sm:text-sm text-destructive">{compareError}</p>
            )}
            {compareStocks.length >= 2 && (
              <StockComparisonTable
                stocks={compareStocks}
                title="Watchlist comparison"
              />
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 p-6 bg-muted/50 rounded-lg">
          <h3 className="font-bold mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Link href="/stocks/market">
              <Button variant="outline" size="sm">
                View Market Overview
              </Button>
            </Link>
            <Link href="/feed">
              <Button variant="outline" size="sm">
                Browse Financial News
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

