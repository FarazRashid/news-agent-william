"use client"

import { ArrowDown, ArrowUp, Star, Share2, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface StockHeaderProps {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  logoUrl?: string
  exchange?: string
  isWatchlisted?: boolean
  onToggleWatchlist?: () => void
  onShare?: () => void
  onSetAlert?: () => void
}

export function StockHeader({
  symbol,
  name,
  price,
  change,
  changePercent,
  logoUrl,
  exchange = "NASDAQ",
  isWatchlisted = false,
  onToggleWatchlist,
  onShare,
  onSetAlert,
}: StockHeaderProps) {
  const isPositive = change >= 0
  const changeColor = isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"

  return (
    <div className="bg-card border border-border rounded-lg p-4 fold:p-5 ipad:p-6 mb-4 fold:mb-6">
      {/* Top Section: Logo, Symbol, Name, Actions */}
      <div className="flex items-start justify-between gap-3 fold:gap-4 mb-4 fold:mb-5">
        {/* Left: Logo + Text */}
        <div className="flex items-center gap-3 fold:gap-4 flex-1 min-w-0">
          {/* Logo */}
          {logoUrl ? (
            <div className="w-12 h-12 fold:w-14 fold:h-14 ipad:w-16 ipad:h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
              <img src={logoUrl} alt={`${name} logo`} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 fold:w-14 fold:h-14 ipad:w-16 ipad:h-16 flex-shrink-0 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg fold:text-xl">
              {symbol.substring(0, 2)}
            </div>
          )}

          {/* Symbol and Name */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl fold:text-2xl ipad:text-3xl font-bold truncate">{symbol}</h1>
              <Badge variant="outline" className="flex-shrink-0 text-xs">
                {exchange}
              </Badge>
            </div>
            <p className="text-sm fold:text-base text-muted-foreground truncate">{name}</p>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1 fold:gap-2 flex-shrink-0">
          <Button
            variant={isWatchlisted ? "default" : "outline"}
            size="icon"
            onClick={onToggleWatchlist}
            className="tap-target"
            title={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
          >
            <Star className={cn("w-4 h-4", isWatchlisted && "fill-current")} />
          </Button>
          <Button variant="outline" size="icon" onClick={onSetAlert} className="tap-target hidden fold:flex" title="Set price alert">
            <Bell className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onShare} className="tap-target hidden ipad:flex" title="Share">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Bottom Section: Price and Change */}
      <div className="grid grid-cols-1 fold:grid-cols-2 gap-3 fold:gap-4 ipad:gap-6">
        {/* Current Price */}
        <div>
          <p className="text-xs fold:text-sm text-muted-foreground mb-1">Current Price</p>
          <p className="text-3xl fold:text-4xl ipad:text-5xl font-bold tabular-nums">
            ${price.toFixed(2)}
          </p>
        </div>

        {/* Change */}
        <div className="flex items-end fold:justify-end">
          <div>
            <p className="text-xs fold:text-sm text-muted-foreground mb-1">Today's Change</p>
            <div className="flex items-center gap-2">
              {isPositive ? (
                <ArrowUp className={cn("w-5 h-5 fold:w-6 fold:h-6", changeColor)} />
              ) : (
                <ArrowDown className={cn("w-5 h-5 fold:w-6 fold:h-6", changeColor)} />
              )}
              <div>
                <p className={cn("text-xl fold:text-2xl ipad:text-3xl font-bold tabular-nums", changeColor)}>
                  {isPositive ? "+" : ""}
                  ${Math.abs(change).toFixed(2)}
                </p>
                <p className={cn("text-base fold:text-lg font-medium tabular-nums", changeColor)}>
                  {isPositive ? "+" : ""}
                  {changePercent.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Status (optional) */}
      <div className="mt-4 fold:mt-5 pt-3 fold:pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs fold:text-sm text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Market Open • Updates in real-time</span>
        </div>
      </div>
    </div>
  )
}
