"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type AssetType = "CRYPTO" | "STOCK" | "ETF";
type Zone = "IN_BUY_ZONE" | "APPROACHING" | "NOT_ATTRACTIVE";

type WatchItem = {
  id: string;
  ticker: string;
  type: AssetType;
  addedAt: number;
  zone: Zone;
  confidence: number;
  previousConfidence: number | null;
};

const STORAGE_KEY = "buyzone-watchlist";
const ZONE_ORDER: Zone[] = ["IN_BUY_ZONE", "APPROACHING", "NOT_ATTRACTIVE"];

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, rgba(26,26,34,0.95) 0%, #060606 42%, #000 100%)",
    color: "#EAEAEA",
    padding: 40,
    fontFamily:
      "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  },

  wrap: {
    maxWidth: 980,
    margin: "0 auto",
  },

  headerTitle: {
    fontSize: 52,
    fontWeight: 800,
    margin: 0,
    letterSpacing: -1.2,
  },

  headerSub: {
    opacity: 0.68,
    marginTop: 10,
    marginBottom: 28,
    fontSize: 17,
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 14,
    marginBottom: 18,
  },

  summaryCard: {
    borderRadius: 18,
    padding: 16,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    boxShadow: "0 10px 26px rgba(0,0,0,0.22)",
  },

  summaryLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 8,
    letterSpacing: 0.3,
    textTransform: "uppercase" as const,
  },

  summaryValue: {
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1.1,
  },

  summarySubtle: {
    marginTop: 6,
    fontSize: 12,
    opacity: 0.68,
  },

  summaryTopTicker: {
    fontSize: 24,
    fontWeight: 800,
    lineHeight: 1.1,
    fontFamily: "ui-monospace, monospace",
  },

  card: {
    borderRadius: 24,
    padding: 22,
    background: "rgba(10,10,12,0.92)",
    border: "1px solid rgba(255,255,255,0.07)",
    boxShadow: "0 18px 45px rgba(0,0,0,0.45)",
    backdropFilter: "blur(8px)",
  },

  topControls: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap" as const,
    alignItems: "center",
    marginBottom: 8,
  },

  input: {
    padding: "13px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "#0E0E11",
    color: "#fff",
    outline: "none",
    fontSize: 15,
  },

  btnPrimary: {
    padding: "13px 18px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
  },

  btnGhost: {
    padding: "13px 18px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "transparent",
    color: "rgba(255,255,255,0.88)",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },

  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 8,
    opacity: 0.72,
    fontSize: 13,
    letterSpacing: 0.2,
  },

  sectionsWrap: {
    display: "grid",
    gap: 22,
    marginTop: 16,
  },

  sectionCard: {
    borderRadius: 20,
    padding: 16,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },

  sectionTitleWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    flexShrink: 0,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },

  sectionCount: {
    fontSize: 12,
    opacity: 0.7,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
  },

  sectionDivider: {
    height: 1,
    background: "rgba(255,255,255,0.06)",
    marginBottom: 14,
  },

  itemGrid: {
    display: "grid",
    gap: 14,
  },

  itemCardBase: {
    padding: 18,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.07)",
    background:
      "linear-gradient(180deg, rgba(18,18,22,0.96) 0%, rgba(10,10,12,0.98) 100%)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 18,
  },

  leftBlock: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
    minWidth: 0,
    flex: 1,
  },

  tickerRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap" as const,
  },

  ticker: {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: 0.6,
    fontFamily: "ui-monospace, monospace",
  },

  topPickBadge: {
    fontSize: 11,
    fontWeight: 800,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#fff",
    whiteSpace: "nowrap" as const,
  },

  subtle: {
    fontSize: 12.5,
    opacity: 0.72,
  },

  progressRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    fontWeight: 700,
  },

  progressIcon: {
    minWidth: 16,
    display: "inline-block",
  },

  confidenceLine: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    fontSize: 12,
    opacity: 0.88,
  },

  barTrack: {
    width: "100%",
    height: 9,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    overflow: "hidden" as const,
    border: "1px solid rgba(255,255,255,0.04)",
  },

  barFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 350ms ease",
  },

  meterRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
    marginTop: 8,
    fontSize: 10.5,
    opacity: 0.5,
    letterSpacing: 0.2,
  },

  meterCellLeft: {
    textAlign: "left" as const,
  },

  meterCellCenter: {
    textAlign: "center" as const,
  },

  meterCellRight: {
    textAlign: "right" as const,
  },

  badge: {
    fontSize: 12,
    fontWeight: 800,
    padding: "8px 13px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    whiteSpace: "nowrap" as const,
  },

  rightBlock: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexShrink: 0,
  },

  removeBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "transparent",
    color: "rgba(255,255,255,0.82)",
    cursor: "pointer",
    fontSize: 20,
    lineHeight: 1,
  },

  emptyState: {
    padding: "22px 14px",
    borderRadius: 16,
    border: "1px dashed rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.02)",
    textAlign: "center" as const,
    opacity: 0.72,
    marginTop: 14,
  },
};

