"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { TrendingUp, FileText, BarChart3, Tag, Clock, Eye, ChevronRight } from "lucide-react"
import type { Article } from "@/lib/types"

// Widget 1: Trending Stories
type TrendingStoriesProps = {
  articles: Article[]
}

export function TrendingStoriesWidget({ articles }: TrendingStoriesProps) {
  const displayArticles = articles.slice(0, 5)
  
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Trending Stories</h3>
      </div>
      <div className="space-y-3">
        {displayArticles.map((article) => (
          <Link
            key={article.id}
            href={`/article/${article.id}`}
            className="block group"
          >
            <h4 className="text-sm font-medium leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {article.title}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>{article.source.name}</span>
              <span>•</span>
              <span>{article.publishedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
          </Link>
        ))}
      </div>
      <Button variant="ghost" size="sm" className="w-full mt-3" asChild>
        <Link href="/">
          View all <ChevronRight className="w-3 h-3 ml-1" />
        </Link>
      </Button>
    </Card>
  )
}

// Widget 2: Sources Used
type SourcesUsedProps = {
  sources: { name: string; domain: string; url?: string; title?: string }[]
}

export function SourcesUsedWidget({ sources }: SourcesUsedProps) {
  // Count sources by domain
  const sourceCounts = sources.reduce((acc, source) => {
    const key = source.name || source.domain
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const uniqueSources = Object.entries(sourceCounts)
    .map(([name, count]) => ({
      name,
      count,
      source: sources.find(s => (s.name || s.domain) === name)!
    }))
    .sort((a, b) => b.count - a.count)

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Sources Used</h3>
      </div>
      <div className="space-y-2">
        {uniqueSources.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <span className="truncate flex-1">{item.name}</span>
            <Badge variant="secondary" className="ml-2 text-xs">
              {item.count}
            </Badge>
          </div>
        ))}
      </div>
      {sources.length === 0 && (
        <p className="text-sm text-muted-foreground">No sources available</p>
      )}
    </Card>
  )
}

// Widget 3: Story Stats
type StoryStatsProps = {
  totalSources: number
  articleCount: number
  publishRange?: string
  viewCount?: number
  sentiment?: string | null
}

export function StoryStatsWidget({ 
  totalSources, 
  articleCount, 
  publishRange, 
  viewCount,
  sentiment 
}: StoryStatsProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Story Stats</h3>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total Sources</span>
          <span className="font-semibold">{totalSources}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Related Articles</span>
          <span className="font-semibold">{articleCount}</span>
        </div>
        {publishRange && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Publish Range</span>
            <span className="font-semibold text-xs">{publishRange}</span>
          </div>
        )}
        {viewCount !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <Eye className="w-3 h-3 text-muted-foreground" />
            <span className="font-semibold">{viewCount.toLocaleString()}</span>
          </div>
        )}
        {sentiment && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sentiment</span>
              <Badge variant="secondary" className="capitalize text-xs">
                {sentiment}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// Widget 4: Companies & Tags
type CompaniesTagsProps = {
  companies: string[]
  topics: string[]
  primaryTopic?: string | null
}

export function CompaniesTagsWidget({ companies, topics, primaryTopic }: CompaniesTagsProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Companies & Tags</h3>
      </div>
      
      {/* Primary Topic */}
      {primaryTopic && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-1">Primary Topic</p>
          <Badge variant="default" className="capitalize">
            {primaryTopic}
          </Badge>
        </div>
      )}

      {/* Companies */}
      {companies.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-2">Companies</p>
          <div className="flex flex-wrap gap-1.5">
            {companies.slice(0, 6).map((company, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {company}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Topics */}
      {topics.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Related Topics</p>
          <div className="flex flex-wrap gap-1.5">
            {topics.slice(0, 8).map((topic, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs capitalize">
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

// Widget 5: Story History (Timeline)
type StoryTimelineEvent = {
  date: Date
  headline: string
  source: string
}

type StoryHistoryProps = {
  events: StoryTimelineEvent[]
}

export function StoryHistoryWidget({ events }: StoryHistoryProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Story Timeline</h3>
      </div>
      <div className="space-y-3">
        {events.map((event, idx) => (
          <div key={idx} className="relative pl-4 border-l-2 border-border pb-3 last:pb-0">
            <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-primary" />
            <div className="text-xs text-muted-foreground mb-1">
              {event.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
            <p className="text-sm font-medium leading-tight">{event.headline}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{event.source}</p>
          </div>
        ))}
      </div>
      {events.length === 0 && (
        <p className="text-sm text-muted-foreground">No timeline data available</p>
      )}
    </Card>
  )
}
