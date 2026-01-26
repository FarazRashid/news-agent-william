"use client"

import { useState, useEffect } from "react"
import { Search, TrendingUp, TrendingDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

type StockData = {
  symbol: string
  name: string
  price: number
  change: number
  changeValue: number
}

type SearchResult = {
  symbol: string
  name: string
  price?: number
  change?: number
  changeValue?: number
  isCustom?: boolean
}

export default function StockSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [stockData, setStockData] = useState<Record<string, StockData>>({})
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const router = useRouter()

  // Fetch stock data for popular stocks
  useEffect(() => {
    async function fetchStockData() {
      try {
        setLoading(true)
        const response = await fetch(`/api/stocks/dashboard`, { cache: "no-store" })
        if (response.ok) {
          const data = await response.json()
          // Combine all stocks from all categories into a single lookup
          const allStocks = [
            ...data.gainers,
            ...data.losers, 
            ...data.active,
            ...data.trending,
            ...(data.popular || []),
          ]
          const stockMap = allStocks.reduce((acc, stock) => {
            acc[stock.symbol] = stock
            return acc
          }, {} as Record<string, StockData>)
          setStockData(stockMap)
        }
      } catch (error) {
        console.error('Failed to fetch stock data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStockData()
  }, [])

  // Fetch data for custom search
  const fetchCustomStock = async (symbol: string): Promise<SearchResult | null> => {
    try {
      const response = await fetch(`/api/stocks/quote?symbol=${symbol}`)
      if (!response.ok) return null
      
      const quoteData = await response.json()
      
      // Validate that we have valid stock data
      if (!quoteData.c || typeof quoteData.c !== 'number' || quoteData.c <= 0) {
        return null // Invalid stock or no price data
      }
      
      // Also fetch profile for company name
      const profileResponse = await fetch(`/api/stocks/profile?symbol=${symbol}`)
      let name = symbol
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        name = profileData.name || symbol
      }
      
      return {
        symbol: quoteData.symbol || symbol.toUpperCase(),
        name,
        price: quoteData.c,
        change: quoteData.dp || 0,
        changeValue: quoteData.d || 0,
        isCustom: true
      }
    } catch (error) {
      console.error('Failed to fetch custom stock:', error)
      return null
    }
  }

  // Handle search input changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const query = searchQuery.trim().toLowerCase()
    
    // First, filter popular stocks
    const popularMatches = POPULAR_STOCKS.filter(
      (stock) =>
        stock.symbol.toLowerCase().includes(query) ||
        stock.name.toLowerCase().includes(query)
    ).map(stock => ({
      ...stock,
      ...(stockData[stock.symbol] || {}),
      isCustom: false
    }))

    // If exact match with popular stock, don't fetch custom
    const exactPopularMatch = popularMatches.find(
      stock => stock.symbol.toLowerCase() === query
    )
    
    if (exactPopularMatch) {
      setSearchResults(popularMatches)
      return
    }

    // For other searches, try to fetch custom stock data
    const fetchCustom = async () => {
      setSearchLoading(true)
      const customStock = await fetchCustomStock(query.toUpperCase())
      
      if (customStock) {
        setSearchResults([customStock, ...popularMatches])
      } else {
        setSearchResults(popularMatches)
      }
      setSearchLoading(false)
    }

    const timeoutId = setTimeout(fetchCustom, 300) // Debounce
    return () => clearTimeout(timeoutId)
  }, [searchQuery, stockData])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const symbol = searchQuery.trim().toUpperCase()
      
      // Validate the stock exists before navigating
      try {
        const response = await fetch(`/api/stocks/quote?symbol=${symbol}`)
        if (!response.ok) {
          alert(`No stock found for symbol: ${symbol}`)
          return
        }
        
        const quoteData = await response.json()
        if (!quoteData.c || typeof quoteData.c !== 'number' || quoteData.c <= 0) {
          alert(`No valid stock data found for: ${symbol}`)
          return
        }
        
        // Stock is valid, navigate to it
        router.push(`/stocks/${symbol}`)
        setSearchQuery("")
      } catch (error) {
        alert(`Unable to find stock: ${symbol}`)
      }
    }
  }

  const displayStocks = searchQuery ? searchResults : POPULAR_STOCKS.map(stock => ({
    ...stock,
    ...(stockData[stock.symbol] || {}),
    isCustom: false
  }))

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
          {searchQuery ? "Search results:" : "Popular stocks:"}
        </p>
        {searchLoading && (
          <div className="text-sm text-muted-foreground text-center py-2">
            Searching...
          </div>
        )}
        <div className="grid grid-cols-2 fold:grid-cols-4 gap-2">
          {displayStocks.map((stock) => {
            const data = stock.price ? stock : stockData[stock.symbol]
            const isPositive = data && data.change !== undefined ? data.change >= 0 : false
            
            return (
              <Link
                key={stock.symbol}
                href={`/stocks/${stock.symbol}`}
                className="flex flex-col gap-2 p-3 rounded-lg border border-border hover:bg-accent hover:border-primary transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm group-hover:text-primary">
                      {stock.symbol}
                    </span>
                    {stock.isCustom && (
                      <Badge variant="secondary" className="text-xs">
                        New
                      </Badge>
                    )}
                    {data && data.change !== undefined && (
                      <Badge
                        variant={isPositive ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {isPositive ? "+" : ""}
                        {data.change.toFixed(2)}%
                      </Badge>
                    )}
                  </div>
                  {data && data.price !== undefined && (
                    <div className="text-right">
                      <div className="font-bold text-sm">
                        ${data.price.toFixed(2)}
                      </div>
                      <div
                        className={`text-xs flex items-center justify-end gap-1 ${
                          isPositive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {data.changeValue !== undefined && (
                          <>
                            {isPositive ? "+" : ""}
                            {data.changeValue.toFixed(2)}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {stock.name}
                </span>
                {loading && !data && (
                  <div className="text-xs text-muted-foreground">
                    Loading...
                  </div>
                )}
              </Link>
            )
          })}
        </div>
        {searchQuery && displayStocks.length === 0 && !searchLoading && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No real stocks found for &quot;{searchQuery}&quot;. Try searching for valid stock symbols like AAPL, MSFT, or GOOGL.
          </p>
        )}
      </div>
    </Card>
  )
}

