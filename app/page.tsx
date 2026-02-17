"use client";

import { useMemo, useState } from "react";

type AssetType = "CRYPTO" | "STOCK" | "ETF";
type Zone = "IN_BUY_ZONE" | "APPROACHING" | "NOT_ATTRACTIVE";

type WatchItem = {
  id: string;
  ticker: string;
  type: AssetType;
  note?: string;
  addedAt: number;
  zone: Zone;
};

const styles = {
  page: { minHeight: "100vh", background: "#000", color: "#fff", padding: 24 },
  wrap: { maxWidth: 860, margin: "0 auto" },
  card: { border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: 18 },
  row: { display: "flex", gap: 10, flexWrap: "wrap" as const },
  input: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#000",
    color: "#fff",
  },
  btn: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    cursor: "pointer",
  },
};

function normalizeTicker(v: string) {
  return v.trim().toUpperCase().replace(/\s+/g, "");
}
function typeLabel(t: AssetType) {
  return t === "CRYPTO" ? "Crypto" : t === "STOCK" ? "Stock" : "ETF";
}
function zoneLabel(z: Zone) {
  return z === "IN_BUY_ZONE" ? "In Buy Zone" : z === "APPROACHING" ? "Approaching" : "Not Attractive";
}
function mockZone(ticker: string, type: AssetType): Zone {
  const base = `${type}:${ticker}`;
  let sum = 0;
  for (let i = 0; i < base.length; i++) sum += base.charCodeAt(i);
  const b = sum % 3;
  return b === 0 ? "IN_BUY_ZONE" : b === 1 ? "APPROACHING" : "NOT_ATTRACTIVE";
}

export default function Home() {
  const [typeInput, setTypeInput] = useState<AssetType>("CRYPTO");
  const [tickerInput, setTickerInput] = useState("");
  const [noteInput, setNoteInput] = useState("");

  const [items, setItems] = useState<WatchItem[]>([
    { id: "1", ticker: "BTC", type: "CRYPTO", addedAt: Date.now() - 3600000, zone: "APPROACHING" },
    { id: "2", ticker: "AAPL", type: "STOCK", addedAt: Date.now() - 1800000, zone: "NOT_ATTRACTIVE" },
  ]);

  const sorted = useMemo(() => [...items].sort((a, b) => b.addedAt - a.addedAt), [items]);

  function addAsset() {
    const ticker = normalizeTicker(tickerInput);
    if (!ticker) return;
    if (items.some((x) => x.ticker === ticker && x.type === typeInput)) {
      setTickerInput("");
      return;
    }
    const item: WatchItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ticker,
      type: typeInput,
      note: noteInput.trim() || undefined,
      addedAt: Date.now(),
      zone: mockZone(ticker, typeInput),
    };
    setItems((p) => [item, ...p]);
    setTickerInput("");
    setNoteInput("");
  }

  function removeAsset(id: string) {
    setItems((p) => p.filter((x) => x.id !== id));
  }

  function refresh() {
    setItems((p) => p.map((x) => ({ ...x, zone: mockZone(x.ticker, x.type) })));
  }

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <h1 style={{ fontSize: 44, margin: 0 }}>BuyZone</h1>
        <p style={{ opacity: 0.7, marginTop: 8 }}>Calm alerts when assets enter historically favourable buy zones.</p>

        <section style={styles.card}>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={styles.row}>
              <select value={typeInput} onChange={(e) => setTypeInput(e.target.value as AssetType)} style={styles.input}>
                <option value="CRYPTO">Crypto</option>
                <option value="STOCK">Stock</option>
                <option value="ETF">ETF</option>
              </select>

              <input
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addAsset()}
                placeholder="Ticker (e.g., BTC, AAPL, VAS)"
                style={{ ...styles.input, flex: 1, minWidth: 240 }}
              />

              <button onClick={addAsset} style={{ ...styles.btn, background: "rgba(255,255,255,0.10)", color: "#fff" }}>
                Add
              </button>

              <button onClick={refresh} style={{ ...styles.btn, background: "transparent", color: "rgba(255,255,255,0.8)" }}>
                Refresh
              </button>
            </div>

            <input
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Optional note (e.g., long-term hold, weekly DCA)"
              style={styles.input}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, opacity: 0.7 }}>
            <span>Watchlist</span>
            <span>{sorted.length} assets</span>
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {sorted.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 18,
                  padding: 14,
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" as const }}>
                  <div style={{ fontFamily: "monospace", fontSize: 18, padding: "8px 10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" }}>
                    {item.ticker}
                  </div>

                  <span style={{ fontSize: 12, padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", opacity: 0.85 }}>
                    {typeLabel(item.type)}
                  </span>

                  <span
                    style={{
                      fontSize: 12,
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background:
                        item.zone === "IN_BUY_ZONE"
                          ? "rgba(255,255,255,0.10)"
                          : item.zone === "APPROACHING"
                          ? "rgba(255,255,255,0.06)"
                          : "transparent",
                    }}
                  >
                    {zoneLabel(item.zone)}
                  </span>

                  {item.note ? <span style={{ fontSize: 12, opacity: 0.65 }}>• {item.note}</span> : null}
                </div>

                <button
                  onClick={() => removeAsset(item.id)}
                  style={{ ...styles.btn, padding: "8px 10px", background: "transparent", color: "rgba(255,255,255,0.8)" }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <p style={{ marginTop: 14, fontSize: 12, opacity: 0.55 }}>
            Prototype mode: zones are simulated. Next: real buy zones from price history + confidence (not predictions).
          </p>
        </section>
      </div>
    </main>
  );
}
