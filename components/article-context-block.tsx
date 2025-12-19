import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, TrendingUp, Users } from "lucide-react"

type ArticleContextBlockProps = {
  tldr: string[]
  whyItMatters: string
  sentiment?: string | null
}

export function ArticleContextBlock({ tldr, whyItMatters, sentiment }: ArticleContextBlockProps) {
  return (
    <Card className="p-6 bg-primary/5 border-primary/20 mb-6">
      {/* TL;DR Section */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">TL;DR</h3>
        </div>
        <ul className="space-y-2 ml-7">
          {tldr.map((point, idx) => (
            <li key={idx} className="text-foreground leading-relaxed flex items-start">
              <span className="mr-2 text-primary font-bold">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Why It Matters Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Why This Matters to You</h3>
        </div>
        <p className="text-foreground leading-relaxed ml-7">{whyItMatters}</p>
      </div>

      {/* Optional Sentiment Indicator */}
      {sentiment && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <Badge variant="secondary" className="capitalize">
            Sentiment: {sentiment}
          </Badge>
        </div>
      )}
    </Card>
  )
}
