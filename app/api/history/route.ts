import { NextResponse } from "next/server";

type Candle = {
  t: string; // ISO date
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hashString(s: string) {
  // simple deterministic hash
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function generateMockHistory(symbol: string, days: number): Candle[] {
  const baseHash = hashString(symbol);
  const volatility = 0.008 + (baseHash % 30) / 3000; // ~0.8% to ~1.8%
  const drift = ((baseHash % 200) - 100) / 100000; // small drift
  const startPrice = 20 + (baseHash % 8000) / 100; // 20..100
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  let price = startPrice;
  const out: Candle[] = [];

  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);

    // deterministic pseudo-random based on day + symbol
    const r1 = (hashString(symbol + "|a|" + i) % 10000) / 10000;
    const r2 = (hashString(symbol + "|b|" + i) % 10000) / 10000;
    const r3 = (hashString(symbol + "|c|" + i) % 10000) / 10000;

    const dailyMove = (r1 - 0.5) * 2 * volatility + drift;
    const open = price;
    let close = open * (1 + dailyMove);

    // keep it sane
    close = clamp(close, open * 0.85, open * 1.15);

    const high = Math.max(open, close) * (1 + r2 * volatility);
    const low = Math.min(open, close) * (1 - r3 * volatility);

    const vol = Math.floor(1000 + (hashString(symbol + "|v|" + i) % 50000));

    out.push({
      t: d.toISOString().slice(0, 10),
      o: Number(open.toFixed(4)),
      h: Number(high.toFixed(4)),
      l: Number(low.toFixed(4)),
      c: Number(close.toFixed(4)),
      v: vol,
    });

    price = close;
  }

  return out;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const symbolRaw = (searchParams.get("symbol") || "").trim();
  const symbol = symbolRaw.toUpperCase();

  const daysRaw = searchParams.get("days") || "365";
  const days = clamp(parseInt(daysRaw, 10) || 365, 30, 2000);

  if (!symbol) {
    return NextResponse.json(
      { ok: false, error: "Missing ?symbol= (example: /api/history?symbol=BTC&days=365)" },
      { status: 400 }
    );
  }

  // deterministic mock history for now (we’ll swap to real provider later)
  const candles = generateMockHistory(symbol, days);

  return NextResponse.json(
    {
      ok: true,
      symbol,
      days,
      candles,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}