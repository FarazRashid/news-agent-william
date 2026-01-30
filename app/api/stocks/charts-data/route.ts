import { NextResponse } from "next/server"

export const revalidate = 60

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")
  const interval = searchParams.get("interval")
  const outputsize = searchParams.get("outputsize")

  if (!symbol || !interval) {
    return NextResponse.json(
      { error: "Missing required query params: symbol, interval" },
      { status: 400 }
    )
  }

  const apiKey = process.env.TWELVE_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing server env var: TWELVE_API_KEY" },
      { status: 500 }
    )
  }

  const url = new URL("https://api.twelvedata.com/time_series")
  url.searchParams.set("symbol", symbol)
  url.searchParams.set("interval", interval)
  url.searchParams.set("apikey", apiKey)
  if (outputsize) {
    url.searchParams.set("outputsize", outputsize)
  }

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Twelve Data request failed: ${res.status} ${res.statusText}` },
        { status: 502 }
      )
    }

    const data = await res.json()
    
    if (data.status === "error" || data.message) {
      return NextResponse.json(
        { error: `Twelve Data API error: ${data.message || "Unknown error"}` },
        { status: 502 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch Twelve Data: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    )
  }
}
