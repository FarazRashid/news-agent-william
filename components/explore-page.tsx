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

    // Fetch only topics for trending topics display (optimized query)
    useEffect(() => {
        const supabase = createSupabaseBrowserClient()
        const fetchRecentArticles = async () => {
            setLoading(true)
            try {
                const { data, error } = await supabase
                    .from("articles")
                    .select("secondary_topics")
                    .order("published_at", { ascending: false })
                    .limit(20) // Reduced from 50 to 20 for better performance

                if (error) throw error

                if (data) {
                    // Extract topics from the lightweight response
                    const allTopics = data.flatMap(row => row.secondary_topics || [])
                    // Store as minimal article-like objects with just topics
                    setArticles(allTopics.map((topic, idx) => ({ 
                        id: String(idx), 
                        topics: [topic] 
                    } as any)))
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
            <div className="container mx-auto padding-responsive py-8 fold:py-12 ipad:py-16 lg:py-20">
                <div className="max-w-3xl mx-auto text-center mb-8 fold:mb-12 mt-8 fold:mt-12">
                    <h1 className="text-3xl fold:text-4xl ipad:text-5xl trifold:text-6xl font-bold mb-3 fold:mb-4">
                        What can I help you with?
                    </h1>
                    <p className="text-base fold:text-lg ipad:text-xl text-muted-foreground mb-6 fold:mb-8">
                        Explore financial news, topics, and insights
                    </p>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 fold:w-5 fold:h-5 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search financial news, topics, or sources..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 fold:pl-12 pr-4 py-5 fold:py-6 text-base fold:text-lg rounded-full"
                        />
                    </form>
                </div>

                {/* Content Topics */}
                <div className="mb-12 fold:mb-16">
                    <div className="flex items-center gap-2 mb-4 fold:mb-6">
                        <Sparkles className="w-4 h-4 fold:w-5 fold:h-5 text-primary" />
                        <h2 className="text-xl fold:text-2xl ipad:text-3xl font-bold">Content Topics</h2>
                    </div>

                    {loading ? (
                        <div className="scroll-fold gap-2 mb-4 rounded-full">
                            {Array.from({ length: 15 }).map((_, idx) => (
                                <Skeleton key={idx} className="h-8 fold:h-9 w-20 fold:w-24 rounded-full flex-shrink-0" />
                            ))}
                        </div>
                    ) : (
                        <div className="scroll-fold gap-2 mb-4">
                            {trendingTopics.slice(0, 20).map((topic, idx) => (
                                <Link key={idx} href={`/feed?primaryTopics=${encodeURIComponent(topic)}`}>
                                    <Badge
                                        variant="secondary"
                                        className="px-3 fold:px-4 py-1.5 fold:py-2 text-xs fold:text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors capitalize rounded-full flex-shrink-0"
                                    >
                                        {topic}
                                    </Badge>
                                </Link>
                            ))}
                            <Link href="/feed">
                                <Badge variant="outline" className="px-3 fold:px-4 py-1.5 fold:py-2 text-xs fold:text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors flex-shrink-0">
                                    See All Topics
                                </Badge>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Topic Categories */}
                <div>
                    <h2 className="text-xs fold:text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 fold:mb-6">
                        Topic Categories
                    </h2>

                    <div className="grid grid-cols-1 fold:grid-cols-2 ipad:grid-cols-2 trifold:grid-cols-3 gap-x-8 fold:gap-x-12 gap-y-8 fold:gap-y-10">
                        {TOPIC_CATEGORIES.map((category, idx) => (
                            <div key={idx}>
                                <h3 className="text-base fold:text-lg ipad:text-xl font-bold mb-3 fold:mb-4">{category.name}</h3>
                                <div className="space-y-2 fold:space-y-3">
                                    {category.topics.map((topic, topicIdx) => (
                                        <Link
                                            key={topicIdx}
                                            href={`/feed?primaryTopics=${encodeURIComponent(topic)}`}
                                            className="block text-sm fold:text-base text-muted-foreground hover:text-foreground transition-colors tap-target"
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
