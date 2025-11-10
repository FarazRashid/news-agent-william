import { useEffect, useState } from "react"

/**
 * Custom hook for debouncing values
 * Prevents excessive re-renders during rapid user input
 * 
 * Usage in filters-sidebar.tsx:
 * 
 * const [searchInput, setSearchInput] = useState(filters.search)
 * const debouncedSearch = useDebounce(searchInput, 300)
 * 
 * useEffect(() => {
 *   updateFilter("search", debouncedSearch)
 * }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Usage example in your search input:
 */
// In filters-sidebar.tsx:
/*
const [searchInput, setSearchInput] = useState(filters.search)
const debouncedSearch = useDebounce(searchInput, 300)

useEffect(() => {
  updateFilter("search", debouncedSearch)
}, [debouncedSearch, updateFilter])

return (
  <Input
    placeholder="Search articles..."
    value={searchInput}
    onChange={(e) => setSearchInput(e.target.value)}
  />
)
*/
