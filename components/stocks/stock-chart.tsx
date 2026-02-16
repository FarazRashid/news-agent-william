"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceDot,
} from "recharts";
import { fetchStockChartData, formatTimeRangeDisplay } from "@/lib/stocks/api";
import type { TimeRange, StockPrice } from "@/lib/stocks/types";
import { formatPrice } from "@/lib/stocks/utils";

type NewsItem = { datetimeMs: number; headline: string };

function parseNewsDatetime(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") {
    if (raw > 1e12) return raw; // already ms
    return raw * 1000; // unix seconds -> ms
  }
  if (typeof raw === "string") {
    const ms = new Date(raw).getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  return null;
}

function getDaysBackForRange(timeRange: TimeRange): number {
  switch (timeRange) {
    case "1D":
    case "5D":
      return 7;
    case "1M":
      return 31;
    case "3M":
      return 92;
    case "6M":
      return 185;
    case "1Y":
      return 365;
    case "5Y":
      return 365 * 5;
    default:
      return 30;
  }
}

interface StockChartProps {
  symbol: string;
  currentPrice?: number;
  defaultTimeRange?: TimeRange;
  onHoverPoint?: (point: { timestamp: number; price: number } | null) => void;
  /** Rendered inside the chart card, below the chart (e.g. compare + news). */
  contentBelowChart?: React.ReactNode;
}

const TIME_RANGES: TimeRange[] = ["1D", "5D", "1M", "3M", "6M", "1Y", "5Y"];

