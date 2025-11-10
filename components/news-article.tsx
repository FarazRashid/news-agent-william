import type { Article } from "@/lib/types"
import Link from "next/link"
import Image from "next/image"

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
              year: "2-digit",
              timeZone: "UTC",
            })}
          </span>
        </div>
      </div>
    </Link>
  )
}
