"use client"

import { useState } from "react"
import { Search, TrendingUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Popular stock symbols for quick access
const POPULAR_STOCKS = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "META", name: "Meta" },
  { symbol: "NFLX", name: "Netflix" },
]

export default function StockSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const symbol = searchQuery.trim().toUpperCase()
      router.push(`/stocks/${symbol}`)
      setSearchQuery("")
    }
  }

  const filteredStocks = POPULAR_STOCKS.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Card className="p-4 fold:p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-lg">Search Stocks</h3>
      </div>

      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Enter stock symbol (e.g., AAPL)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" disabled={!searchQuery.trim()}>
            Search
          </Button>
        </div>
      </form>

      <div>
        <p className="text-sm text-muted-foreground mb-3">
          {searchQuery ? "Matching stocks:" : "Popular stocks:"}
        </p>
        <div className="grid grid-cols-2 fold:grid-cols-4 gap-2">
          {(searchQuery ? filteredStocks : POPULAR_STOCKS).map((stock) => (
            <Link
              key={stock.symbol}
              href={`/stocks/${stock.symbol}`}
              className="flex flex-col gap-1 p-3 rounded-lg border border-border hover:bg-accent hover:border-primary transition-all group"
            >
              <span className="font-bold text-sm group-hover:text-primary">
                {stock.symbol}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {stock.name}
              </span>
            </Link>
          ))}
        </div>
        {searchQuery && filteredStocks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No matches found. Press Search to look up &quot;{searchQuery.toUpperCase()}&quot;
          </p>
        )}
      </div>
    </Card>
  )
}