export function StockChart({
  symbol,
  currentPrice,
  defaultTimeRange = "1D",
  onHoverPoint,
  contentBelowChart,
}: StockChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange);
  const [chartData, setChartData] = useState<StockPrice[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPrice, setHoveredPrice] = useState<number | null>(null);

  useEffect(() => {
    const loadChartData = async () => {
      setLoading(true);
      try {
        const data = await fetchStockChartData(symbol, timeRange);
        setChartData(data.prices);
      } catch (error) {
        console.error("Error loading chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
  }, [symbol, timeRange]);

  useEffect(() => {
    const daysBack = getDaysBackForRange(timeRange);
    let cancelled = false;
    const loadNews = async () => {
      try {
        const res = await fetch(
          `/api/stocks/news?symbol=${encodeURIComponent(symbol)}&daysBack=${daysBack}`,
        );
        if (!res.ok || cancelled) return;
        const payload = (await res.json()) as {
          news?: Array<{
            datetime?: unknown;
            datetimeMs?: number;
            publishedDate?: unknown;
            time?: unknown;
            headline?: string;
          }>;
        };
        const list = Array.isArray(payload.news)
          ? payload.news
              .map((n) => {
                const ms =
                  typeof n.datetimeMs === "number" && Number.isFinite(n.datetimeMs)
                    ? n.datetimeMs
                    : parseNewsDatetime(n.datetime) ??
                      parseNewsDatetime(n.publishedDate) ??
                      parseNewsDatetime(n.time);
                if (ms == null || !Number.isFinite(ms)) return null;
                return {
                  datetimeMs: ms,
                  headline: typeof n.headline === "string" ? n.headline : "",
                };
              })
              .filter((x): x is NewsItem => x !== null)
          : [];
        if (!cancelled) setNewsItems(list);
      } catch {
        if (!cancelled) setNewsItems([]);
      }
    };
    loadNews();
    return () => {
      cancelled = true;
    };
  }, [symbol, timeRange]);

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);
    if (timeRange === "1D" || timeRange === "5D") {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatTooltipLabel = (timestamp: number) => {
    const date = new Date(timestamp);
    if (timeRange === "1D" || timeRange === "5D") {
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const firstPrice = chartData[0]?.close || currentPrice || 0;
  const lastPrice = chartData[chartData.length - 1]?.close || currentPrice || 0;
  const priceChange = lastPrice - firstPrice;
  const isPositive = priceChange >= 0;

  // Map news to chart coordinates: news within chart range (plus same day as last candle), one dot per candle
  const newsPoints = useMemo(() => {
    if (chartData.length === 0 || newsItems.length === 0) {
      console.log("[Chart] No news dots: chartData or newsItems empty", {
        chartPoints: chartData.length,
        newsItems: newsItems.length,
      });
      return [];
    }
    const tMin = chartData[0].timestamp;
    const tMax = chartData[chartData.length - 1].timestamp;
    const oneDayMs = 86400000;
    const tMaxInclusive = tMax + oneDayMs;

    console.log("[Chart] News mapping:", {
      symbol,
      timeRange,
      chartRange: {
        tMin: new Date(tMin).toISOString(),
        tMax: new Date(tMax).toISOString(),
        tMaxInclusive: new Date(tMaxInclusive).toISOString(),
      },
      totalNewsItems: newsItems.length,
      sampleNews: newsItems.slice(0, 3).map((n) => ({
        headline: n.headline.slice(0, 50),
        datetime: new Date(n.datetimeMs).toISOString(),
      })),
    });

    const points: { timestamp: number; price: number; headline: string }[] = [];
    const seenKey = new Set<string>();
    let inRangeCount = 0;

    for (const n of newsItems) {
      const tsMs = n.datetimeMs;
      if (tsMs < tMin || tsMs > tMaxInclusive) continue;
      inRangeCount++;

      let best = chartData[0];
      let bestDiff = Math.abs(chartData[0].timestamp - tsMs);
      for (let i = 1; i < chartData.length; i++) {
        const d = Math.abs(chartData[i].timestamp - tsMs);
        if (d < bestDiff) {
          bestDiff = d;
          best = chartData[i];
        }
      }

      const key = `${best.timestamp}`;
      if (seenKey.has(key)) continue;
      seenKey.add(key);
      points.push({ timestamp: best.timestamp, price: best.close, headline: n.headline });
    }

    console.log("[Chart] News dots result:", {
      inRangeCount,
      uniqueDots: points.length,
      sampleDots: points.slice(0, 3).map((p) => ({
        date: new Date(p.timestamp).toISOString(),
        price: p.price,
        headline: p.headline.slice(0, 40),
      })),
    });

    return points;
  }, [chartData, newsItems, symbol, timeRange]);

  return (
    <Card className="p-4 fold:p-5 ipad:p-6">
      {/* Header */}
      <div className="flex flex-col fold:flex-row fold:items-center fold:justify-between gap-3 fold:gap-4 mb-4 fold:mb-6">
        <div>
          <h2 className="text-lg fold:text-xl font-bold mb-1">Price Chart</h2>
          {hoveredPrice !== null && (
            <p className="text-2xl fold:text-3xl font-bold tabular-nums">
              ${formatPrice(hoveredPrice)}
            </p>
          )}
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-1 fold:gap-1.5 overflow-x-auto scrollbar-hide">
          {TIME_RANGES.map((range) => (
            <Badge
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              className="cursor-pointer text-xs fold:text-sm tap-target whitespace-nowrap flex-shrink-0"
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Badge>
          ))}
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-64 fold:h-72 ipad:h-80 w-full rounded-lg" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ) : chartData.length > 0 ? (
        <>
          <div className="h-64 fold:h-72 ipad:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                onMouseMove={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    const payload = e.activePayload[0].payload as StockPrice;
                    setHoveredPrice(payload.close);
                    onHoverPoint?.({
                      timestamp: payload.timestamp,
                      price: payload.close,
                    });
                  }
                }}
                onMouseLeave={() => {
                  setHoveredPrice(null);
                  onHoverPoint?.(null);
                }}
              >
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={
                        isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"
                      }
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={
                        isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"
                      }
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatXAxis}
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: "12px" }}
                  tickLine={false}
                  minTickGap={50}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tickFormatter={(value) => `$${formatPrice(value)}`}
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: "12px" }}
                  tickLine={false}
                  width={70}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload[0]) return null;
                    const data = payload[0].payload as StockPrice;
                    return (
                      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                        <p className="text-xs text-muted-foreground mb-1">
                          {formatTooltipLabel(data.timestamp)}
                        </p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Open:</span>
                            <span className="font-semibold tabular-nums">
                              ${formatPrice(data.open)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">High:</span>
                            <span className="font-semibold tabular-nums">
                              ${formatPrice(data.high)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Low:</span>
                            <span className="font-semibold tabular-nums">
                              ${formatPrice(data.low)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">
                              Close:
                            </span>
                            <span className="font-semibold tabular-nums">
                              ${formatPrice(data.close)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
                  strokeWidth={2}
                  fill="url(#colorPrice)"
                  animationDuration={300}
                />
                {newsPoints.map((p, i) => (
                  <ReferenceDot
                    key={`${p.timestamp}-${i}`}
                    x={p.timestamp}
                    y={p.price}
                    r={7}
                    fill="#3b82f6"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Info */}
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs fold:text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>Showing {formatTimeRangeDisplay(timeRange)}</span>
              {newsPoints.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#3b82f6] shrink-0" aria-hidden />
                  <span>Dots = news</span>
                </span>
              )}
            </div>
            <span
              className={
                isPositive
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }
            >
              {isPositive ? "↑" : "↓"} ${Math.abs(priceChange).toFixed(2)} (
              {((priceChange / firstPrice) * 100).toFixed(2)}%)
            </span>
          </div>
        </>
      ) : (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No chart data available
        </div>
      )}

      {contentBelowChart ? (
        <div className="mt-4 pt-4 border-t border-border">
          {contentBelowChart}
        </div>
      ) : null}
    </Card>
  );
}
