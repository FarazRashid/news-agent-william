"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { TrendingUp, TrendingDown, Plus, Trash2, Star } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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

type WatchlistStock = {
  symbol: string
  addedAt: Date
}

// Mock function to get basic stock info - in production, use real API
const getStockInfo = (symbol: string) => {
  const mockData: Record<string, { name: string; price: number; change: number }> = {
    AAPL: { name: "Apple Inc.", price: 178.32, change: 2.45 },
    MSFT: { name: "Microsoft Corporation", price: 412.76, change: -1.23 },
    GOOGL: { name: "Alphabet Inc.", price: 142.89, change: 0.87 },
    AMZN: { name: "Amazon.com Inc.", price: 168.54, change: 3.21 },
    TSLA: { name: "Tesla Inc.", price: 248.92, change: -2.67 },
    NVDA: { name: "NVIDIA Corporation", price: 485.23, change: 5.43 },
    META: { name: "Meta Platforms Inc.", price: 489.12, change: 1.98 },
    NFLX: { name: "Netflix Inc.", price: 594.38, change: -0.54 },
  }
  
  return mockData[symbol] || { name: symbol, price: 0, change: 0 }
}

export default function StockWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>([])
  const [newSymbol, setNewSymbol] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  // Load watchlist from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("stock-watchlist")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setWatchlist(parsed.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt),
        })))
      } catch (e) {
        console.error("Failed to load watchlist")
      }
    }
  }, [])

  // Save watchlist to localStorage
  const saveWatchlist = (newWatchlist: WatchlistStock[]) => {
    setWatchlist(newWatchlist)
    localStorage.setItem("stock-watchlist", JSON.stringify(newWatchlist))
  }

  const addStock = (e: React.FormEvent) => {
    e.preventDefault()
    const symbol = newSymbol.trim().toUpperCase()
    if (symbol && !watchlist.find((s) => s.symbol === symbol)) {
      saveWatchlist([...watchlist, { symbol, addedAt: new Date() }])
      setNewSymbol("")
      setIsAdding(false)
    }
  }

  const removeStock = (symbol: string) => {
    saveWatchlist(watchlist.filter((s) => s.symbol !== symbol))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto padding-responsive py-6 fold:py-8">
        {/* Header */}
        <div className="mb-6 fold:mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Star className="h-6 w-6 fold:h-8 fold:w-8 text-primary" />
              <h1 className="text-2xl fold:text-3xl ipad:text-4xl font-bold">My Watchlist</h1>
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
          <p className="text-muted-foreground">
            Track your favorite stocks and monitor their performance
          </p>
        </div>

        {/* Add Stock Form */}
        {isAdding && (
          <Card className="p-4 mb-6">
            <form onSubmit={addStock} className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter stock symbol (e.g., AAPL)"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                className="flex-1"
                autoFocus
              />
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
        ) : (
          <div className="grid grid-cols-1 fold:grid-cols-2 ipad:grid-cols-2 trifold:grid-cols-3 gap-4">
            {watchlist.map(({ symbol }) => {
              const info = getStockInfo(symbol)
              const isPositive = info.change >= 0

              return (
                <Card key={symbol} className="p-4 fold:p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <Link href={`/stocks/${symbol}`} className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg fold:text-xl hover:text-primary transition-colors">
                        {symbol}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {info.name}
                      </p>
                    </Link>
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

