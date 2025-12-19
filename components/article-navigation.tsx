"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Newspaper, TrendingUp, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

type ArticleNavProps = {
  trendingTags?: string[]
}

export function ArticleNavigation({ trendingTags = [] }: ArticleNavProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Back Button + Logo */}
          <div className="flex items-center gap-4">
            <Link href="/feed" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline font-semibold">Back</span>
            </Link>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <Link href="/" className="flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-primary" />
              <span className="font-bold text-lg hidden md:inline">Wealth Manager</span>
            </Link>
          </div>

          {/* Center: Trending Tags (Desktop) */}
          <div className="hidden lg:flex items-center gap-2 overflow-x-auto max-w-md scrollbar-hide">
            <TrendingUp className="w-4 h-4 text-muted-foreground shrink-0" />
            {trendingTags.slice(0, 4).map((tag, idx) => (
              <Link key={idx} href={`/feed?topic=${encodeURIComponent(tag)}`}>
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors capitalize whitespace-nowrap"
                >
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>

          {/* Right: Theme Toggle + CTA */}
          <div className="flex items-center gap-2">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-9 w-9"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button size="sm" className="hidden sm:inline-flex">
              Subscribe
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Trending Tags */}
      <div className="lg:hidden border-t border-border px-4 py-2 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3 h-3 text-muted-foreground shrink-0" />
          {trendingTags.slice(0, 6).map((tag, idx) => (
            <Link key={idx} href={`/feed?topic=${encodeURIComponent(tag)}`}>
              <Badge 
                variant="secondary" 
                className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors capitalize whitespace-nowrap"
              >
                {tag}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
