"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
import type { StockSummary } from "@/lib/stocks/types"
import { getSentimentColor, getSentimentBadgeVariant } from "@/lib/stocks/utils"
import { formatDistanceToNow } from "date-fns"

interface StockAISummaryProps {
  summary: StockSummary
  loading?: boolean
  isUpdating?: boolean
}

export function StockAISummary({ summary, loading = false, isUpdating = false }: StockAISummaryProps) {
  if (loading) {
    return (
      <Card className="p-4 fold:p-5 ipad:p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="h-5 w-32 bg-muted rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
            <div className="h-4 bg-muted rounded w-4/6" />
          </div>
        </div>
      </Card>
    )
  }

  const SentimentIcon =
    summary.sentiment === "bullish"
      ? TrendingUp
      : summary.sentiment === "bearish"
      ? TrendingDown
      : AlertTriangle

  return (
    <Card className="p-4 fold:p-5 ipad:p-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 fold:w-12 fold:h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 fold:w-6 fold:h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-base fold:text-lg font-bold">AI Market Summary</h3>
            {isUpdating && (
              <>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                  Stale
                </Badge>
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                  Refreshing
                </Badge>
              </>
            )}
            <Badge variant={getSentimentBadgeVariant(summary.sentiment)} className="capitalize">
              <SentimentIcon className="w-3 h-3 mr-1" />
              {summary.sentiment}
            </Badge>
          </div>
          <p className="text-xs fold:text-sm text-muted-foreground">
            Updated {formatDistanceToNow(summary.lastUpdated, { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Summary Text */}
      <p className="text-sm fold:text-base leading-relaxed mb-4 fold:mb-5 text-foreground">
        {summary.summary}
      </p>

      {/* Key Factors */}
      <div className="space-y-3 fold:space-y-4">
        <div>
          <p className="text-xs fold:text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 fold:mb-3">
            Key Factors
          </p>
          <ul className="space-y-1.5 fold:space-y-2">
            {summary.keyFactors.map((factor, index) => (
              <li key={index} className="flex items-start gap-2 text-sm fold:text-base">
                <span className="text-primary mt-1 flex-shrink-0">•</span>
                <span className="flex-1">{factor}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Risk Factors (Optional) */}
        {summary.riskFactors && summary.riskFactors.length > 0 && (
          <div className="pt-3 fold:pt-4 border-t border-border">
            <p className="text-xs fold:text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 fold:mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 fold:w-4 fold:h-4" />
              Risk Factors
            </p>
            <ul className="space-y-1.5 fold:space-y-2">
              {summary.riskFactors.map((risk, index) => (
                <li key={index} className="flex items-start gap-2 text-xs fold:text-sm text-muted-foreground">
                  <span className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0">⚠</span>
                  <span className="flex-1">{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="mt-4 fold:mt-5 pt-3 fold:pt-4 border-t border-dashed border-border">
        <p className="text-xs text-muted-foreground italic">
          <strong>Disclaimer:</strong> This summary is AI-generated based on current market data and news sentiment.
          It should not be considered as financial advice. Always conduct your own research and consult with a financial
          advisor before making investment decisions.
        </p>
      </div>
    </Card>
  )
}
