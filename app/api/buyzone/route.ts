import { calculateBuyZoneSignal } from "@/lib/buyzone-engine";

export async function GET() {
  try {
    const symbols = ["SPY", "QQQ"]; // you can expand this later

    const results = await Promise.all(
      symbols.map(async (symbol) => {
        const res = await fetch(
          `http://localhost:3000/api/history?symbol=${symbol}&days=365`,
          { cache: "no-store" }
        );

        const data = await res.json();

        if (!data.ok) {
          throw new Error(`History failed for ${symbol}: ${data.error}`);
        }

        const signal = calculateBuyZoneSignal(symbol, data.bars);
        return signal;
      })
    );

    return Response.json({
      ok: true,
      count: results.length,
      signals: results,
    });
  } catch (error) {
    console.error("BuyZone API error:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}