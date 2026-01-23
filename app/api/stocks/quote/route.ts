import { NextResponse } from "next/server"

export const revalidate = 60

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")

  if (!symbol) {
    return NextResponse.json({ error: "Missing required query param: symbol" }, { status: 400 })
  }

  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing server env var: FINNHUB_API_KEY" },
      { status: 500 },
    )
  }

  const url = new URL("https://finnhub.io/api/v1/quote")
  url.searchParams.set("symbol", symbol)
  url.searchParams.set("token", apiKey)

  const res = await fetch(url.toString(), {
    // Keep it cacheable to reduce quota usage.
    next: { revalidate },
  })

  if (!res.ok) {
    return NextResponse.json(
      { error: `Finnhub quote request failed: ${res.status} ${res.statusText}` },
      { status: 502 },
    )
  }

  const data = (await res.json()) as {
    c: number
    d: number
    dp: number
    h: number
    l: number
    o: number
    pc: number
    t: number
  }

  return NextResponse.json({ symbol: symbol.toUpperCase(), ...data })
}
