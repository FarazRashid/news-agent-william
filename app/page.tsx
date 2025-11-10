import Header, { SidebarProvider } from "@/components/header"
import FiltersSidebar from "@/components/filters-sidebar"
import NewsFeed from "@/components/news-feed"
import EngagementWidgets from "@/components/engagement-widgets"
import { NewsProvider } from "@/lib/news-context"

export default function Home() {
  return (
    <NewsProvider>
      <SidebarProvider>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="flex">
            <FiltersSidebar />
            <NewsFeed />
            <EngagementWidgets />
          </div>
        </div>
      </SidebarProvider>
    </NewsProvider>
  )
}
