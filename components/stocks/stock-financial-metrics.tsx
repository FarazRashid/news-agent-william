"use client"

import { useEffect, useState, useMemo } from "react"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Percent,
  DollarSign,
  Activity,
  PieChart,
  LineChart,
  Target,
  Zap,
  Shield,
  Building2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  PieChart as RechartsPieChart,
  Pie,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { cn } from "@/lib/utils"
import type { StockData } from "@/lib/stocks/types"

interface ExtendedMetrics {
  roic?: number
  roe?: number
  roa?: number
  profitMargin?: number
  revenueGrowth?: number
  fcfYield?: number
  debtToEquity?: number
  currentRatio?: number
  quickRatio?: number
  evEbitda?: number
  pegRatio?: number
  epsGrowth?: number
  priceToBook?: number
  priceToSales?: number
  bookValuePerShare?: number
  dividendPayoutRatio?: number
}

interface StockFinancialMetricsProps {
  symbol: string
  stockData: StockData
}

function pickMetricValue(metric: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const val = metric[key]
    if (typeof val === "number" && Number.isFinite(val)) return val
    if (typeof val === "string") {
      const n = Number.parseFloat(val)
      if (Number.isFinite(n)) return n
    }
  }
  return undefined
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  trend,
  colorClass = "from-primary/10 to-primary/5",
}: {
  icon: React.ElementType
  label: string
  value: string
  subtext?: string
  trend?: "up" | "down" | "neutral"
  colorClass?: string
}) {
  return (
    <Card
      className={cn(
        "relative p-5 bg-gradient-to-br border-border/50 hover:border-primary/40 hover:shadow-lg transition-all duration-300 group overflow-hidden",
        colorClass
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Icon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          {trend && (
            <Badge
              variant="secondary"
              className={cn(
                "ml-auto text-xs",
                trend === "up" && "bg-green-500/10 text-green-600 dark:text-green-400",
                trend === "down" && "bg-red-500/10 text-red-600 dark:text-red-400"
              )}
            >
              {trend === "up" ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : trend === "down" ? (
                <ArrowDownRight className="w-3 h-3" />
              ) : null}
            </Badge>
          )}
        </div>
        <p className="text-3xl font-bold tabular-nums bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent mb-1">
          {value}
        </p>
        {subtext && (
          <p className="text-xs text-muted-foreground font-medium">{subtext}</p>
        )}
      </div>
    </Card>
  )
}

export function StockFinancialMetrics({
  symbol,
  stockData,
}: Readonly<StockFinancialMetricsProps>) {
  const [metrics, setMetrics] = useState<ExtendedMetrics>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const url = `/api/stocks/metric?symbol=${encodeURIComponent(symbol)}`
    fetch(url, { cache: "no-store" })
      .then((res) => res.json())
      .then((json: { metric?: Record<string, unknown> }) => {
        if (cancelled) return
        const metric = json?.metric || {}
        const extended: ExtendedMetrics = {
          roic: pickMetricValue(metric, [
            "returnOnInvestedCapital",
            "roic",
            "returnOnInvestedCapitalTTM",
            "roicTTM",
          ]),
          roe: pickMetricValue(metric, [
            "returnOnEquity",
            "roe",
            "returnOnEquityTTM",
            "roeTTM",
          ]),
          roa: pickMetricValue(metric, [
            "returnOnAssets",
            "roa",
            "returnOnAssetsTTM",
            "roaTTM",
          ]),
          profitMargin: pickMetricValue(metric, [
            "operatingMargin",
            "netProfitMargin",
            "profitMargin",
            "operatingMarginTTM",
            "netProfitMarginTTM",
          ]),
          revenueGrowth: pickMetricValue(metric, [
            "revenueGrowth",
            "revenueGrowthRate",
            "revenueGrowthTTM",
            "revenueGrowthYOY",
          ]),
          fcfYield: pickMetricValue(metric, [
            "freeCashFlowYield",
            "fcfYield",
            "freeCashFlowYieldTTM",
          ]),
          debtToEquity: pickMetricValue(metric, [
            "debtToEquity",
            "debtEquityRatio",
            "debtToEquityTTM",
          ]),
          currentRatio: pickMetricValue(metric, [
            "currentRatio",
            "currentRatioTTM",
          ]),
          quickRatio: pickMetricValue(metric, [
            "quickRatio",
            "quickRatioTTM",
            "acidTestRatio",
          ]),
          evEbitda: pickMetricValue(metric, ["evEbitda", "evEbitdaTTM", "enterpriseValueEbitda"]),
          pegRatio: pickMetricValue(metric, ["pegRatio", "peg", "pegTTM"]),
          epsGrowth: pickMetricValue(metric, [
            "epsGrowth",
            "epsGrowthRate",
            "epsGrowthTTM",
            "epsGrowthYOY",
          ]),
          priceToBook: pickMetricValue(metric, [
            "priceToBook",
            "pbRatio",
            "priceToBookTTM",
          ]),
          priceToSales: pickMetricValue(metric, [
            "priceToSales",
            "psRatio",
            "priceToSalesTTM",
          ]),
          bookValuePerShare: pickMetricValue(metric, [
            "bookValuePerShare",
            "bookValuePerShareTTM",
          ]),
          dividendPayoutRatio: pickMetricValue(metric, [
            "dividendPayoutRatio",
            "payoutRatio",
            "dividendPayoutRatioTTM",
          ]),
        }
        setMetrics(extended)
      })
      .catch(() => setMetrics({}))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [symbol])

  // Performance metrics (no color property)
  const performanceData = useMemo(() => {
    const data: Array<{ name: string; value: number }> = []
    if (metrics.roic != null) data.push({ name: "ROIC", value: metrics.roic })
    if (metrics.roe != null) data.push({ name: "ROE", value: metrics.roe })
    if (metrics.roa != null) data.push({ name: "ROA", value: metrics.roa })
    if (metrics.profitMargin != null) data.push({ name: "Profit Margin", value: metrics.profitMargin })
    return data
  }, [metrics])

  const performanceColors = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"]

  // Growth metrics
  const growthData = useMemo(() => {
    const data: Array<{ name: string; value: number }> = []
    if (metrics.revenueGrowth != null) data.push({ name: "Revenue Growth", value: metrics.revenueGrowth })
    if (metrics.epsGrowth != null) data.push({ name: "EPS Growth", value: metrics.epsGrowth })
    return data
  }, [metrics])

  // Valuation metrics
  const valuationData = useMemo(() => {
    const data: Array<{ name: string; value: number }> = []
    if (stockData.peRatio != null) data.push({ name: "P/E", value: stockData.peRatio })
    if (metrics.priceToBook != null) data.push({ name: "P/B", value: metrics.priceToBook })
    if (metrics.priceToSales != null) data.push({ name: "P/S", value: metrics.priceToSales })
    if (metrics.evEbitda != null) data.push({ name: "EV/EBITDA", value: metrics.evEbitda })
    if (metrics.pegRatio != null) data.push({ name: "PEG", value: metrics.pegRatio })
    return data
  }, [stockData.peRatio, metrics])

  const valuationColors = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"]

  // Debt structure (no color property)
  const debtStructureData = useMemo(() => {
    if (metrics.debtToEquity == null) return []
    const debtRatio = metrics.debtToEquity / (1 + metrics.debtToEquity)
    const equityRatio = 1 - debtRatio
    return [
      { name: "Debt", value: Math.round(debtRatio * 100) },
      { name: "Equity", value: Math.round(equityRatio * 100) },
    ]
  }, [metrics.debtToEquity])

  const debtColors = ["#ef4444", "#10b981"]

  const hasData = Object.values(metrics).some((v) => v != null)

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-card via-card to-card/80 border-border shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-6 h-6 rounded-lg" />
          <Skeleton className="h-7 w-64 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={`skeleton-${i}`} className="h-32 rounded-xl" />
          ))}
        </div>
      </Card>
    )
  }

  if (!hasData) {
    return null
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-card via-card to-card/80 border-border shadow-xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
          Financial Metrics & Analysis
        </h2>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Performance Metrics Bar Chart */}
        {performanceData.length > 0 && (
          <Card className="p-5 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5 border-border/50 shadow-md hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-violet-500" />
              <span className="font-bold text-base">Performance Metrics (%)</span>
            </div>
            <div className="h-72">
              <ChartContainer
                config={{
                  roic: { label: "ROIC" },
                  roe: { label: "ROE" },
                  roa: { label: "ROA" },
                  profitMargin: { label: "Profit Margin" },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <defs>
                      {performanceColors.map((color, idx) => (
                        <linearGradient key={`gradient-${idx}`} id={`barGradient${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                          <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                        </linearGradient>
                      ))}
                    </defs>
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={60}>
                      {performanceData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#barGradient${index})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </Card>
        )}

        {/* Valuation Metrics Bar Chart */}
        {valuationData.length > 0 && (
          <Card className="p-5 bg-gradient-to-br from-cyan-500/5 via-transparent to-green-500/5 border-border/50 shadow-md hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-cyan-500" />
              <span className="font-bold text-base">Valuation Ratios</span>
            </div>
            <div className="h-72">
              <ChartContainer
                config={{
                  peRatio: { label: "P/E" },
                  priceToBook: { label: "P/B" },
                  priceToSales: { label: "P/S" },
                  evEbitda: { label: "EV/EBITDA" },
                  pegRatio: { label: "PEG" },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={valuationData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <defs>
                      {valuationColors.map((color, idx) => (
                        <linearGradient key={`val-gradient-${idx}`} id={`valGradient${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                          <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                        </linearGradient>
                      ))}
                    </defs>
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={50}>
                      {valuationData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#valGradient${index})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </Card>
        )}

        {/* Growth Metrics Area Chart */}
        {growthData.length > 0 && (
          <Card className="p-5 bg-gradient-to-br from-green-500/5 via-transparent to-amber-500/5 border-border/50 shadow-md hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <LineChart className="w-5 h-5 text-green-500" />
              <span className="font-bold text-base">Growth Rates (%)</span>
            </div>
            <div className="h-72">
              <ChartContainer
                config={{
                  revenueGrowth: { label: "Revenue Growth" },
                  epsGrowth: { label: "EPS Growth" },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      strokeWidth={3}
                      fill="url(#areaGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </Card>
        )}

        {/* Debt Structure Pie Chart */}
        {debtStructureData.length > 0 && (
          <Card className="p-5 bg-gradient-to-br from-rose-500/5 via-transparent to-emerald-500/5 border-border/50 shadow-md hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-rose-500" />
              <span className="font-bold text-base">Capital Structure</span>
            </div>
            <div className="h-72">
              <ChartContainer
                config={{
                  debt: { label: "Debt" },
                  equity: { label: "Equity" },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <defs>
                      <linearGradient id="debtGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#dc2626" stopOpacity={0.7} />
                      </linearGradient>
                      <linearGradient id="equityGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={debtStructureData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={100}
                      dataKey="value"
                      stroke="hsl(var(--border))"
                      strokeWidth={2}
                    >
                      {debtStructureData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? "url(#debtGradient)" : "url(#equityGradient)"}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </Card>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Company Info Header */}
        <Card className="col-span-2 sm:col-span-3 lg:col-span-4 p-5 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/30 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            <span className="font-bold uppercase tracking-wider text-sm">Company Information</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1 font-medium">Company</p>
              <p className="font-bold text-base">{stockData.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 font-medium">Ticker</p>
              <p className="font-bold text-base text-primary">{stockData.symbol}</p>
            </div>
            {stockData.industry && (
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">Industry</p>
                <p className="font-bold text-base">{stockData.industry}</p>
              </div>
            )}
            {stockData.sector && (
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">Sector</p>
                <p className="font-bold text-base">{stockData.sector}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Metric Cards */}
        {metrics.roic != null && (
          <MetricCard
            icon={TrendingUp}
            label="ROIC"
            value={`${metrics.roic.toFixed(1)}%`}
            subtext="Return on Invested Capital"
            trend={metrics.roic > 15 ? "up" : metrics.roic < 5 ? "down" : "neutral"}
            colorClass="from-violet-500/10 to-violet-500/5"
          />
        )}

        {metrics.roe != null && (
          <MetricCard
            icon={Zap}
            label="ROE"
            value={`${metrics.roe.toFixed(1)}%`}
            subtext="Return on Equity"
            trend={metrics.roe > 15 ? "up" : metrics.roe < 5 ? "down" : "neutral"}
            colorClass="from-cyan-500/10 to-cyan-500/5"
          />
        )}

        {metrics.roa != null && (
          <MetricCard
            icon={Target}
            label="ROA"
            value={`${metrics.roa.toFixed(1)}%`}
            subtext="Return on Assets"
            trend={metrics.roa > 5 ? "up" : metrics.roa < 2 ? "down" : "neutral"}
            colorClass="from-green-500/10 to-green-500/5"
          />
        )}

        {metrics.profitMargin != null && (
          <MetricCard
            icon={Percent}
            label="Profit Margin"
            value={`${metrics.profitMargin.toFixed(1)}%`}
            subtext="Operating Margin"
            trend={metrics.profitMargin > 20 ? "up" : metrics.profitMargin < 5 ? "down" : "neutral"}
            colorClass="from-amber-500/10 to-amber-500/5"
          />
        )}

        {metrics.revenueGrowth != null && (
          <MetricCard
            icon={LineChart}
            label="Revenue Growth"
            value={`${metrics.revenueGrowth.toFixed(1)}%`}
            subtext="Year-over-Year"
            trend={metrics.revenueGrowth > 10 ? "up" : metrics.revenueGrowth < 0 ? "down" : "neutral"}
            colorClass="from-emerald-500/10 to-emerald-500/5"
          />
        )}

        {metrics.fcfYield != null && (
          <MetricCard
            icon={DollarSign}
            label="FCF Yield"
            value={`${metrics.fcfYield.toFixed(2)}%`}
            subtext="Free Cash Flow Yield"
            colorClass="from-teal-500/10 to-teal-500/5"
          />
        )}

        {metrics.debtToEquity != null && (
          <MetricCard
            icon={Building2}
            label="Debt/Equity"
            value={metrics.debtToEquity.toFixed(2)}
            subtext="Debt to Equity Ratio"
            trend={metrics.debtToEquity < 0.5 ? "up" : metrics.debtToEquity > 2 ? "down" : "neutral"}
            colorClass="from-rose-500/10 to-rose-500/5"
          />
        )}

        {metrics.currentRatio != null && (
          <MetricCard
            icon={Shield}
            label="Current Ratio"
            value={metrics.currentRatio.toFixed(2)}
            subtext="Liquidity Ratio"
            trend={metrics.currentRatio > 1.5 ? "up" : metrics.currentRatio < 1 ? "down" : "neutral"}
            colorClass="from-blue-500/10 to-blue-500/5"
          />
        )}

        {metrics.quickRatio != null && (
          <MetricCard
            icon={Shield}
            label="Quick Ratio"
            value={metrics.quickRatio.toFixed(2)}
            subtext="Acid Test Ratio"
            trend={metrics.quickRatio > 1 ? "up" : metrics.quickRatio < 0.5 ? "down" : "neutral"}
            colorClass="from-indigo-500/10 to-indigo-500/5"
          />
        )}

        {metrics.priceToBook != null && (
          <MetricCard
            icon={BarChart3}
            label="P/B Ratio"
            value={metrics.priceToBook.toFixed(2)}
            subtext="Price to Book"
            colorClass="from-purple-500/10 to-purple-500/5"
          />
        )}

        {metrics.priceToSales != null && (
          <MetricCard
            icon={BarChart3}
            label="P/S Ratio"
            value={metrics.priceToSales.toFixed(2)}
            subtext="Price to Sales"
            colorClass="from-pink-500/10 to-pink-500/5"
          />
        )}

        {metrics.evEbitda != null && (
          <MetricCard
            icon={PieChart}
            label="EV/EBITDA"
            value={`${metrics.evEbitda.toFixed(1)}x`}
            subtext="Enterprise Value / EBITDA"
            colorClass="from-fuchsia-500/10 to-fuchsia-500/5"
          />
        )}

        {metrics.pegRatio != null && (
          <MetricCard
            icon={Activity}
            label="PEG Ratio"
            value={metrics.pegRatio.toFixed(2)}
            subtext="Price/Earnings to Growth"
            colorClass="from-orange-500/10 to-orange-500/5"
          />
        )}

        {metrics.epsGrowth != null && (
          <MetricCard
            icon={TrendingUp}
            label="EPS Growth"
            value={`${metrics.epsGrowth.toFixed(1)}%`}
            subtext="Earnings Per Share Growth"
            trend={metrics.epsGrowth > 10 ? "up" : metrics.epsGrowth < 0 ? "down" : "neutral"}
            colorClass="from-lime-500/10 to-lime-500/5"
          />
        )}

        {metrics.bookValuePerShare != null && (
          <MetricCard
            icon={DollarSign}
            label="Book Value"
            value={`$${metrics.bookValuePerShare.toFixed(2)}`}
            subtext="Per Share"
            colorClass="from-sky-500/10 to-sky-500/5"
          />
        )}

        {metrics.dividendPayoutRatio != null && (
          <MetricCard
            icon={Percent}
            label="Payout Ratio"
            value={`${metrics.dividendPayoutRatio.toFixed(1)}%`}
            subtext="Dividend Payout"
            colorClass="from-red-500/10 to-red-500/5"
          />
        )}
      </div>
    </Card>
  )
}
