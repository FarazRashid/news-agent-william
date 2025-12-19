import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HelpCircle, Target, Building2 } from "lucide-react"

type KeyInsightsProps = {
  whatsGoingOn: string
  whatItMeans: string
  whoIsAffected: string[]
}

export function ArticleKeyInsights({ whatsGoingOn, whatItMeans, whoIsAffected }: KeyInsightsProps) {
  return (
    <Card className="p-6 border-l-4 border-l-primary mb-6">
      <h2 className="text-2xl font-bold mb-6">Key Insights</h2>

      {/* What's Going On */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">What's going on here?</h3>
        </div>
        <p className="text-muted-foreground leading-relaxed ml-7">{whatsGoingOn}</p>
      </div>

      {/* What It Means */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">What does this mean?</h3>
        </div>
        <p className="text-muted-foreground leading-relaxed ml-7">{whatItMeans}</p>
      </div>

      {/* Who Is Affected */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Who is affected?</h3>
        </div>
        <div className="flex flex-wrap gap-2 ml-7">
          {whoIsAffected.map((entity, idx) => (
            <Badge key={idx} variant="outline" className="capitalize">
              {entity}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  )
}
