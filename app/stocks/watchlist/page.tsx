import { Suspense } from "react"
import StockWatchlist from "./client"
import { StockPageSkeleton } from "@/components/stocks/stock-page-skeleton"

export const metadata = {
  title: "Stock Watchlist | Wealth Manager",
  description: "Track your favorite stocks and monitor market movements",
}

export default function WatchlistPage() {
  return (
    <Suspense fallback={<StockPageSkeleton />}>
      <StockWatchlist />
    </Suspense>
  )
}

