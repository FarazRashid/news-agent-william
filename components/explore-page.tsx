"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, TrendingUp, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client"
import type { Article } from "@/lib/types"
import { mapArticleRowToArticle } from "@/lib/articles"

const TOPIC_CATEGORIES = [
  {
    name: "Finance and Economy",
    topics: ["Federal Reserve", "Inflation", "US Economy", "Interest Rates", "Recession", "Money"]
  },
  {
    name: "Markets",
    topics: ["Stock Markets", "S&P 500", "Global Markets", "Cryptocurrency", "Trade War"]
  },
  {
    name: "Business",
    topics: ["Wall Street", "Billionaires", "Small Business", "Banking", "Real Estate"]
  },
  {
    name: "Investments",
    topics: ["Investment Strategies", "Portfolio Management", "Retirement Planning"]
  },
  {
    name: "Technology",
    topics: ["Technology & AI", "Tech Stocks"]
  },
  {
    name: "Politics",
    topics: ["Donald Trump", "US Politics"]
  }
]

export function ExplorePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch only recent articles for trending topics (lighter query)
  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    const fetchRecentArticles = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("articles")
          .select("*")
          .order("published_at", { ascending: false })
          .limit(50) // Only fetch 50 most recent articles for trending topics
        
        if (error) throw error
        
        if (data) {
          const mapped = data.map(mapArticleRowToArticle)
          setArticles(mapped)
        }
      } catch (err) {
        console.error("Error fetching articles:", err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchRecentArticles()
  }, [])

  // Generate trending topics from articles
  const trendingTopics = useMemo(() => {
    if (articles.length === 0) return []
    
    const allTopics = articles
      .flatMap(a => a.topics)
      .map(t => t.trim())
      .filter(t => t.length > 0)
    
    const seen = new Map<string, string>()
    allTopics.forEach(topic => {
      const lowerTopic = topic.toLowerCase()
      if (!seen.has(lowerTopic)) {
        seen.set(lowerTopic, topic)
      }
    })
    
    const uniqueTopics = Array.from(seen.values())
    const topicCounts = uniqueTopics.reduce((acc, topic) => {
      acc[topic] = allTopics.filter(t => t.toLowerCase() === topic.toLowerCase()).length
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([topic]) => topic)
      .slice(0, 20)
  }, [articles])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/feed?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Search */}
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto text-center mb-12 mt-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            What can I help you with?
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Explore financial news, topics, and insights
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search financial news, topics, or sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg rounded-full"
            />
          </form>
        </div>

        {/* Content Topics */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold">Content Topics</h2>
          </div>
          
          {loading ? (
            <div className="flex flex-wrap gap-2 mb-4 rounded-full">
              {Array.from({ length: 15 }).map((_, idx) => (
                <Skeleton key={idx} className="h-9 w-24 rounded-full" />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-4">
              <Link href="/feed">
                <Badge variant="outline" className="px-4 py-2 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                  See All Topics
                </Badge>
              </Link>
              {trendingTopics.slice(0, 20).map((topic, idx) => (
                <Link key={idx} href={`/feed?topic=${encodeURIComponent(topic)}`}>
                  <Badge 
                    variant="secondary" 
                    className="px-4 py-2 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors capitalize rounded-full"
                  >
                    {topic}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Topic Categories */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-6">
            Topic Categories
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
            {TOPIC_CATEGORIES.map((category, idx) => (
              <div key={idx}>
                <h3 className="text-lg font-bold mb-4">{category.name}</h3>
                <div className="space-y-3">
                  {category.topics.map((topic, topicIdx) => (
                    <Link
                      key={topicIdx}
                      href={`/feed?topic=${encodeURIComponent(topic)}`}
                      className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {topic}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
