"use client"

import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNews } from "@/lib/news-context"

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "relevant", label: "Most Relevant" },
] as const

/**
 * Dropdown for sorting articles
 * Syncs with context and saves preference to localStorage
 */
export function SortDropdown() {
  const { sortOrder, setSortOrder } = useNews()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="min-w-[140px] justify-between">
          {SORT_OPTIONS.find((opt) => opt.value === sortOrder)?.label || "Sort"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        {SORT_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setSortOrder(option.value)}
            className="cursor-pointer"
          >
            <span className="flex-1">{option.label}</span>
            {sortOrder === option.value && <Check className="w-4 h-4 ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
