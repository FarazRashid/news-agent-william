"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart3 } from "lucide-react"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts"

type OwnerRow = {
  name: string
  share: number
  change: number
  portfolioPercent: number
  filingDate: string
}

type OwnershipResponse = {
  symbol: string
  owners: OwnerRow[]
  updatedAt: string
  cached?: boolean
  stale?: boolean
}

function truncateLabel(value: string, maxLen: number): string {
  const v = String(value ?? "")
  if (v.length <= maxLen) return v
  return `${v.slice(0, Math.max(0, maxLen - 1))}…`
}

function formatShares(value: number): string {
  if (!Number.isFinite(value)) return "0"
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`
  return String(Math.round(value))
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0%"
  return `${value.toFixed(2)}%`
}

export function StockOwnership({ symbol }: { symbol: string }) {
  const [data, setData] = useState<OwnershipResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const inFlightRef = useRef<AbortController | null>(null)
  const lastSymbolRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    // Abort any prior in-flight request when symbol changes
    if (inFlightRef.current) {
      inFlightRef.current.abort()
      inFlightRef.current = null
    }

    // In React StrictMode (dev), effects may run twice. Avoid refetching if we already
    // loaded this symbol and still have data.
    const normalizedSymbol = symbol.toUpperCase()
    if (lastSymbolRef.current === normalizedSymbol && data) {
      setLoading(false)
      return () => {
        cancelled = true
      }
    }

    lastSymbolRef.current = normalizedSymbol
    const controller = new AbortController()
    inFlightRef.current = controller

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/stocks/ownership?symbol=${encodeURIComponent(symbol)}`, {
          signal: controller.signal,
        })
        if (!res.ok) {
          const body = await res.json().catch(() => null)
          const msg = body?.error ? String(body.error) : `Failed to fetch ownership (${res.status})`
          throw new Error(msg)
        }
        const payload = (await res.json()) as OwnershipResponse
        if (!cancelled) setData(payload)
      } catch (e: any) {
        if (e?.name === "AbortError") return
        if (!cancelled) setError(e?.message || "Failed to load ownership")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [symbol, data])

  const chartData = useMemo(() => {
    const owners = data?.owners || []
    return owners
      .filter((o) => typeof o?.share === "number" && o.share > 0)
      .map((o) => ({
        name: o.name,
        share: o.share,
      }))
  }, [data])

  const maxShare = useMemo(() => {
    if (chartData.length === 0) return 0
    return Math.max(...chartData.map((d) => d.share))
  }, [chartData])

  return (
    <Card className="p-4 fold:p-5 ipad:p-6">
      <div className="flex items-center gap-2 mb-4 fold:mb-5">
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <BarChart3 className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg fold:text-xl font-bold">Ownership (Institutional)</h2>
          <p className="text-xs fold:text-sm text-muted-foreground">
            Top 10 holders by shares (latest filing)
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-56 w-full rounded-lg" />
          <Skeleton className="h-4 w-44" />
        </div>
      ) : error ? (
        <div className="text-sm text-muted-foreground">Error loading ownership: {error}</div>
      ) : chartData.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No institutional ownership data available for {symbol.toUpperCase()}.
        </div>
      ) : (
        <>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 16, bottom: 5, left: 12 }}>
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatShares(Number(v))}
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={160}
                  interval={0}
                  minTickGap={0}
                  tick={({ x, y, payload }) => {
                    const full = String(payload?.value ?? "")
                    const short = truncateLabel(full, 22)
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <title>{full}</title>
                        <text x={0} y={0} dy={4} textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize={12}>
                          {short}
                        </text>
                      </g>
                    )
                  }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload[0]) return null
                    const p: any = payload[0].payload
                    return (
                      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                        <p className="text-sm font-semibold mb-1">{p.name}</p>
                        <p className="text-xs text-muted-foreground">Shares: {formatShares(p.share)}</p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="share" radius={[6, 6, 6, 6]}>
                  {chartData.map((entry, idx) => {
                    const intensity = maxShare > 0 ? entry.share / maxShare : 0
                    const opacity = 0.35 + intensity * 0.65
                    return <Cell key={`cell-${idx}`} fill={`rgba(59, 130, 246, ${opacity})`} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-1 fold:grid-cols-2 gap-3">
              {(data?.owners || []).slice(0, 6).map((o) => (
                <div key={o.name} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{o.name}</p>
                    <p className="text-xs text-muted-foreground">Filed: {o.filingDate || "N/A"}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold tabular-nums">{formatShares(o.share)}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      Portfolio: {formatPercent(o.portfolioPercent)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {data?.updatedAt && (
              <p className="mt-3 text-xs text-muted-foreground">
                Updated: {new Date(data.updatedAt).toLocaleString()}
                {data?.stale ? " • Showing cached data (rate-limited)" : data?.cached ? " • Cached" : ""}
              </p>
            )}
          </div>
        </>
      )}
    </Card>
  )
}
