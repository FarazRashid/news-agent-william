import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { BookOpen, Clock, TrendingUp, Target, Users, Hash, CheckCircle2 } from "lucide-react"
import type { Article } from "@/lib/types"

interface ArticleMetadataProps {
  article: Article
}

export function ArticleMetadata({ article }: ArticleMetadataProps) {
  return (
    <div className="space-y-4">
      {/* Badges Row */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="capitalize">
          {article.category}
        </Badge>
        {article.sentiment && (
          <Badge
            variant="secondary"
            className={
              article.sentiment === "positive"
                ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                : article.sentiment === "negative"
                  ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                  : "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"
            }
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            {article.sentiment}
          </Badge>
        )}
        {article.urgency && (
          <Badge variant="secondary" className="capitalize">
            <Target className="w-3 h-3 mr-1" />
            {article.urgency}
          </Badge>
        )}
        {article.audienceLevel && (
          <Badge variant="secondary" className="capitalize">
            <Users className="w-3 h-3 mr-1" />
            {article.audienceLevel}
          </Badge>
        )}
        {article.readabilityScore && (
          <Badge
            variant="secondary"
            className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 capitalize"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {article.readabilityScore} readability
          </Badge>
        )}
      </div>

      {/* Reading Stats */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        {article.wordCount && (
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span>{article.wordCount.toLocaleString()} words</span>
          </div>
        )}
        {article.readTimeMinutes && (
          <>
            {article.wordCount && <span>•</span>}
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{article.readTimeMinutes} min read</span>
            </div>
          </>
        )}
      </div>

      {/* Meta Description */}
      {article.metaDescription && (
        <Card className="p-4 bg-muted/30 border-dashed">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Meta Description
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {article.metaDescription}
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}

// SEO Keywords component to be displayed at the bottom of the article
export function ArticleSEOKeywords({ article }: ArticleMetadataProps) {
  if (!article.focusKeyword && (!article.relatedKeywords || article.relatedKeywords.length === 0)) {
    return null
  }

  return (
    <Card className="p-4 bg-muted/30 border-dashed">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
          <Hash className="w-3.5 h-3.5" />
          <span>SEO Keywords</span>
        </div>

        {article.focusKeyword && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Focus Keyword</p>
            <Badge variant="default" className="font-medium">
              {article.focusKeyword}
            </Badge>
          </div>
        )}

        {article.relatedKeywords && article.relatedKeywords.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Related Keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {article.relatedKeywords.map((keyword, idx) => (
                <Badge key={idx} variant="outline" className="text-xs font-normal">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
