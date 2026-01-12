import { Suspense } from "react"
import { StockPageClient } from "./client"
import { StockPageSkeleton } from "@/components/stocks/stock-page-skeleton"

export default async function StockPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params

  return (
    <Suspense fallback={<StockPageSkeleton />}>
      <StockPageClient symbol={symbol} />
    </Suspense>
  )
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  const formattedSymbol = symbol.toUpperCase()

  return {
    title: `${formattedSymbol} Stock - Live Price, Chart & News | Wealth Manager`,
    description: `View real-time ${formattedSymbol} stock price, interactive charts, key metrics, AI-powered analysis, and latest financial news.`,
  }
}
