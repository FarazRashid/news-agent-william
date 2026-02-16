import { NextResponse } from "next/server";

export const revalidate = 300; // Cache for 5 minutes

function deriveTags(input: {
  symbol: string;
  headline?: string;
  summary?: string;
  source?: string;
}) {
  const text =
    `${input.symbol} ${input.headline || ""} ${input.summary || ""} ${input.source || ""}`.toLowerCase();
  const tags = new Set<string>();

  const addIf = (tag: string, patterns: Array<string | RegExp>) => {
    if (
      patterns.some((p) =>
        typeof p === "string" ? text.includes(p) : p.test(text),
      )
    )
      tags.add(tag);
  };

  addIf("AI", [
    "ai",
    "artificial intelligence",
    "openai",
    "llm",
    "chatgpt",
    "copilot",
    "gpu",
    "nvidia",
  ]);
  addIf("Cloud", ["cloud", "azure", "aws", "gcp", "data center", "datacenter"]);
  addIf("Earnings", [
    "earnings",
    "quarter",
    "q1",
    "q2",
    "q3",
    "q4",
    "results",
    "revenue",
    "profit",
    "guidance",
  ]);
  addIf("Analyst", [
    "analyst",
    "price target",
    "upgrade",
    "downgrade",
    "rating",
  ]);
  addIf("M&A", ["acquisition", "acquire", "merger", "buyout", "deal"]);
  addIf("Regulation", [
    "regulation",
    "antitrust",
    "lawsuit",
    "doj",
    "sec",
    "eu",
    "fine",
  ]);
  addIf("Macro", ["tariff", "inflation", "rates", "fed", "recession", "davos"]);
  addIf("Security", ["security", "breach", "hack", "cyber", "ransomware"]);
  addIf("Hardware", ["chip", "semiconductor", "photonic", "nuclear", "energy"]);

  return Array.from(tags).slice(0, 6);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { error: "Missing required query param: symbol" },
      { status: 400 },
    );
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing server env var: FINNHUB_API_KEY" },
      { status: 500 },
    );
  }

  // Get daysBack parameter, default to 30 days for reasonable history
  const daysBackParam = searchParams.get("daysBack");
  const daysBack = daysBackParam
    ? Math.max(1, Math.min(365, parseInt(daysBackParam, 10)))
    : 30;

  // Fetch news from the last N days
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(toDate.getDate() - daysBack);

  const from = fromDate.toISOString().split("T")[0]; // YYYY-MM-DD
  const to = toDate.toISOString().split("T")[0]; // YYYY-MM-DD

  const url = new URL("https://finnhub.io/api/v1/company-news");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  url.searchParams.set("token", apiKey);

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate },
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          error: `Finnhub news request failed: ${res.status} ${res.statusText}`,
        },
        { status: 502 },
      );
    }

    const news = await res.json();

    // Return more articles since we're fetching a longer time period
    // Client will filter by hovered date, so we want good coverage
    const limitedNews = Array.isArray(news) ? news.slice(0, 50) : [];

    const parseDatetime = (raw: unknown): number | null => {
      if (raw == null) return null;
      if (typeof raw === "number") return raw > 1e12 ? raw : raw * 1000;
      if (typeof raw === "string") {
        const ms = new Date(raw).getTime();
        return Number.isFinite(ms) ? ms : null;
      }
      return null;
    };

    const enrichedNews = limitedNews.map((item: any) => {
      const headline = typeof item?.headline === "string" ? item.headline : "";
      const summary = typeof item?.summary === "string" ? item.summary : "";
      const source = typeof item?.source === "string" ? item.source : "";
      const datetime =
        parseDatetime(item?.datetime) ??
        parseDatetime(item?.publishedDate) ??
        parseDatetime(item?.time) ??
        null;

      return {
        ...item,
        ...(datetime != null && { datetimeMs: datetime }),
        tags: deriveTags({ symbol, headline, summary, source }),
      };
    });

    return NextResponse.json({
      symbol,
      news: enrichedNews,
      from,
      to,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Failed to fetch news: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}
