const STORAGE_KEY = "stock-watchlist"

export type WatchlistStock = {
  symbol: string
  addedAt: string
}

const safeGetSessionStorage = (): Storage | null => {
  if (typeof window === "undefined") return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

const readRawWatchlist = (): unknown => {
  const storage = safeGetSessionStorage()
  if (!storage) return null

  try {
    const value = storage.getItem(STORAGE_KEY)
    if (!value) return null
    return JSON.parse(value)
  } catch {
    return null
  }
}

const writeRawWatchlist = (list: WatchlistStock[]): void => {
  const storage = safeGetSessionStorage()
  if (!storage) return

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // Ignore quota errors and fail silently – watchlist is a convenience feature
  }
}

const normaliseWatchlist = (raw: unknown): WatchlistStock[] => {
  if (!Array.isArray(raw)) return []

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const symbol = (item as any).symbol
      const addedAt = (item as any).addedAt
      if (typeof symbol !== "string") return null
      return {
        symbol: symbol.toUpperCase(),
        addedAt: typeof addedAt === "string" ? addedAt : new Date().toISOString(),
      } satisfies WatchlistStock
    })
    .filter(Boolean) as WatchlistStock[]
}

export const getWatchlist = (): WatchlistStock[] => {
  const raw = readRawWatchlist()
  return normaliseWatchlist(raw)
}

const saveWatchlist = (list: WatchlistStock[]): WatchlistStock[] => {
  const deduped: WatchlistStock[] = []
  const seen = new Set<string>()

  for (const item of list) {
    const key = item.symbol.toUpperCase()
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push({ ...item, symbol: key })
  }

  writeRawWatchlist(deduped)
  return deduped
}

export const isSymbolWatchlisted = (symbol: string): boolean => {
  const list = getWatchlist()
  const upper = symbol.toUpperCase()
  return list.some((item) => item.symbol === upper)
}

export const addSymbolToWatchlist = (symbol: string): WatchlistStock[] => {
  const upper = symbol.toUpperCase().trim()
  if (!upper) return getWatchlist()

  const existing = getWatchlist()
  if (existing.some((item) => item.symbol === upper)) {
    return existing
  }

  const next = [
    ...existing,
    {
      symbol: upper,
      addedAt: new Date().toISOString(),
    },
  ]

  return saveWatchlist(next)
}

export const removeSymbolFromWatchlist = (symbol: string): WatchlistStock[] => {
  const upper = symbol.toUpperCase().trim()
  if (!upper) return getWatchlist()

  const existing = getWatchlist()
  const next = existing.filter((item) => item.symbol !== upper)
  return saveWatchlist(next)
}

export const toggleSymbolInWatchlist = (
  symbol: string,
): { list: WatchlistStock[]; isWatchlisted: boolean } => {
  const upper = symbol.toUpperCase().trim()
  if (!upper) {
    return { list: getWatchlist(), isWatchlisted: false }
  }

  const existing = getWatchlist()
  const isAlready = existing.some((item) => item.symbol === upper)

  if (isAlready) {
    const list = saveWatchlist(existing.filter((item) => item.symbol !== upper))
    return { list, isWatchlisted: false }
  }

  const list = saveWatchlist([
    ...existing,
    { symbol: upper, addedAt: new Date().toISOString() },
  ])
  return { list, isWatchlisted: true }
}

