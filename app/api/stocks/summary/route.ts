import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type SummaryRow = {
  symbol: string;
  summary: string;
  created_at: string;
  expires_at: string | null;
  updated_at: string;
};

type RefreshLockRow = {
  symbol: string;
  refreshing_until: string | null;
};

type WebhookPayload = {
  symbol: string;
  reason: "missing" | "expired" | "refresh";
  last_summary?: string;
  last_sentiment?: string;
  last_updated?: string;
  source?: string;
  data: {
    quote: {
      price: number;
      change: number;
      changePercent: number;
      volume: number;
    };
    metrics: {
      marketCap: number;
      peRatio: number | null;
      week52High: number;
      week52Low: number;
    };
    news: Array<{
      headline: string;
      summary: string;
      source: string;
      url: string;
      datetime: number;
      tags?: string[];
    }>;
    chart: Array<{
      date: string;
      close: number;
    }>;
    ownership: Array<{
      name: string;
      share: number;
      portfolioPercent: number;
      filingDate: string;
    }>;
  };
};

async function postWebhook(
  url: string,
  payload: WebhookPayload,
  timeoutMs = 2000,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchJson<T>(url: string, timeoutMs = 6000): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as T | null;
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function buildSnapshot(symbol: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const makeUrl = (path: string, params: Record<string, string>) => {
    const url = new URL(path, base);
    for (const [key, value] of Object.entries(params))
      url.searchParams.set(key, value);
    return url.toString();
  };

  const quoteUrl = makeUrl("/api/stocks/quote", { symbol });
  const metricUrl = makeUrl("/api/stocks/metric", { symbol });
  const newsUrl = makeUrl("/api/stocks/news", { symbol });
  const chartUrl = makeUrl("/api/stocks/charts-data", {
    symbol,
    interval: "1day",
    outputsize: "5",
  });
  const ownershipUrl = makeUrl("/api/stocks/ownership", { symbol });

  const [quoteRes, metricRes, newsRes, chartRes, ownershipRes] =
    await Promise.all([
      fetchJson<any>(quoteUrl),
      fetchJson<any>(metricUrl),
      fetchJson<any>(newsUrl),
      fetchJson<any>(chartUrl),
      fetchJson<any>(ownershipUrl),
    ]);

  const quote = quoteRes || {};
  const metric = metricRes?.metric || {};
  const news = Array.isArray(newsRes?.news) ? newsRes.news.slice(0, 5) : [];
  const chartValues = Array.isArray(chartRes?.values) ? chartRes.values : [];
  const ownership = Array.isArray(ownershipRes?.owners)
    ? ownershipRes.owners.slice(0, 5)
    : [];

  const latestVolume = (() => {
    if (chartValues.length === 0) return 0;
    const v = Number(chartValues[0]?.volume);
    return Number.isFinite(v) ? v : 0;
  })();

  const pickMetricNumber = (keys: string[]) => {
    for (const key of keys) {
      const val = metric?.[key];
      if (typeof val === "number" && Number.isFinite(val)) return val;
      if (typeof val === "string") {
        const n = Number(val);
        if (Number.isFinite(n)) return n;
      }
    }
    return 0;
  };

  return {
    quote: {
      price: Number(quote?.c) || 0,
      change: Number(quote?.d) || 0,
      changePercent: Number(quote?.dp) || 0,
      volume: latestVolume,
    },
    metrics: {
      marketCap: pickMetricNumber(["marketCapitalization", "marketCap"]) || 0,
      peRatio: (() => {
        const pe = pickMetricNumber([
          "peTTM",
          "peBasicExclExtraTTM",
          "peInclExtraTTM",
          "peNormalizedAnnual",
        ]);
        return pe > 0 ? pe : null;
      })(),
      week52High: pickMetricNumber([
        "52WeekHigh",
        "52WeekHighAdjusted",
        "week52High",
      ]),
      week52Low: pickMetricNumber([
        "52WeekLow",
        "52WeekLowAdjusted",
        "week52Low",
      ]),
    },
    news: news.map((item: any) => ({
      headline: typeof item?.headline === "string" ? item.headline : "",
      summary: typeof item?.summary === "string" ? item.summary : "",
      source: typeof item?.source === "string" ? item.source : "",
      url: typeof item?.url === "string" ? item.url : "",
      datetime: typeof item?.datetime === "number" ? item.datetime : 0,
      tags: Array.isArray(item?.tags) ? item.tags : undefined,
    })),
    chart: chartValues.map((item: any) => ({
      date: typeof item?.datetime === "string" ? item.datetime : "",
      close: Number(item?.close) || 0,
    })),
    ownership: ownership.map((item: any) => ({
      name: typeof item?.name === "string" ? item.name : "",
      share: typeof item?.share === "number" ? item.share : 0,
      portfolioPercent:
        typeof item?.portfolioPercent === "number" ? item.portfolioPercent : 0,
      filingDate: typeof item?.filingDate === "string" ? item.filingDate : "",
    })),
  };
}

const REFRESH_LOCK_MS = 10 * 60 * 1000;

async function acquireRefreshLock(
  supabase: Awaited<ReturnType<typeof createClient>>,
  symbol: string,
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("stock_summary_refresh_locks")
      .select("symbol, refreshing_until")
      .eq("symbol", symbol)
      .maybeSingle<RefreshLockRow>();

    if (error) {
      return false;
    }

    const refreshUntil = data?.refreshing_until
      ? Date.parse(data.refreshing_until)
      : 0;
    if (refreshUntil && refreshUntil > Date.now()) {
      return false;
    }

    const lockUntil = new Date(Date.now() + REFRESH_LOCK_MS).toISOString();
    const { error: upsertError } = await supabase
      .from("stock_summary_refresh_locks")
      .upsert(
        { symbol, refreshing_until: lockUntil },
        { onConflict: "symbol" },
      );

    return !upsertError;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const forceRefresh =
    searchParams.get("refresh") === "true" ||
    searchParams.get("refresh") === "1";

  if (!symbol) {
    return NextResponse.json(
      { error: "Missing required query param: symbol" },
      { status: 400 },
    );
  }

  const normalizedSymbol = symbol.toUpperCase();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stock_summaries")
    .select("symbol, summary, created_at, expires_at, updated_at")
    .eq("symbol", normalizedSymbol)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<SummaryRow>();

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch summary" },
      { status: 500 },
    );
  }

  const webhookUrl = process.env.N8N_SUMMARY_WEBHOOK_URL;

  if (!data) {
    if (webhookUrl) {
      const canTrigger = await acquireRefreshLock(supabase, normalizedSymbol);
      if (canTrigger) {
        void (async () => {
          const snapshot = await buildSnapshot(normalizedSymbol);
          await postWebhook(webhookUrl, {
            symbol: normalizedSymbol,
            reason: "missing",
            data: snapshot,
          });
        })().catch(() => {});
      }
    }
    return NextResponse.json({ error: "Summary not found" }, { status: 404 });
  }

  const expiresAtMs = data.expires_at ? Date.parse(data.expires_at) : 0;
  const isExpired = !expiresAtMs || Date.now() >= expiresAtMs;
  const shouldTriggerWebhook = webhookUrl && (isExpired || forceRefresh);

  if (shouldTriggerWebhook) {
    const canTrigger = await acquireRefreshLock(supabase, normalizedSymbol);
    if (canTrigger) {
      const reason = forceRefresh ? "refresh" : "expired";
      void (async () => {
        const snapshot = await buildSnapshot(normalizedSymbol);
        await postWebhook(webhookUrl, {
          symbol: normalizedSymbol,
          reason,
          last_summary: data.summary,
          last_updated: data.updated_at,
          data: snapshot,
        });
      })().catch(() => {});
    }
  }

  return NextResponse.json(
    {
      symbol: data.symbol,
      summary: data.summary,
      sentiment: "neutral",
      keyFactors: [],
      riskFactors: [],
      lastUpdated: data.updated_at,
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
