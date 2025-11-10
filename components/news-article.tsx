import type { Article } from "@/lib/types"
import Link from "next/link"
import Image from "next/image"

export default function NewsArticle({ article }: { article: Article }) {
  return (
    <Link
      href={`/article/${article.id}`}
      className="group bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all flex gap-6"
    >
      <div className="flex-1">
        <h3 className="font-bold text-foreground text-lg leading-tight mb-3 group-hover:text-primary transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="text-muted-foreground text-base leading-relaxed line-clamp-3 mb-4">
          {article.description}
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
              {article.source.logo}
            </div>
            <span className="font-medium">{article.source.name}</span>
          </div>
          <span>
            {article.publishedAt.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "2-digit",
              timeZone: "UTC",
            })}
          </span>
        </div>
      </div>
      <div className="shrink-0 relative w-40 h-28 md:w-48 md:h-32">
        <Image
          src={article.image || "/finance.jpg"}
          alt={article.title}
          fill
          sizes="(max-width: 768px) 160px, 192px"
          className="object-cover rounded-md"
        />
      </div>
    </Link>
  )
}
