import Link from "next/link"
import Image from "next/image"
import { ExternalLink } from "lucide-react"

export type ReferenceArticle = {
  name: string
  url?: string
  domain?: string
  title?: string
}

const logoMap: Record<string, string> = {
  // domain bases
  nytimes: "/news-logos/nyt.png",
  bbc: "/news-logos/bbc.jpg",
  aljazeera: "/news-logos/aljazeera.png",
  guardian: "/news-logos/guardian.jpg",
  financialtimes: "/news-logos/financialtimes.png",
  reuters: "/news-logos/reuters.jpg",
  wsj: "/news-logos/wsj.png",
  bloomberg: "/news-logos/bloomberg.jpg",
  cnbc: "/news-logos/cnbc.jpg",
  // name variants
  "the new york times": "/news-logos/nyt.png",
  "financial times": "/news-logos/financialtimes.png",
  "wall street journal": "/news-logos/wsj.png",
  "the guardian": "/news-logos/guardian.jpg",
}

function normalize(str?: string | null): string {
  return (str || "")
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/\.(com|co|org|net|io)$/g, "")
    .replace(/[^a-z0-9 ]+/g, "")
    .trim()
}

function pickLogo(name?: string, domain?: string): string | undefined {
  const dn = normalize(domain).split(".")[0]
  if (dn && logoMap[dn]) return logoMap[dn]
  const nameKey = normalize(name)
  if (nameKey && logoMap[nameKey]) return logoMap[nameKey]
  // Try collapsing spaces
  const compact = nameKey.replace(/\s+/g, "")
  if (compact && logoMap[compact]) return logoMap[compact]
  return undefined
}

function prettyUrl(url?: string, domain?: string): string | undefined {
  const raw = url || domain
  if (!raw) return undefined
  return raw
    .trim()
    .replace(/^https?:\/\/(www\.)?/i, "")
    .replace(/\/$/, "")
}

export default function ReferenceArticleCard({ refArticle }: { refArticle: ReferenceArticle }) {
  const href = refArticle.url || (refArticle.domain ? `https://${refArticle.domain}` : undefined)
  if (!href) return null
  const logoSrc = pickLogo(refArticle.name, refArticle.domain)
  const initial = (refArticle.name || refArticle.domain || "?").trim().charAt(0).toUpperCase() || "?"

  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="group block bg-card border border-border rounded-lg p-5 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-3">
        {logoSrc ? (
          <Image
            src={logoSrc}
            alt={refArticle.name}
            width={36}
            height={36}
            className="w-9 h-9 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
            {initial}
          </div>
        )}
        <div className="min-w-0">
          <div className="font-semibold min-h-12 max-h-12 text-foreground text-sm sm:text-base line-clamp-2">
            {refArticle.title || refArticle.name}
          </div>
          {(refArticle.url || refArticle.domain) && (
            <div
              className="text-xs text-muted-foreground break-all"
              title={prettyUrl(refArticle.url, refArticle.domain)}
            >
              {prettyUrl(refArticle.url, refArticle.domain)}
            </div>
          )}
        </div>
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-primary group-hover:underline whitespace-nowrap">
          Open original
          <ExternalLink className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  )
}
