"use client"

import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Article } from "@/lib/types"

type ContinueExploringProps = {
  relatedArticles: Article[]
  trendingTopics: string[]
  suggestedSectors: string[]
}

export function ContinueExploring({ 
  relatedArticles, 
  trendingTopics, 
  suggestedSectors 
}: ContinueExploringProps) {
  return (
    <div className="mt-12 pt-8 border-t border-border">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold">Continue Exploring</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Related Topics */}
        <Card className="p-5 flex flex-col">
          <div className="flex-1">
            <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">
              Related Topics
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {trendingTopics.slice(0, 6).map((topic, idx) => (
                <Link key={idx} href={`/?topic=${encodeURIComponent(topic)}`}>
                  <Badge 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors capitalize"
                  >
                    {topic}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/feed">
              Explore All Topics <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </Card>

        {/* Trending Sectors */}
        <Card className="p-5 flex flex-col">
          <div className="flex-1">
            <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">
              Trending Sectors
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {suggestedSectors.slice(0, 6).map((sector, idx) => (
                <Link key={idx} href={`/?category=${encodeURIComponent(sector)}`}>
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors capitalize"
                  >
                    {sector}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/feed">
              View All Sectors <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </Card>

        {/* Suggested Deep-Dives */}
        <Card className="p-5 flex flex-col">
          <div className="flex-1">
            <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">
              Suggested Articles
            </h3>
            <div className="space-y-3 mb-4">
              {relatedArticles.slice(0, 3).map((article) => (
                <Link
                  key={article.id}
                  href={`/article/${article.id}`}
                  className="block group"
                >
                  <p className="text-sm font-medium leading-tight group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/feed">
              See More Articles <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  )
}
