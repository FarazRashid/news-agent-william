"use client"

import Link from "next/link"
import { Newspaper, Moon, Sun, TrendingUp, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

export default function Header() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto padding-responsive py-3 fold:py-4">
        <div className="flex items-center justify-between gap-2 fold:gap-4">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Newspaper className="w-4 h-4 fold:w-5 fold:h-5 text-primary" />
            <span className="font-bold text-base fold:text-lg ipad:text-xl">Wealth Manager</span>
          </Link>

          {/* Right: Navigation + CTA */}
          <div className="flex items-center gap-1 fold:gap-2">
            {/* Stocks Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 fold:gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden fold:inline">Stocks</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/stocks/market" className="cursor-pointer">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Market Overview
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/stocks/watchlist" className="cursor-pointer">
                    <Search className="mr-2 h-4 w-4" />
                    My Watchlist
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-9 w-9 fold:h-10 fold:w-10"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            )} */}
            <Button size="sm" className="hidden fold:inline-flex ipad:text-base">
              Subscribe
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
