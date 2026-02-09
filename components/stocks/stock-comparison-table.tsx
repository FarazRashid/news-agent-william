"use client"

import { useState } from "react"
import type { ElementType } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Activity,
  BarChart3,
  DollarSign,
  LineChart,
  Percent,
  TrendingUp,
  Waves,
} from "lucide-react"
import type { StockData } from "@/lib/stocks/types"
import { cn } from "@/lib/utils"

interface StockComparisonTableProps {
  stocks: StockData[]
  title?: string
  highlightSymbol?: string
}

function StockLogoAvatar({ stock }: { stock: StockData }) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  if (!stock.logoUrl || imageError) {
    return (
      <div className="h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
        {stock.symbol.substring(0, 2)}
      </div>
    )
  }

  return (
    <div className="relative h-10 w-10 shrink-0">
      {imageLoading && (
        <div className="absolute inset-0 rounded-full bg-muted animate-pulse" />
      )}
      <Avatar className="h-10 w-10">
        <AvatarImage
          src={stock.logoUrl}
          alt={`${stock.name} logo`}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageLoading(false)
            setImageError(true)
          }}
          className={cn(
            "transition-opacity duration-200",
            imageLoading ? "opacity-0" : "opacity-100"
          )}
        />
        <AvatarFallback className="text-xs font-semibold">
          {stock.symbol.substring(0, 2)}
        </AvatarFallback>
      </Avatar>
    </div>
  )
}

const formatNumber = (value: number | undefined, options?: Intl.NumberFormatOptions) => {
  if (value == null || !Number.isFinite(value)) return "—"
  return new Intl.NumberFormat("en-US", options).format(value)
}

const formatPercent = (value: number | undefined, digits = 2) => {
  if (value == null || !Number.isFinite(value)) return "—"
  const formatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })
  return `${value >= 0 ? "+" : ""}${formatter.format(value)}%`
}

const formatCurrency = (value: number | undefined, digits = 2) => {
  if (value == null || !Number.isFinite(value)) return "—"
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })
  return formatter.format(value)
}

const formatMarketCap = (value: number | undefined) => {
  if (value == null || !Number.isFinite(value) || value <= 0) return "—"
  const trillion = 1_000_000_000_000
  const billion = 1_000_000_000
  const million = 1_000_000

  if (value >= trillion) {
    return `${(value / trillion).toFixed(2)}T`
  }
  if (value >= billion) {
    return `${(value / billion).toFixed(2)}B`
  }
  if (value >= million) {
    return `${(value / million).toFixed(2)}M`
  }
  return formatCurrency(value, 0)
}

