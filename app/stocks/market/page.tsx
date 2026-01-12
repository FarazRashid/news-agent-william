import { Suspense } from "react"
import MarketOverview from "./client"
import { StockPageSkeleton } from "@/components/stocks/stock-page-skeleton"

export const metadata = {
  title: "Market Overview | Wealth Manager",
  description: "View top market movers, indices, and trending stocks",
}

export default function MarketPage() {
  return (
    <Suspense fallback={<StockPageSkeleton />}>
      <MarketOverview />
    </Suspense>
  )
}

