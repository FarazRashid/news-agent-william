import { NextResponse } from "next/server"

export const revalidate = 300

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")

  if (!symbol) {
    return NextResponse.json({ error: "Missing required query param: symbol" }, { status: 400 })
  }

  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Missing server env var: FINNHUB_API_KEY" }, { status: 500 })
  }

  const url = new URL("https://finnhub.io/api/v1/stock/metric")
  url.searchParams.set("symbol", symbol)
  url.searchParams.set("metric", "all")
  url.searchParams.set("token", apiKey)

  const res = await fetch(url.toString(), {
    next: { revalidate },
  })

  if (!res.ok) {
    const contentType = res.headers.get("content-type") || ""
    const upstreamBody = contentType.includes("application/json")
      ? await res.json().catch(() => null)
      : await res.text().catch(() => null)

    return NextResponse.json(
      {
        error: `Finnhub metric request failed: ${res.status} ${res.statusText}`,
        upstream: upstreamBody,
      },
      { status: 502 },
    )
  }

  const data = await res.json()
  return NextResponse.json({ symbol: symbol.toUpperCase(), ...data })
}
