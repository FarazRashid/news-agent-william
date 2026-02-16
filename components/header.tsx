"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Newspaper, TrendingUp, Search, Rss } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const navLinkClass =
  "inline-flex items-center gap-1 fold:gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

export default function Header() {
  const pathname = usePathname()

  const isNews = pathname === "/feed"
  const isStocksSection =
    pathname?.startsWith("/stocks/market") ||
    pathname?.startsWith("/stocks/watchlist") ||
    pathname?.startsWith("/stocks/")

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto padding-responsive py-3 fold:py-4">
        <div className="flex items-center justify-between gap-2 fold:gap-4">
          {/* Left: Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Newspaper className="w-4 h-4 fold:w-5 fold:h-5 text-primary" />
            <span className="font-bold text-base fold:text-lg ipad:text-xl">
              Wealth Manager
            </span>
          </Link>

          {/* Right: Nav (News, Stocks) + CTA */}
          <nav className="flex items-center gap-1 fold:gap-2" aria-label="Main">
            {/* News – always visible */}
            <Link
              href="/feed"
              className={cn(
                navLinkClass,
                isNews && "bg-accent text-accent-foreground",
              )}
              aria-current={isNews ? "page" : undefined}
            >
              <Rss className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden fold:inline">News</span>
            </Link>

            {/* Stocks: Market + Watchlist */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-1 fold:gap-2",
                    isStocksSection && "bg-accent text-accent-foreground",
                  )}
                  aria-expanded={undefined}
                  aria-haspopup="menu"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden fold:inline">Stocks</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48" role="menu">
                <DropdownMenuItem asChild>
                  <Link
                    href="/stocks/market"
                    className="cursor-pointer"
                    role="menuitem"
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Market Overview
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/stocks/watchlist"
                    className="cursor-pointer"
                    role="menuitem"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    My Watchlist
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/feed"
                    className="cursor-pointer"
                    role="menuitem"
                  >
                    <Rss className="mr-2 h-4 w-4" />
                    News
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              className="hidden fold:inline-flex ipad:text-base"
            >
              Subscribe
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}
