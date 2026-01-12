"use client"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export interface StockMetric {
  label: string
  value: string | number
  subValue?: string
  trend?: "up" | "down" | "neutral"
}

export interface StockMetricsProps {
  metrics: StockMetric[]
  loading?: boolean
}

function formatValue(value: string | number): string {
  if (typeof value === "number") {
    // Format large numbers (billions, millions, etc.)
    if (value >= 1_000_000_000_000) {
      return `$${(value / 1_000_000_000_000).toFixed(2)}T`
    }
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`
    }
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`
    }
    return value.toLocaleString()
  }
  return value
}

export function StockMetrics({ metrics, loading = false }: StockMetricsProps) {
  if (loading) {
    return (
      <Card className="p-4 fold:p-5 ipad:p-6">
        <h2 className="text-lg fold:text-xl font-bold mb-4 fold:mb-5">Key Metrics</h2>
        <div className="grid grid-cols-2 fold:grid-cols-2 ipad:grid-cols-1 gap-4 fold:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 fold:p-5 ipad:p-6">
      <h2 className="text-lg fold:text-xl font-bold mb-4 fold:mb-5">Key Metrics</h2>
      <div className="grid grid-cols-2 fold:grid-cols-2 ipad:grid-cols-1 gap-4 fold:gap-5">
        {metrics.map((metric, index) => (
          <div key={index} className="space-y-1">
            <p className="text-xs fold:text-sm text-muted-foreground">{metric.label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-base fold:text-lg font-semibold tabular-nums">
                {formatValue(metric.value)}
              </p>
              {metric.trend && (
                <span
                  className={`text-xs font-medium ${
                    metric.trend === "up"
                      ? "text-green-600 dark:text-green-400"
                      : metric.trend === "down"
                      ? "text-red-600 dark:text-red-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {metric.trend === "up" ? "↑" : metric.trend === "down" ? "↓" : "→"}
                </span>
              )}
            </div>
            {metric.subValue && (
              <p className="text-xs text-muted-foreground">{metric.subValue}</p>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

// Example usage with common stock metrics
export const exampleMetrics: StockMetric[] = [
  { label: "Market Cap", value: 2890000000000, subValue: "Large Cap" },
  { label: "P/E Ratio", value: "31.24", trend: "up" },
  { label: "Dividend Yield", value: "0.48%", trend: "neutral" },
  { label: "52W High", value: "$199.62" },
  { label: "52W Low", value: "$164.08" },
  { label: "Avg Volume", value: "52.3M" },
  { label: "Beta", value: "1.29", trend: "up" },
  { label: "EPS (TTM)", value: "$6.42", trend: "up" },
]