export function StockComparisonTable({
  stocks,
  title = "Stock Comparison",
  highlightSymbol,
}: Readonly<StockComparisonTableProps>) {
  if (!stocks.length) return null

  const metricRows: Array<{
    key: string
    label: string
    description?: string
    icon: ElementType
    accentClass: string
    render: (stock: StockData) => string
  }> = [
    {
      key: "price",
      label: "Price",
      description: "Latest trading price",
      icon: DollarSign,
      accentClass: "bg-emerald-500/10 text-emerald-500",
      render: (s) => formatCurrency(s.price),
    },
    {
      key: "change",
      label: "Today's Change",
      description: "Absolute and percentage move",
      icon: TrendingUp,
      accentClass: "bg-sky-500/10 text-sky-500",
      render: (s) =>
        `${formatCurrency(s.change)} (${formatPercent(s.changePercent)})`,
    },
    {
      key: "marketCap",
      label: "Market Cap",
      description: "Total equity market value",
      icon: BarChart3,
      accentClass: "bg-violet-500/10 text-violet-500",
      render: (s) => formatMarketCap(s.marketCap),
    },
    {
      key: "volume",
      label: "Volume",
      description: "Latest trading volume vs. average",
      icon: Activity,
      accentClass: "bg-amber-500/10 text-amber-500",
      render: (s) =>
        `${formatNumber(s.volume)} / ${formatNumber(s.avgVolume)} avg`,
    },
    {
      key: "week52Range",
      label: "52W Range",
      description: "Trading range over the last year",
      icon: LineChart,
      accentClass: "bg-fuchsia-500/10 text-fuchsia-500",
      render: (s) =>
        `${formatCurrency(s.week52Low)} – ${formatCurrency(s.week52High)}`,
    },
    {
      key: "peRatio",
      label: "P/E",
      description: "Price to earnings ratio",
      icon: BarChart3,
      accentClass: "bg-indigo-500/10 text-indigo-500",
      render: (s) =>
        s.peRatio != null && Number.isFinite(s.peRatio)
          ? s.peRatio.toFixed(2)
          : "—",
    },
    {
      key: "dividendYield",
      label: "Dividend Yield",
      description: "Trailing dividend yield",
      icon: Percent,
      accentClass: "bg-emerald-500/10 text-emerald-500",
      render: (s) =>
        s.dividendYield != null && Number.isFinite(s.dividendYield)
          ? formatPercent(s.dividendYield, 2)
          : "—",
    },
    {
      key: "beta",
      label: "Beta",
      description: "Volatility vs. market",
      icon: Waves,
      accentClass: "bg-rose-500/10 text-rose-500",
      render: (s) =>
        s.beta != null && Number.isFinite(s.beta) ? s.beta.toFixed(2) : "—",
    },
    {
      key: "eps",
      label: "EPS (TTM)",
      description: "Earnings per share, trailing 12 months",
      icon: DollarSign,
      accentClass: "bg-teal-500/10 text-teal-500",
      render: (s) =>
        s.eps != null && Number.isFinite(s.eps)
          ? formatCurrency(s.eps, 2)
          : "—",
    },
    {
      key: "open",
      label: "Open / Prev Close",
      description: "Today’s open vs yesterday’s close",
      icon: LineChart,
      accentClass: "bg-cyan-500/10 text-cyan-500",
      render: (s) =>
        `${formatCurrency(s.open)} / ${formatCurrency(s.previousClose)}`,
    },
    {
      key: "intradayRange",
      label: "Day Range",
      description: "Today’s intraday high and low",
      icon: Activity,
      accentClass: "bg-amber-500/10 text-amber-500",
      render: (s) =>
        `${formatCurrency(s.low)} – ${formatCurrency(s.high)}`,
    },
    {
      key: "sectorIndustry",
      label: "Sector / Industry",
      description: "Business classification",
      icon: BarChart3,
      accentClass: "bg-purple-500/10 text-purple-500",
      render: (s) =>
        [s.sector, s.industry].filter(Boolean).join(" · ") || "—",
    },
  ]

  return (
    <Card className="mt-6 border-border/70 bg-background shadow-xl">
      <div className="px-4 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-4 border-b border-border/60 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Compare key valuation, momentum, and profile metrics side by side.
            Scroll horizontally to view all stocks.
          </p>
        </div>
        <Badge variant="outline" className="hidden sm:inline-flex text-xs">
          {stocks.length} {stocks.length === 1 ? "stock" : "stocks"} selected
        </Badge>
      </div>

      <ScrollArea className="w-full">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[minmax(220px,260px)_repeat(auto-fit,minmax(180px,1fr))]">
            <div className="sticky left-0 z-20 border-r border-border bg-background backdrop-blur-sm">
              <div className="h-[72px] px-4 flex items-center text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                Metric
              </div>
              {metricRows.map((row) => {
                const Icon = row.icon
                return (
                  <div
                    key={row.key}
                    className="h-[52px] px-4 border-b border-border flex items-center gap-3"
                  >
                    <div
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-md shrink-0",
                        row.accentClass,
                      )}
                    >
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="text-xs font-semibold tracking-wide leading-tight">
                      {row.label}
                    </div>
                  </div>
                )
              })}
            </div>

            {stocks.map((stock) => {
              const isHighlight =
                highlightSymbol &&
                stock.symbol.toUpperCase() === highlightSymbol.toUpperCase()

              const changePositive = stock.changePercent >= 0

              return (
                <div
                  key={stock.symbol}
                  className={cn(
                    "border-l border-border bg-background",
                    isHighlight && "border-primary/60 bg-primary/5",
                  )}
                >
                  <div className="h-[72px] px-4 border-b border-border flex items-center gap-3">
                    <StockLogoAvatar stock={stock} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={isHighlight ? "default" : "outline"}
                          className="text-[11px] px-2 py-0.5 uppercase tracking-wide"
                        >
                          {stock.symbol}
                        </Badge>
                        {isHighlight && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] uppercase tracking-wide"
                          >
                            Focus
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {stock.name}
                      </div>
                    </div>
                  </div>

                  {metricRows.map((row) => (
                    <div
                      key={row.key}
                      className="h-[52px] px-4 border-b border-border flex items-center justify-end text-sm tabular-nums"
                    >
                      {row.render(stock)}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </ScrollArea>
    </Card>
  )
}

