"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import type { Article } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client"
import { fetchArticleById } from "@/lib/articles"
import { ArticleMetadata, ArticleSEOKeywords } from "@/components/article-metadata"

export default function ArticleClient({ id }: { id: string }) {
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const supabase = createSupabaseBrowserClient()
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const parsedId = isNaN(Number(id)) ? id : Number(id)
        const a = await fetchArticleById(supabase, parsedId)
        if (!cancelled) setArticle(a)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load article")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-muted-foreground">Loading article...</div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{error ? "Failed to load article" : "Article not found"}</h1>
          <Link href="/">
            <Button variant="default">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Format content preserving single newlines as <br />, double+ newlines as paragraph breaks,
  // detect simple markdown-style headings (#, ##, ###) and bullet lists (- or *).
  const formattedContent = (() => {
    if (!article.content) return [] as React.ReactElement[]
    // Some rows may contain literal "\n" sequences instead of actual newlines; convert them first.
    const raw = article.content
      .replace(/\\n/g, "\n") // turn escaped sequences into real newlines
      .replace(/\r\n/g, "\n")
      .trim()
    if (!raw) return []
    const blocks = raw.split(/\n{2,}/)
    const elements: React.ReactElement[] = []
    blocks.forEach((block, bi) => {
      const lines = block.split(/\n/).map(l => l.replace(/\s+$/,'')).filter(Boolean)
      if (!lines.length) return
      // List detection: at least 2 lines and every line starts with - or * followed by space
      const isList = lines.length > 1 && lines.every(l => /^[-*]\s+/.test(l))
      if (isList) {
        elements.push(
          <ul key={`ul-${bi}`} className="list-disc pl-6 space-y-1">
            {lines.map((l, i) => (
              <li key={i}>{l.replace(/^[-*]\s+/, "")}</li>
            ))}
          </ul>
        )
        return
      }
      // Heading detection only for first line
      const headingMatch = /^(#{1,6})\s+(.*)$/.exec(lines[0])
      let consumedHeading = false
      if (headingMatch) {
        const level = Math.min(headingMatch[1].length, 6)
        const text = headingMatch[2].trim()
        const hClasses =
          level <= 2
            ? "mt-8 mb-3 font-bold text-3xl md:text-4xl leading-tight"
            : level === 3
              ? "mt-6 mb-2 font-semibold text-2xl"
              : "mt-4 mb-2 font-semibold text-xl"
        switch (level) {
          case 1:
            elements.push(<h1 key={`h-${bi}`} className={hClasses}>{text}</h1>)
            break
          case 2:
            elements.push(<h2 key={`h-${bi}`} className={hClasses}>{text}</h2>)
            break
          case 3:
            elements.push(<h3 key={`h-${bi}`} className={hClasses}>{text}</h3>)
            break
          case 4:
            elements.push(<h4 key={`h-${bi}`} className={hClasses}>{text}</h4>)
            break
          case 5:
            elements.push(<h5 key={`h-${bi}`} className={hClasses}>{text}</h5>)
            break
          default:
            elements.push(<h6 key={`h-${bi}`} className={hClasses}>{text}</h6>)
            break
        }
        lines.shift()
        consumedHeading = true
      }
      if (lines.length) {
        elements.push(
          <p key={`p-${bi}${consumedHeading?'-after':''}`} className="leading-7 text-foreground">
            {lines.map((ln, i) => (
              <span key={i}>
                {ln}
                {i < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        )
      }
    })
    return elements
  })()

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-lg">Back</span>
          </Link>
        </div>
      </div>

      <main className="px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="space-y-4">
            <ArticleMetadata article={article} />

            <h1 className="text-3xl md:text-4xl font-bold leading-tight">{article.title}</h1>
            {article.subheadline ? (
              <p className="text-lg text-muted-foreground">{article.subheadline}</p>
            ) : (
              article.description && (
                <p className="text-lg text-muted-foreground">{article.description}</p>
              )
            )}
            <div className="flex items-center gap-3 text-sm text-muted-foreground pt-2 border-t border-border">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                {article.source.logo}
              </div>
              <span className="font-medium">{article.source.name}</span>
              <span>•</span>
              <span>{formatDate(article.publishedAt)}</span>
            </div>
          </div>

          <div className="relative w-full h-64 md:h-80 bg-muted rounded-md overflow-hidden">
            <Image src={article.image || "/placeholder.svg"} alt={article.title} fill className="object-cover" />
            {article.imageSuggestions && article.imageSuggestions.length > 1 && (
              <div className="absolute bottom-2 left-2 flex gap-2 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md">
                {article.imageSuggestions.slice(0,5).map((img, i) => (
                  <button
                    key={img}
                    onClick={() => {
                      // swap hero image to selected suggestion
                      setArticle(a => a ? { ...a, image: img } : a)
                    }}
                    className={`w-10 h-8 rounded overflow-hidden border border-border hover:ring-1 ring-primary transition ${article.image === img ? 'outline outline-2 outline-primary' : ''}`}
                    title={`Use image ${i+1}`}
                  >
                    <Image src={img} alt="suggestion" width={40} height={32} className="object-cover w-full h-full" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <Card className="p-6 space-y-4 border border-border">
            {article.lead && (
              <p className="text-base leading-7 text-foreground font-medium">
                {article.lead}
              </p>
            )}
            {formattedContent.length > 0 ? (
              formattedContent
            ) : (
              <p className="text-muted-foreground">No content available for this article.</p>
            )}
            {article.conclusion && (
              <>
                <hr className="my-2 border-border" />
                <h3 className="text-lg font-semibold">Conclusion</h3>
                <p className="text-foreground leading-7">{article.conclusion}</p>
              </>
            )}
          </Card>

          {/* SEO Keywords at the bottom */}
          <ArticleSEOKeywords article={article} />
        </div>
      </main>
    </div>
  )
}
