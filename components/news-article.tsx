import type { Article } from "@/lib/types"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Target, Users, CheckCircle2, TrendingUp } from "lucide-react"

export default function NewsArticle({ article }: { article: Article }) {
  return (
    <Link
      href={`/article/${article.id}`}
      className="group bg-card border border-border rounded-lg p-4 sm:p-6 hover:shadow-lg transition-all flex flex-col sm:flex-row gap-4 sm:gap-6"
    >
      {/* Image first on mobile, side on desktop */}
      <div className="shrink-0 relative w-full h-48 sm:w-40 sm:h-28 md:w-48 md:h-32 sm:order-2">
        <Image
          src={article.image || "/finance.jpg"}
          alt={article.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 160px, 192px"
          className="object-cover rounded-md"
          priority={false}
        />
      </div>

      <div className="flex-1 sm:order-1 min-w-0">
        <h3 className="font-bold text-foreground text-base sm:text-lg leading-tight mb-2 sm:mb-3 group-hover:text-primary transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed line-clamp-2 sm:line-clamp-3 mb-3 sm:mb-4">
          {article.description}
        </p>
        {/* Tags / badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {/* Stock Symbols - Priority placement */}
          {article.entities.stockSymbols && article.entities.stockSymbols.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {article.entities.stockSymbols.slice(0, 3).map((symbol, idx) => (
                <Link
                  key={`${symbol}-${idx}`}
                  href={`/stocks/${symbol}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-block"
                >
                  <Badge
                    variant="secondary"
                    className="text-xs font-semibold bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {symbol}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
          {article.category && (
            <Badge variant="outline" className="capitalize">
              {article.category}
            </Badge>
          )}
          {/* Mixed meta badges FIRST: urgency, audience level, readability, with icons */}
          {article.urgency && (
            <Badge variant="secondary" className="text-xs font-normal capitalize">
              <Target className="w-3 h-3 mr-1" />
              {article.urgency}
            </Badge>
          )}
          {article.audienceLevel && (
            <Badge variant="secondary" className="text-xs font-normal capitalize">
              <Users className="w-3 h-3 mr-1" />
              {article.audienceLevel}
            </Badge>
          )}
          {article.readabilityScore && (
            <Badge
              variant="secondary"
              className="text-xs font-normal capitalize bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {article.readabilityScore} readability
            </Badge>
          )}

          {/* Separation to differentiate meta vs topics */}
          {(() => {
            const seen = new Set<string>()
            const topicTags: string[] = []
            if (article.primaryTopic && !seen.has(article.primaryTopic)) {
              seen.add(article.primaryTopic)
              topicTags.push(article.primaryTopic)
            }
            for (const t of article.topics || []) {
              if (topicTags.length >= 3) break
              if (t && !seen.has(t)) {
                seen.add(t)
                topicTags.push(t)
              }
            }
            if (topicTags.length === 0) return null
            return (
              <div className="flex flex-wrap gap-1.5 ml-2 pl-2 border-l border-border/60">
                {topicTags.map((t, idx) => (
                  <Badge key={`${t}-${idx}`} variant="secondary" className="text-xs font-normal capitalize">
                    {t}
                  </Badge>
                ))}
              </div>
            )
          })()}
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
              {article.source.logo}
            </div>
            <span className="font-medium truncate max-w-[120px] sm:max-w-none">{article.source.name}</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <span className="whitespace-nowrap">
            {article.publishedAt.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              timeZone: "UTC",
            })}
          </span>
          {(article.wordCount || article.readTimeMinutes) && (
            <>
              <span>•</span>
              {article.wordCount && (
                <span className="whitespace-nowrap">{article.wordCount.toLocaleString()} words</span>
              )}
              {article.readTimeMinutes && (
                <>
                  {article.wordCount && <span>•</span>}
                  <span className="whitespace-nowrap">{article.readTimeMinutes} min read</span>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
