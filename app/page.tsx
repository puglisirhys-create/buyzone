"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type AssetType = "CRYPTO" | "STOCK" | "ETF";
type Zone = "IN_BUY_ZONE" | "APPROACHING" | "NOT_ATTRACTIVE";

type WatchItem = {
  id: string;
  ticker: string;
  type: AssetType;
  note?: string;
  addedAt: number;
  zone: Zone;
  confidence: number;
};

const STORAGE_KEY = "buyzone-watchlist";

const styles = {
  page: {
    minHeight: "100vh",
    background: "#000",
    color: "#EAEAEA",
    padding: 40,
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  },
  wrap: { maxWidth: 920, margin: "0 auto" },

  headerTitle: { fontSize: 48, fontWeight: 700, margin: 0 },
  headerSub: { opacity: 0.65, marginTop: 8, marginBottom: 26 },

  card: {
    borderRadius: 22,
    padding: 20,
    background: "#0B0B0D",
    border: "1px solid rgba(255,255,255,0.07)",
    boxShadow: "0 10px 28px rgba(0,0,0,0.55)",
  },

  row: { display: "flex", gap: 10, flexWrap: "wrap" as const, alignItems: "center" },

  input: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "#111",
    color: "#fff",
    outline: "none",
  },

  btnPrimary: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    cursor: "pointer",
  },

  btnGhost: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "transparent",
    color: "rgba(255,255,255,0.85)",
    cursor: "pointer",
  },

  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 12,
    opacity: 0.7,
    fontSize: 13,
  },

  itemCardBase: {
    padding: 18,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#111",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
  },

  ticker: {
    fontSize: 20,
    fontWeight: 750,
    letterSpacing: 0.6,
    fontFamily: "ui-monospace, monospace",
  },

  subtle: { fontSize: 12, opacity: 0.7 },

  badge: {
    fontSize: 12,
    fontWeight: 700,
    padding: "7px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    whiteSpace: "nowrap" as const,
  },
};

function normalizeTicker(v: string) {
  return v.trim().toUpperCase().replace(/\s+/g, "");
}

function isValidTicker(v: string) {
  return /^[A-Z0-9.\-]{1,15}$/.test(v);
}

function typeLabel(t: AssetType) {
  return t === "CRYPTO" ? "Crypto" : t === "STOCK" ? "Stock" : "ETF";
}

function zoneLabel(z: Zone) {
  return z === "IN_BUY_ZONE"
    ? "In Buy Zone"
    : z === "APPROACHING"
    ? "Approaching"
    : "Not Attractive";
}

function hashToInt(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

function computeMockSignal(ticker: string, type: AssetType) {
  const h = hashToInt(`${type}:${ticker}`);
  const confidence = 35 + (h % 66);
  const bucket = h % 3;
  const zone: Zone =
    bucket === 0 ? "IN_BUY_ZONE" : bucket === 1 ? "APPROACHING" : "NOT_ATTRACTIVE";
  return { zone, confidence };
}

function confidenceBg(conf: number) {
  if (conf >= 70) return "rgba(46,204,113,0.92)";
  if (conf >= 50) return "rgba(241,196,15,0.92)";
  return "rgba(255,255,255,0.10)";
}

function confidenceText(conf: number) {
  if (conf >= 50) return "#000";
  return "rgba(255,255,255,0.85)";
}

function glowShadow(conf: number) {
  if (conf >= 70) return "0 0 22px rgba(46,204,113,0.45)";
  if (conf >= 50) return "0 0 22px rgba(241,196,15,0.45)";
  return "0 0 18px rgba(255,255,255,0.20)";
}

function defaultItems(): WatchItem[] {
  const btc = computeMockSignal("BTC", "CRYPTO");
  const aapl = computeMockSignal("AAPL", "STOCK");
  return [
    { id: "seed-btc", ticker: "BTC", type: "CRYPTO", addedAt: 2, ...btc },
    { id: "seed-aapl", ticker: "AAPL", type: "STOCK", addedAt: 1, ...aapl },
  ];
}

function safeLoad(): WatchItem[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function safeSave(items: WatchItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export default function Home() {
  const [typeInput, setTypeInput] = useState<AssetType>("CRYPTO");
  const [tickerInput, setTickerInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const [items, setItems] = useState<WatchItem[]>(defaultItems);
  const didLoadRef = useRef(false);

  useEffect(() => {
    const saved = safeLoad();
    if (saved) setItems(saved);
    didLoadRef.current = true;
  }, []);

  useEffect(() => {
    if (!didLoadRef.current) return;
    safeSave(items);
  }, [items]);

  const sorted = useMemo(
    () => [...items].sort((a, b) => b.addedAt - a.addedAt),
    [items]
  );

  function addAsset() {
    const ticker = normalizeTicker(tickerInput);
    if (!ticker) return;
    if (!isValidTicker(ticker)) return;

    setItems((prev) => {
      if (prev.some((x) => x.ticker === ticker && x.type === typeInput))
        return prev;

      const signal = computeMockSignal(ticker, typeInput);
      return [
        {
          id: `id-${Date.now()}`,
          ticker,
          type: typeInput,
          note: noteInput || undefined,
          addedAt: Date.now(),
          ...signal,
        },
        ...prev,
      ];
    });

    setTickerInput("");
    setNoteInput("");
  }

  function refresh() {
    setItems((prev) =>
      prev.map((x) => ({
        ...x,
        ...computeMockSignal(x.ticker, x.type),
      }))
    );
  }

  function removeAsset(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <h1 style={styles.headerTitle}>BuyZone</h1>
        <p style={styles.headerSub}>Calm buy zone intelligence.</p>

        <section style={styles.card}>
          <div style={{ ...styles.row, marginBottom: 14 }}>
            <select
              value={typeInput}
              onChange={(e) =>
                setTypeInput(e.target.value as AssetType)
              }
              style={styles.input}
            >
              <option value="CRYPTO">Crypto</option>
              <option value="STOCK">Stock</option>
              <option value="ETF">ETF</option>
            </select>

            <input
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value)}
              placeholder="Ticker"
              style={{ ...styles.input, flex: 1 }}
            />

            <button onClick={addAsset} style={styles.btnPrimary}>
              Add
            </button>

            <button onClick={refresh} style={styles.btnGhost}>
              Refresh
            </button>
          </div>

          <div style={styles.metaRow}>
            <span>Watchlist</span>
            <span>{sorted.length} assets</span>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {sorted.map((item) => (
              <div
                key={item.id}
                style={{
                  ...styles.itemCardBase,
                  boxShadow: glowShadow(item.confidence),
                }}
              >
                <div>
                  <div style={styles.ticker}>{item.ticker}</div>
                  <div style={styles.subtle}>
                    {typeLabel(item.type)} • {zoneLabel(item.zone)}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      ...styles.badge,
                      background: confidenceBg(item.confidence),
                      color: confidenceText(item.confidence),
                    }}
                  >
                    {item.confidence}%
                  </div>

                  <button
                    onClick={() => removeAsset(item.id)}
                    style={styles.btnGhost}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}