function normalizeTicker(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function isValidTicker(value: string) {
  return /^[A-Z0-9.\-]{1,15}$/.test(value);
}

function typeLabel(type: AssetType) {
  return type === "CRYPTO" ? "Crypto" : type === "STOCK" ? "Stock" : "ETF";
}

function zoneLabel(zone: Zone) {
  if (zone === "IN_BUY_ZONE") return "In Buy Zone";
  if (zone === "APPROACHING") return "Approaching";
  return "Not Attractive";
}

function zoneSectionLabel(zone: Zone) {
  if (zone === "IN_BUY_ZONE") return "In Buy Zone";
  if (zone === "APPROACHING") return "Approaching";
  return "Not Attractive";
}

function hashToInt(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function confidenceToZone(confidence: number): Zone {
  if (confidence >= 70) return "IN_BUY_ZONE";
  if (confidence >= 50) return "APPROACHING";
  return "NOT_ATTRACTIVE";
}

function computeBaseSignal(ticker: string, type: AssetType) {
  const hash = hashToInt(`${type}:${ticker}`);
  return 30 + (hash % 60);
}

function computeRefreshShift(seed: string) {
  const nowBucket = Math.floor(Date.now() / 60000);
  const hash = hashToInt(`${seed}:${nowBucket}`);
  return (hash % 7) - 3;
}

function clampConfidence(value: number) {
  return Math.max(0, Math.min(100, value));
}

function computeMockSignal(
  ticker: string,
  type: AssetType,
  previousConfidence?: number | null
) {
  if (previousConfidence == null) {
    const confidence = computeBaseSignal(ticker, type);
    return {
      confidence,
      zone: confidenceToZone(confidence),
    };
  }

  const shift = computeRefreshShift(`${type}:${ticker}`);
  const confidence = clampConfidence(previousConfidence + shift);

  return {
    confidence,
    zone: confidenceToZone(confidence),
  };
}

function zoneGlow(zone: Zone) {
  if (zone === "IN_BUY_ZONE") return "0 0 30px rgba(46,204,113,0.28)";
  if (zone === "APPROACHING") return "0 0 28px rgba(241,196,15,0.22)";
  return "0 0 22px rgba(255,255,255,0.09)";
}

function zoneBorder(zone: Zone) {
  if (zone === "IN_BUY_ZONE") return "1px solid rgba(46,204,113,0.18)";
  if (zone === "APPROACHING") return "1px solid rgba(241,196,15,0.16)";
  return "1px solid rgba(255,255,255,0.07)";
}

function zoneBadgeBg(zone: Zone) {
  if (zone === "IN_BUY_ZONE") return "rgba(46,204,113,0.92)";
  if (zone === "APPROACHING") return "rgba(241,196,15,0.92)";
  return "rgba(255,255,255,0.12)";
}

function zoneBadgeText(zone: Zone) {
  if (zone === "NOT_ATTRACTIVE") return "rgba(255,255,255,0.9)";
  return "#000";
}

function zoneBarFill(zone: Zone) {
  if (zone === "IN_BUY_ZONE") {
    return "linear-gradient(90deg, rgba(39,174,96,0.95) 0%, rgba(46,204,113,1) 100%)";
  }
  if (zone === "APPROACHING") {
    return "linear-gradient(90deg, rgba(214,162,0,0.95) 0%, rgba(241,196,15,1) 100%)";
  }
  return "linear-gradient(90deg, rgba(130,130,130,0.9) 0%, rgba(190,190,190,0.95) 100%)";
}

function zoneSectionDot(zone: Zone) {
  if (zone === "IN_BUY_ZONE") return "#2ECC71";
  if (zone === "APPROACHING") return "#F1C40F";
  return "rgba(255,255,255,0.72)";
}

function zoneRank(zone: Zone) {
  if (zone === "IN_BUY_ZONE") return 3;
  if (zone === "APPROACHING") return 2;
  return 1;
}

function getProgressMeta(current: number, previous: number | null) {
  if (previous == null) {
    return {
      icon: "▬",
      label: "New setup",
      deltaText: "Tracking started",
      color: "rgba(255,255,255,0.72)",
    };
  }

  const delta = current - previous;

  if (delta > 0) {
    return {
      icon: "▲",
      label: "Improving",
      deltaText: `+${delta} since refresh`,
      color: "#2ECC71",
    };
  }

  if (delta < 0) {
    return {
      icon: "▼",
      label: "Weakening",
      deltaText: `${delta} since refresh`,
      color: "#F1C40F",
    };
  }

  return {
    icon: "▬",
    label: "Stable",
    deltaText: "No change",
    color: "rgba(255,255,255,0.72)",
  };
}

function defaultItems(): WatchItem[] {
  const btc = computeMockSignal("BTC", "CRYPTO");
  const aapl = computeMockSignal("AAPL", "STOCK");

  return [
    {
      id: "seed-btc",
      ticker: "BTC",
      type: "CRYPTO",
      addedAt: 2,
      previousConfidence: null,
      ...btc,
    },
    {
      id: "seed-aapl",
      ticker: "AAPL",
      type: "STOCK",
      addedAt: 1,
      previousConfidence: null,
      ...aapl,
    },
  ];
}

function safeLoad(): WatchItem[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    return parsed.map((item) => {
      const confidence =
        typeof item.confidence === "number" ? item.confidence : 40;

      const previousConfidence =
        typeof item.previousConfidence === "number"
          ? item.previousConfidence
          : null;

      return {
        id: String(item.id),
        ticker: String(item.ticker),
        type: item.type as AssetType,
        addedAt: Number(item.addedAt),
        confidence,
        previousConfidence,
        zone: confidenceToZone(confidence),
      };
    });
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
  const [items, setItems] = useState<WatchItem[]>(defaultItems);
  const didLoadRef = useRef(false);

  useEffect(() => {
    const saved = safeLoad();
    if (saved) {
      setItems(saved);
    }
    didLoadRef.current = true;
  }, []);

  useEffect(() => {
    if (!didLoadRef.current) return;
    safeSave(items);
  }, [items]);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const zoneDiff = zoneRank(b.zone) - zoneRank(a.zone);
      if (zoneDiff !== 0) return zoneDiff;

      const confidenceDiff = b.confidence - a.confidence;
      if (confidenceDiff !== 0) return confidenceDiff;

      return b.addedAt - a.addedAt;
    });
  }, [items]);

  const grouped = useMemo(() => {
    return {
      IN_BUY_ZONE: sorted.filter((item) => item.zone === "IN_BUY_ZONE"),
      APPROACHING: sorted.filter((item) => item.zone === "APPROACHING"),
      NOT_ATTRACTIVE: sorted.filter((item) => item.zone === "NOT_ATTRACTIVE"),
    };
  }, [sorted]);

  const topItem = sorted[0] ?? null;

  async function addAsset() {
    const ticker = normalizeTicker(tickerInput);

    if (!ticker) return;
    if (!isValidTicker(ticker)) return;

    try {
      const res = await fetch(`/api/lookup?ticker=${ticker}`);
      const data = await res.json();

      if (!data.ok) {
        alert("Ticker not found");
        return;
      }

      const realType = data.type as AssetType;

      setItems((prev) => {
        if (prev.some((item) => item.ticker === data.ticker)) {
          return prev;
        }

        const signal = computeMockSignal(data.ticker, realType);

        return [
          {
            id: `id-${Date.now()}`,
            ticker: data.ticker,
            type: realType,
            addedAt: Date.now(),
            previousConfidence: null,
            ...signal,
          },
          ...prev,
        ];
      });

      setTickerInput("");
    } catch (error) {
      console.error(error);
      alert("Something went wrong looking up that ticker");
    }
  }

  function refresh() {
    setItems((prev) =>
      prev.map((item) => {
        const signal = computeMockSignal(item.ticker, item.type, item.confidence);

        return {
          ...item,
          previousConfidence: item.confidence,
          ...signal,
        };
      })
    );
  }

  function removeAsset(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <h1 style={styles.headerTitle}>BuyZone</h1>
        <p style={styles.headerSub}>Calm buy zone intelligence.</p>

        <div style={styles.summaryGrid}>
          <div
            style={{
              ...styles.summaryCard,
              border: "1px solid rgba(46,204,113,0.16)",
              boxShadow: "0 0 24px rgba(46,204,113,0.12)",
            }}
          >
            <div style={styles.summaryLabel}>In Buy Zone</div>
            <div style={styles.summaryValue}>{grouped.IN_BUY_ZONE.length}</div>
            <div style={styles.summarySubtle}>High-conviction setups</div>
          </div>

          <div
            style={{
              ...styles.summaryCard,
              border: "1px solid rgba(241,196,15,0.16)",
              boxShadow: "0 0 24px rgba(241,196,15,0.10)",
            }}
          >
            <div style={styles.summaryLabel}>Approaching</div>
            <div style={styles.summaryValue}>{grouped.APPROACHING.length}</div>
            <div style={styles.summarySubtle}>Developing opportunities</div>
          </div>

          <div
            style={{
              ...styles.summaryCard,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={styles.summaryLabel}>Not Attractive</div>
            <div style={styles.summaryValue}>{grouped.NOT_ATTRACTIVE.length}</div>
            <div style={styles.summarySubtle}>Currently low edge</div>
          </div>

          <div
            style={{
              ...styles.summaryCard,
              border:
                topItem?.zone === "IN_BUY_ZONE"
                  ? "1px solid rgba(46,204,113,0.16)"
                  : topItem?.zone === "APPROACHING"
                  ? "1px solid rgba(241,196,15,0.16)"
                  : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={styles.summaryLabel}>Top Opportunity</div>

            {topItem ? (
              <>
                <div style={styles.summaryTopTicker}>{topItem.ticker}</div>
                <div style={styles.summarySubtle}>
                  {zoneLabel(topItem.zone)} • {topItem.confidence}%
                </div>
              </>
            ) : (
              <div style={styles.summarySubtle}>No assets yet</div>
            )}
          </div>
        </div>

        <section style={styles.card}>
          <div style={styles.topControls}>
            <select
              value={typeInput}
              onChange={(e) => setTypeInput(e.target.value as AssetType)}
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
              style={{ ...styles.input, flex: 1, minWidth: 220 }}
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

          {sorted.length === 0 ? (
            <div style={styles.emptyState}>
              No assets yet. Add a ticker to start building your watchlist.
            </div>
          ) : (
            <div style={styles.sectionsWrap}>
              {ZONE_ORDER.map((zone) => {
                const zoneItems = grouped[zone];
                if (zoneItems.length === 0) return null;

                return (
                  <div key={zone} style={styles.sectionCard}>
                    <div style={styles.sectionHeader}>
                      <div style={styles.sectionTitleWrap}>
                        <div
                          style={{
                            ...styles.sectionDot,
                            background: zoneSectionDot(zone),
                            boxShadow:
                              zone === "IN_BUY_ZONE"
                                ? "0 0 12px rgba(46,204,113,0.65)"
                                : zone === "APPROACHING"
                                ? "0 0 12px rgba(241,196,15,0.55)"
                                : "0 0 10px rgba(255,255,255,0.28)",
                          }}
                        />
                        <div style={styles.sectionTitle}>
                          {zoneSectionLabel(zone)}
                        </div>
                      </div>

                      <div style={styles.sectionCount}>
                        {zoneItems.length} {zoneItems.length === 1 ? "asset" : "assets"}
                      </div>
                    </div>

                    <div style={styles.sectionDivider} />

                    <div style={styles.itemGrid}>
                      {zoneItems.map((item) => {
                        const isTopPick = topItem?.id === item.id;
                        const progress = getProgressMeta(
                          item.confidence,
                          item.previousConfidence
                        );

                        return (
                          <div
                            key={item.id}
                            style={{
                              ...styles.itemCardBase,
                              boxShadow: zoneGlow(item.zone),
                              border: zoneBorder(item.zone),
                            }}
                          >
                            <div style={styles.leftBlock}>
                              <div style={styles.tickerRow}>
                                <div style={styles.ticker}>{item.ticker}</div>

                                {isTopPick && (
                                  <div style={styles.topPickBadge}>
                                    ★ Highest Conviction
                                  </div>
                                )}
                              </div>

                              <div style={styles.subtle}>
                                {typeLabel(item.type)} • {zoneLabel(item.zone)}
                              </div>

                              <div
                                style={{
                                  ...styles.progressRow,
                                  color: progress.color,
                                }}
                              >
                                <span style={styles.progressIcon}>{progress.icon}</span>
                                <span>{progress.label}</span>
                                <span style={{ opacity: 0.8 }}>{progress.deltaText}</span>
                              </div>

                              <div style={{ display: "grid", gap: 7 }}>
                                <div style={styles.confidenceLine}>
                                  <span>Signal strength</span>
                                  <span>{item.confidence}%</span>
                                </div>

                                <div style={styles.barTrack}>
                                  <div
                                    style={{
                                      ...styles.barFill,
                                      width: `${item.confidence}%`,
                                      background: zoneBarFill(item.zone),
                                      boxShadow:
                                        item.zone === "IN_BUY_ZONE"
                                          ? "0 0 14px rgba(46,204,113,0.45)"
                                          : item.zone === "APPROACHING"
                                          ? "0 0 12px rgba(241,196,15,0.35)"
                                          : "0 0 10px rgba(255,255,255,0.14)",
                                    }}
                                  />
                                </div>

                                <div style={styles.meterRow}>
                                  <div style={styles.meterCellLeft}>Not Attractive</div>
                                  <div style={styles.meterCellCenter}>Approaching</div>
                                  <div style={styles.meterCellRight}>In Buy Zone</div>
                                </div>
                              </div>
                            </div>

                            <div style={styles.rightBlock}>
                              <div
                                style={{
                                  ...styles.badge,
                                  background: zoneBadgeBg(item.zone),
                                  color: zoneBadgeText(item.zone),
                                }}
                              >
                                {zoneLabel(item.zone)} • {item.confidence}%
                              </div>

                              <button
                                onClick={() => removeAsset(item.id)}
                                style={styles.removeBtn}
                                aria-label={`Remove ${item.ticker}`}
                                title={`Remove ${item.ticker}`}
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}