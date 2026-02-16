"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/header";
import { StockHeader } from "@/components/stocks/stock-header";
import { StockChart } from "@/components/stocks/stock-chart";
import { StockFinancialMetrics } from "@/components/stocks/stock-financial-metrics";
import { StockMetrics } from "@/components/stocks/stock-metrics";
import { StockAISummary } from "@/components/stocks/stock-ai-summary";
import { StockNewsFeed } from "@/components/stocks/stock-news-feed";
import { StockOwnership } from "@/components/stocks/stock-ownership";
import { StockComparisonTable } from "@/components/stocks/stock-comparison-table";
import { StockPageSkeleton } from "@/components/stocks/stock-page-skeleton";
import { fetchStockData, fetchStockSummary } from "@/lib/stocks/api";
import { generateStockMetrics } from "@/lib/stocks/utils";
import {
  getWatchlist,
  isSymbolWatchlisted,
  toggleSymbolInWatchlist,
} from "@/lib/stocks/watchlist";
import type { StockData, StockSummary } from "@/lib/stocks/types";

interface StockPageClientProps {
  symbol: string;
}

type SymbolSuggestion = {
  symbol: string;
  name?: string;
};

export function StockPageClient({ symbol }: StockPageClientProps) {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [compareSymbol, setCompareSymbol] = useState("");
  const [compareStock, setCompareStock] = useState<StockData | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [allSymbolSuggestions, setAllSymbolSuggestions] = useState<
    SymbolSuggestion[]
  >([]);
  const [filteredSymbolSuggestions, setFilteredSymbolSuggestions] = useState<
    SymbolSuggestion[]
  >([]);

  const POPULAR_SYMBOLS: SymbolSuggestion[] = [
    { symbol: "AAPL", name: "Apple Inc." },
    { symbol: "MSFT", name: "Microsoft Corporation" },
    { symbol: "GOOGL", name: "Alphabet Inc." },
    { symbol: "AMZN", name: "Amazon.com Inc." },
    { symbol: "TSLA", name: "Tesla Inc." },
    { symbol: "NVDA", name: "NVIDIA Corporation" },
    { symbol: "META", name: "Meta Platforms Inc." },
  ];
  const chartSectionRef = useRef<HTMLDivElement>(null);
  const compareSectionRef = useRef<HTMLDivElement>(null);
  const [hoveredNewsTimestamp, setHoveredNewsTimestamp] = useState<
    number | null
  >(null);

  useEffect(() => {
    const loadStockData = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchStockData(symbol);
        const summaryData = await fetchStockSummary(symbol, data);

        setStockData(data);
        setSummary(summaryData);
      } catch (err: any) {
        console.error("Error loading stock data:", err);
        setError(err.message || "Failed to load stock data");
      } finally {
        setLoading(false);
      }
    };

    loadStockData();
  }, [symbol]);

  useEffect(() => {
    // Sync local state with session-based watchlist when the symbol changes
    setIsWatchlisted(isSymbolWatchlisted(symbol));
  }, [symbol]);

  useEffect(() => {
    // Seed suggestions with popular symbols + anything in the user's watchlist
    const fromWatchlist = getWatchlist().map<SymbolSuggestion>((item) => ({
      symbol: item.symbol,
    }));

    const merged = new Map<string, SymbolSuggestion>();
    for (const entry of [...POPULAR_SYMBOLS, ...fromWatchlist]) {
      const upper = entry.symbol.toUpperCase();
      if (!merged.has(upper)) {
        merged.set(upper, { symbol: upper, name: entry.name });
      }
    }

    const suggestions = Array.from(merged.values());
    setAllSymbolSuggestions(suggestions);
    setFilteredSymbolSuggestions([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!stockData || !summary) return;

    const isStale =
      Date.now() - summary.lastUpdated.getTime() > 8 * 60 * 60 * 1000;
    if (!isStale) return;

    const BASE_DELAY_MS = 30000;
    const MAX_DELAY_MS = 5 * 60 * 1000;
    const MAX_ATTEMPTS = 5;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;

    const scheduleNext = (delay: number) => {
      if (cancelled) return;
      timeoutId = setTimeout(() => {
        void poll();
      }, delay);
    };

    const poll = async () => {
      attempts += 1;

      try {
        const updated = await fetchStockSummary(symbol, stockData);
        if (cancelled) return;
        setSummary(updated);

        const updatedIsStale =
          Date.now() - updated.lastUpdated.getTime() > 8 * 60 * 60 * 1000;
        if (!updatedIsStale) return;
      } catch {
        // keep trying on transient errors
      }

      if (attempts >= MAX_ATTEMPTS) return;
      const nextDelay = Math.min(
        BASE_DELAY_MS * 2 ** (attempts - 1),
        MAX_DELAY_MS,
      );
      scheduleNext(nextDelay);
    };

    void poll();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [symbol, stockData, summary?.lastUpdated?.getTime()]);

  const handleToggleWatchlist = () => {
    const { isWatchlisted: next } = toggleSymbolInWatchlist(symbol);
    setIsWatchlisted(next);
  };

  const handleShare = () => {
    // Implement share functionality
    if (navigator.share && stockData) {
      navigator
        .share({
          title: `${stockData.symbol} - ${stockData.name}`,
          text: `Check out ${stockData.symbol} stock - $${stockData.price} (${stockData.changePercent >= 0 ? "+" : ""}${stockData.changePercent.toFixed(2)}%)`,
          url: window.location.href,
        })
        .catch((err) => console.error("Error sharing:", err));
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      console.log("Link copied to clipboard!");
    }
  };

  const handleSetAlert = () => {
    // TODO: Implement price alert functionality
    console.log("Set price alert for:", symbol);
  };

  const handleCompareSymbolChange = (value: string) => {
    setCompareSymbol(value);
    setCompareError(null);

    const query = value.trim();
    if (!query) {
      setFilteredSymbolSuggestions([]);
      return;
    }

    const upperQuery = query.toUpperCase();
    const lowerQuery = query.toLowerCase();

    const base = allSymbolSuggestions.length
      ? allSymbolSuggestions
      : POPULAR_SYMBOLS;

    const filtered = base
      .filter((entry) => entry.symbol.toUpperCase() !== symbol.toUpperCase())
      .filter(
        (entry) =>
          entry.symbol.toUpperCase().startsWith(upperQuery) ||
          entry.symbol.toUpperCase().includes(upperQuery) ||
          (entry.name && entry.name.toLowerCase().includes(lowerQuery)),
      )
      .slice(0, 8);

    setFilteredSymbolSuggestions(filtered);
  };

  const handleLoadComparison = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = compareSymbol.trim().toUpperCase();
    if (!target || target === symbol.toUpperCase()) {
      setCompareStock(null);
      setCompareError(
        target === symbol.toUpperCase()
          ? "Enter a different symbol to compare against."
          : "Enter a stock symbol to compare.",
      );
      return;
    }

    try {
      setCompareLoading(true);
      setCompareError(null);
      const data = await fetchStockData(target);
      setCompareStock(data);
      setFilteredSymbolSuggestions([]);
      if (compareSectionRef.current) {
        compareSectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    } catch (err: any) {
      console.error("Failed to load comparison stock:", err);
      setCompareStock(null);
      setCompareError(err.message || "Unable to load comparison stock.");
    } finally {
      setCompareLoading(false);
    }
  };

  if (loading) {
    return <StockPageSkeleton />;
  }

  if (error || !stockData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center px-4 py-10">
          <div className="text-center max-w-md mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">
              {error ? "Error Loading Stock" : "Stock Not Found"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {error ||
                `Unable to find stock data for symbol: ${symbol.toUpperCase()}`}
            </p>
            <Link href="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const metrics = generateStockMetrics(stockData);
  const isSummaryStale = summary
    ? Date.now() - new Date(summary.lastUpdated).getTime() > 8 * 60 * 60 * 1000
    : false;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main Content */}
      <div className="container mx-auto padding-responsive py-6 sm:py-8 md:py-10">
        {/* Stock Header */}
        <StockHeader
          symbol={stockData.symbol}
          name={stockData.name}
          price={stockData.price}
          change={stockData.change}
          changePercent={stockData.changePercent}
          logoUrl={stockData.logoUrl}
          exchange={stockData.exchange}
          isWatchlisted={isWatchlisted}
          onToggleWatchlist={handleToggleWatchlist}
          onShare={handleShare}
          onSetAlert={handleSetAlert}
        />

        {/* Two-Column Layout: Chart + Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Left Column: Chart & About (2/3 width on larger screens) */}
          <div className="md:col-span-2 space-y-4 sm:space-y-6">
            <div
              ref={chartSectionRef}
              id="stock-price-chart"
            >
              <StockChart
                symbol={stockData.symbol}
                currentPrice={stockData.price}
                onHoverPoint={(point) =>
                  setHoveredNewsTimestamp(point?.timestamp ?? null)
                }
                contentBelowChart={
                  <>
                    {/* Compare: inside chart card, above news */}
                    <div ref={compareSectionRef} className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <span className="text-sm font-medium shrink-0">
                          Compare with
                        </span>
                        <form
                          onSubmit={handleLoadComparison}
                          className="flex flex-row gap-2 flex-1 min-w-0"
                        >
                          <div className="relative flex-1 min-w-0 max-w-[200px] sm:max-w-[180px]">
                            <input
                              type="text"
                              placeholder="e.g. MSFT"
                              value={compareSymbol}
                              onChange={(e) =>
                                handleCompareSymbolChange(e.target.value)
                              }
                              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            />
                            {compareSymbol.trim() &&
                              filteredSymbolSuggestions.length > 0 && (
                                <div className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-y-auto rounded-md border border-border bg-popover text-xs sm:text-sm shadow-lg">
                                  {filteredSymbolSuggestions.map((sugg) => (
                                    <button
                                      key={sugg.symbol}
                                      type="button"
                                      className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground"
                                      onClick={() => {
                                        setCompareSymbol(sugg.symbol);
                                        setFilteredSymbolSuggestions([]);
                                        setCompareError(null);
                                      }}
                                    >
                                      <span className="font-semibold">
                                        {sugg.symbol}
                                      </span>
                                      {sugg.name && (
                                        <span className="ml-2 text-muted-foreground truncate text-xs">
                                          {sugg.name}
                                        </span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                          </div>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={compareLoading || !compareSymbol.trim()}
                            className="whitespace-nowrap shrink-0"
                          >
                            {compareLoading ? "Loading..." : "Compare"}
                          </Button>
                        </form>
                        {compareError && (
                          <p className="text-xs text-destructive shrink-0">
                            {compareError}
                          </p>
                        )}
                      </div>

                      {compareStock && !compareError && (
                        <StockComparisonTable
                          stocks={[stockData, compareStock]}
                          highlightSymbol={stockData.symbol}
                          title="Side‑by‑side comparison"
                          layout="horizontal"
                        />
                      )}
                    </div>

                    {/* News: inside chart card, below compare */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <h2 className="text-base sm:text-lg font-semibold">
                          News
                        </h2>
                      </div>
                      <StockNewsFeed
                        symbol={stockData.symbol}
                        companyName={stockData.name}
                        limit={10}
                        hoveredTimestamp={hoveredNewsTimestamp}
                      />
                    </div>
                  </>
                }
              />
            </div>

            {/* Financial Metrics & Charts */}
            <StockFinancialMetrics
              symbol={stockData.symbol}
              stockData={stockData}
            />

            <StockOwnership symbol={stockData.symbol} />

            {/* Company Info Section */}
            {stockData.description && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                  About {stockData.name}
                </h2>
                <div className="bg-card border border-border rounded-lg p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
                  <p className="text-sm sm:text-base text-foreground leading-relaxed">
                    {stockData.description}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-border">
                    {stockData.sector && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Sector
                        </p>
                        <p className="text-sm sm:text-base font-medium">
                          {stockData.sector}
                        </p>
                      </div>
                    )}
                    {stockData.industry && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Industry
                        </p>
                        <p className="text-sm sm:text-base font-medium">
                          {stockData.industry}
                        </p>
                      </div>
                    )}
                    {stockData.ceo && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          CEO
                        </p>
                        <p className="text-sm sm:text-base font-medium">
                          {stockData.ceo}
                        </p>
                      </div>
                    )}
                    {stockData.employees && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Employees
                        </p>
                        <p className="text-sm sm:text-base font-medium">
                          {stockData.employees.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {stockData.founded && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Founded
                        </p>
                        <p className="text-sm sm:text-base font-medium">
                          {stockData.founded}
                        </p>
                      </div>
                    )}
                    {stockData.website && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Website
                        </p>
                        <a
                          href={stockData.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm sm:text-base font-medium text-primary hover:underline"
                        >
                          Visit Site
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: AI Summary & Metrics Sidebar (1/3 width on larger screens) */}
          <div className="md:col-span-1 space-y-4 sm:space-y-6">
            {summary && (
              <StockAISummary summary={summary} isUpdating={isSummaryStale} />
            )}
            <StockMetrics metrics={metrics} />
          </div>
        </div>
      </div>
    </div>
  );
}
