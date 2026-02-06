"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { fetchStockChartData, formatTimeRangeDisplay } from "@/lib/stocks/api"
import type { TimeRange, StockPrice } from "@/lib/stocks/types"
import { formatPrice } from "@/lib/stocks/utils"

interface StockChartProps {
  symbol: string
  currentPrice?: number
  defaultTimeRange?: TimeRange
  onHoverPoint?: (point: { timestamp: number; price: number } | null) => void
}

const TIME_RANGES: TimeRange[] = ["1D", "5D", "1M", "3M", "6M", "1Y", "5Y"]

export function StockChart({
  symbol,
  currentPrice,
  defaultTimeRange = "1D",
  onHoverPoint,
}: StockChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange)
  const [chartData, setChartData] = useState<StockPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredPrice, setHoveredPrice] = useState<number | null>(null)

  useEffect(() => {
    const loadChartData = async () => {
      setLoading(true)
      try {
        const data = await fetchStockChartData(symbol, timeRange)
        setChartData(data.prices)
      } catch (error) {
        console.error("Error loading chart data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadChartData()
  }, [symbol, timeRange])

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp)
    if (timeRange === "1D" || timeRange === "5D") {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const formatTooltipLabel = (timestamp: number) => {
    const date = new Date(timestamp)
    if (timeRange === "1D" || timeRange === "5D") {
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const firstPrice = chartData[0]?.close || currentPrice || 0
  const lastPrice = chartData[chartData.length - 1]?.close || currentPrice || 0
  const priceChange = lastPrice - firstPrice
  const isPositive = priceChange >= 0

  return (
    <Card className="p-4 fold:p-5 ipad:p-6">
      {/* Header */}
      <div className="flex flex-col fold:flex-row fold:items-center fold:justify-between gap-3 fold:gap-4 mb-4 fold:mb-6">
        <div>
          <h2 className="text-lg fold:text-xl font-bold mb-1">Price Chart</h2>
          {hoveredPrice !== null && (
            <p className="text-2xl fold:text-3xl font-bold tabular-nums">
              ${formatPrice(hoveredPrice)}
            </p>
          )}
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-1 fold:gap-1.5 overflow-x-auto scrollbar-hide">
          {TIME_RANGES.map((range) => (
            <Badge
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              className="cursor-pointer text-xs fold:text-sm tap-target whitespace-nowrap flex-shrink-0"
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Badge>
          ))}
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-64 fold:h-72 ipad:h-80 w-full rounded-lg" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ) : chartData.length > 0 ? (
        <>
          <div className="h-64 fold:h-72 ipad:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                onMouseMove={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    const payload = e.activePayload[0].payload as StockPrice
                    setHoveredPrice(payload.close)
                    onHoverPoint?.({ timestamp: payload.timestamp, price: payload.close })
                  }
                }}
                onMouseLeave={() => {
                  setHoveredPrice(null)
                  onHoverPoint?.(null)
                }}
              >
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatXAxis}
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: "12px" }}
                  tickLine={false}
                  minTickGap={50}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tickFormatter={(value) => `$${formatPrice(value)}`}
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: "12px" }}
                  tickLine={false}
                  width={70}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload[0]) return null
                    const data = payload[0].payload as StockPrice
                    return (
                      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                        <p className="text-xs text-muted-foreground mb-1">
                          {formatTooltipLabel(data.timestamp)}
                        </p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Open:</span>
                            <span className="font-semibold tabular-nums">${formatPrice(data.open)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">High:</span>
                            <span className="font-semibold tabular-nums">${formatPrice(data.high)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Low:</span>
                            <span className="font-semibold tabular-nums">${formatPrice(data.low)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Close:</span>
                            <span className="font-semibold tabular-nums">${formatPrice(data.close)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                  strokeWidth={2}
                  fill="url(#colorPrice)"
                  animationDuration={300}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Info */}
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs fold:text-sm text-muted-foreground">
            <span>Showing {formatTimeRangeDisplay(timeRange)}</span>
            <span className={isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
              {isPositive ? "↑" : "↓"} ${Math.abs(priceChange).toFixed(2)} (
              {((priceChange / firstPrice) * 100).toFixed(2)}%)
            </span>
          </div>
        </>
      ) : (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No chart data available
        </div>
      )}

      {/* Chart Tips */}
      <div className="mt-4 p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
        <p className="font-medium mb-1">💡 Chart Features:</p>
        <ul className="space-y-0.5 ml-4 list-disc">
          <li>Hover over the chart to see detailed price information</li>
          <li>Click time range buttons to view different periods</li>
          <li className="hidden ipad:list-item">Area color indicates overall trend direction</li>
          <li className="hidden ipad:list-item">
            Hovering also syncs with the news carousel below, so you can see headlines for that day.
          </li>
        </ul>
      </div>
    </Card>
  )
}
