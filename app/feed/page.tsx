import { Suspense } from "react"
import Header from "@/components/header"
import FiltersSidebar from "@/components/filters-sidebar"
import NewsFeed from "@/components/news-feed"
import { NewsProvider } from "@/lib/news-context"

export default function FeedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
      <NewsProvider>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="flex">
            <FiltersSidebar />
            <NewsFeed />
          </div>
        </div>
      </NewsProvider>
    </Suspense>
  )
}
