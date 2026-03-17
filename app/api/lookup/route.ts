import { NextResponse } from "next/server";

const BASE_URL = "https://api.twelvedata.com";

type TwelveSymbolSearchResponse = {
  data?: Array<{
    symbol: string;
    instrument_name?: string;
    exchange?: string;
    country?: string;
    type?: string;
    currency?: string;
  }>;
  status?: string;
  message?: string;
};

function getApiKey(): string {
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) {
    throw new Error("Missing TWELVE_DATA_API_KEY in .env.local");
  }
  return key;
}

function mapInstrumentType(
  rawType?: string
): "STOCK" | "ETF" | "CRYPTO" {
  const value = (rawType || "").toLowerCase();

  if (
    value.includes("etf") ||
    value.includes("fund")
  ) {
    return "ETF";
  }

  if (
    value.includes("crypto") ||
    value.includes("digital currency")
  ) {
    return "CRYPTO";
  }

  return "STOCK";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tickerRaw = (searchParams.get("ticker") || "").trim();

    if (!tickerRaw) {
      return NextResponse.json(
        { ok: false, error: "Missing ticker" },
        { status: 400 }
      );
    }

    const ticker = tickerRaw.toUpperCase();

    const url = new URL(`${BASE_URL}/symbol_search`);
    url.searchParams.set("symbol", ticker);
    url.searchParams.set("apikey", getApiKey());

    const res = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Twelve Data HTTP error: ${res.status}`);
    }

    const data = (await res.json()) as TwelveSymbolSearchResponse;

    if (data?.status === "error") {
      throw new Error(data.message || "Lookup provider returned an error");
    }

    const matches = Array.isArray(data.data) ? data.data : [];

    const exactMatch =
      matches.find(
        (item) => item.symbol?.toUpperCase() === ticker
      ) || null;

    if (!exactMatch) {
      return NextResponse.json(
        { ok: false, error: `Ticker ${ticker} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      ticker: exactMatch.symbol.toUpperCase(),
      name: exactMatch.instrument_name || exactMatch.symbol.toUpperCase(),
      exchange: exactMatch.exchange || null,
      type: mapInstrumentType(exactMatch.type),
      rawType: exactMatch.type || null,
      country: exactMatch.country || null,
      currency: exactMatch.currency || null,
    });
  } catch (error) {
    console.error("Lookup route error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown lookup route error",
      },
      { status: 500 }
    );
  }
}