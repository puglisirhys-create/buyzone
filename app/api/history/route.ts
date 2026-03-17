import { NextResponse } from "next/server";

const BASE_URL = "https://api.twelvedata.com";

type TwelveTimeSeriesResponse = {
  values?: Array<{
    datetime: string;
    close: string;
  }>;
  status?: string;
  message?: string;
};

function getApiKey(): string {
  const key = process.env.TWELVE_DATA_API_KEY;

  // 🔍 DEBUG (temporary)
  console.log("API key loaded:", key ? `${key.slice(0, 6)}...` : "MISSING");

  if (!key) {
    throw new Error("Missing TWELVE_DATA_API_KEY in .env.local");
  }

  return key;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function buildUrl(
  path: string,
  params: Record<string, string | number | undefined>
) {
  const url = new URL(`${BASE_URL}${path}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

async function twelveFetch<T>(url: URL): Promise<T> {
  // ✅ Add API key correctly
  url.searchParams.set("apikey", getApiKey());

  const res = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Twelve Data HTTP error: ${res.status}`);
  }

  const data = await res.json();

  if (data?.status === "error") {
    throw new Error(data.message || "Twelve Data returned an error");
  }

  return data as T;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const symbolRaw = (searchParams.get("symbol") || "").trim();
    const symbol = symbolRaw.toUpperCase();

    const daysRaw = searchParams.get("days") || "365";
    const days = clamp(parseInt(daysRaw, 10) || 365, 30, 500);

    if (!symbol) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing ?symbol= (example: /api/history?symbol=SPY&days=365)",
        },
        { status: 400 }
      );
    }

    const url = buildUrl("/time_series", {
      symbol,
      interval: "1day",
      outputsize: days,
      timezone: "Exchange",
    });

    const data = await twelveFetch<TwelveTimeSeriesResponse>(url);

    if (!data.values || data.values.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `No historical data returned for ${symbol}`,
        },
        { status: 404 }
      );
    }

    const bars = [...data.values]
      .map((row) => ({
        datetime: row.datetime,
        close: Number(row.close),
      }))
      .filter(
        (row) =>
          row.datetime &&
          Number.isFinite(row.close) &&
          row.close > 0
      )
      .sort(
        (a, b) =>
          new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
      );

    if (bars.length < 200) {
      return NextResponse.json(
        {
          ok: false,
          error: `Not enough valid daily bars for ${symbol}. Need at least 200, got ${bars.length}.`,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        symbol,
        bars,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("History route error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown history route error",
      },
      { status: 500 }
    );
  }
}