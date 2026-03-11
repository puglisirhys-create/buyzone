import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get("ticker");

  if (!ticker) {
    return NextResponse.json({ ok: false, error: "Missing ticker" });
  }

  const symbol = ticker.toUpperCase();

  let type: "STOCK" | "ETF" | "CRYPTO" = "STOCK";

  if (["BTC", "ETH", "SOL", "XRP", "ADA"].includes(symbol)) {
    type = "CRYPTO";
  } else if (["VGS", "VAS", "IVV", "VOO", "SPY"].includes(symbol)) {
    type = "ETF";
  }

  return NextResponse.json({
    ok: true,
    ticker: symbol,
    type,
  });
}