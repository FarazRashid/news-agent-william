"use client"

import { useEffect, useState, useMemo } from "react"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Percent,
  ArrowUpDown,
  Activity,
  Target,
  PieChart,
  LineChart,
  ChevronRight,
} from "lucide-react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  formatPrice,
  formatMarketCap,
  formatVolume,
  getMarketCapCategory,
} from "@/lib/stocks/utils"
import type { StockData } from "@/lib/stocks/types"

interface StockKeyStatsProps {
  symbol: string
  data: StockData
  onViewChart?: () => void
}

type SparklinePoint = { timestamp: number; close: number }

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  className = "",
}: Readonly<{
  icon: React.ElementType
  label: string
  value: string
  subValue?: string
  trend?: "up" | "down" | "neutral"
  className?: string
}>) {
  let trendColor = "text-muted-foreground"
  if (trend === "up") trendColor = "text-green-600 dark:text-green-400"
  else if (trend === "down") trendColor = "text-red-600 dark:text-red-400"
  return (
    <Card
      className={`flex flex-col gap-2 p-4 border-border bg-card/80 backdrop-blur-sm hover:bg-card hover:border-primary/20 transition-colors ${className}`}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-4 h-4 shrink-0" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-lg font-bold tabular-nums ${trend === "up" || trend === "down" ? trendColor : ""}`}>
        {value}
      </p>
      {subValue && (
        <p className="text-xs text-muted-foreground">{subValue}</p>
      )}
    </Card>
  )
}

function getPeTrend(pe: number | undefined): "up" | "down" | "neutral" {
  if (pe == null) return "neutral"
  if (pe > 25) return "up"
  if (pe < 15) return "down"
  return "neutral"
}

function getBetaSubValue(beta: number): string {
  if (beta > 1) return "Above market"
  if (beta < 1) return "Below market"
  return "Market"
}

function SparklineCard({
  symbol,
  onViewChart,
}: Readonly<{
  symbol: string
  onViewChart?: () => void
}>) {
  const [points, setPoints] = useState<SparklinePoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const url = `/api/stocks/charts-data?symbol=${encodeURIComponent(symbol)}&interval=1day&outputsize=30`
    fetch(url, { cache: "no-store" })
      .then((res) => res.json())
      .then((json: { values?: Array<{ datetime: string; close: string }> }) => {
        if (cancelled) return
        const values = Array.isArray(json?.values) ? json.values : []
        const data = values
          .map((v) => ({
            timestamp: new Date(v.datetime).getTime(),
            close: Number.parseFloat(v.close) || 0,
          }))
          .filter((p) => Number.isFinite(p.close))
          .reverse()
        setPoints(data)
      })
      .catch(() => setPoints([]))
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [symbol])

  const isPositive = useMemo(() => {
    if (points.length < 2) return true
    const last = points.at(-1)?.close
    const first = points[0]?.close
    return last != null && first != null && last >= first
  }, [points])

  return (
    <Card className="flex flex-col gap-2 p-4 border-border bg-card/80 backdrop-blur-sm hover:bg-card hover:border-primary/20 transition-colors col-span-full sm:col-span-2 min-h-[100px]">
      <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        <LineChart className="w-4 h-4 shrink-0" />
          <span className="text-xs font-medium uppercase tracking-wide">1M trend</span>
        </div>
        {onViewChart && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 gap-0.5 text-primary"
            onClick={onViewChart}
          >
            Full chart
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
      {loading && <Skeleton className="h-12 w-full rounded" />}
      {!loading && points.length > 0 && (
        <div className="h-12 w-full -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <defs>
                <linearGradient id="sparkline" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="100%"
                    stopColor={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="close"
                stroke={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                strokeWidth={1.5}
                fill="url(#sparkline)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      {!loading && points.length === 0 && (
        <p className="text-sm text-muted-foreground">No trend data</p>
      )}
    </Card>
  )
}

export function StockKeyStats({ symbol, data, onViewChart }: Readonly<StockKeyStatsProps>) {
  const isPositive = data.change >= 0

  return (
    <section className="mb-6 sm:mb-8" aria-label="Key statistics">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">
          Key stats at a glance
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {/* 1. Current price — hero card */}
        <Card className="col-span-2 flex flex-col justify-center p-4 sm:p-5 border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Current price</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold tabular-nums">
            ${formatPrice(data.price)}
          </p>
          <p
            className={`text-sm font-semibold tabular-nums ${
              isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {isPositive ? "+" : ""}
            ${Math.abs(data.change).toFixed(2)} ({isPositive ? "+" : ""}
            {data.changePercent.toFixed(2)}%)
          </p>
        </Card>

        {/* 2. Market cap */}
        <StatCard
          icon={BarChart3}
          label="Market cap"
          value={formatMarketCap(data.marketCap)}
          subValue={getMarketCapCategory(data.marketCap)}
        />

        {/* 3. P/E ratio */}
        <StatCard
          icon={Percent}
          label="P/E ratio"
          value={data.peRatio == null ? "N/A" : data.peRatio.toFixed(2)}
          trend={getPeTrend(data.peRatio)}
        />

        {/* 4. 52W high */}
        <StatCard
          icon={TrendingUp}
          label="52W high"
          value={`$${formatPrice(data.week52High)}`}
        />

        {/* 5. 52W low */}
        <StatCard
          icon={TrendingDown}
          label="52W low"
          value={`$${formatPrice(data.week52Low)}`}
        />

        {/* 6. Volume */}
        <StatCard
          icon={Activity}
          label="Volume"
          value={formatVolume(data.volume)}
          subValue={data.avgVolume > 0 ? `Avg: ${formatVolume(data.avgVolume)}` : undefined}
        />

        {/* 7. Day range (Open) */}
        <StatCard
          icon={ArrowUpDown}
          label="Open"
          value={`$${formatPrice(data.open)}`}
        />

        {/* 8. Day high / low */}
        <Card className="flex flex-col gap-2 p-4 border-border bg-card/80 backdrop-blur-sm hover:bg-card hover:border-primary/20 transition-colors">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="w-4 h-4 shrink-0" />
            <span className="text-xs font-medium uppercase tracking-wide">Day range</span>
          </div>
          <p className="text-sm font-bold tabular-nums">
            ${formatPrice(data.low)} – ${formatPrice(data.high)}
          </p>
        </Card>

        {/* 9. Dividend yield */}
        <StatCard
          icon={PieChart}
          label="Div. yield"
          value={data.dividendYield == null ? "N/A" : `${data.dividendYield.toFixed(2)}%`}
        />

        {/* 10. Beta (if available) */}
        {data.beta != null && (
          <StatCard
            icon={Activity}
            label="Beta"
            value={data.beta.toFixed(2)}
            subValue={getBetaSubValue(data.beta)}
          />
        )}

        {/* Sparkline — 1M trend */}
        <SparklineCard symbol={symbol} onViewChart={onViewChart} />
      </div>
    </section>
  )
}
