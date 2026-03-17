export type Zone = "IN_BUY_ZONE" | "APPROACHING" | "NOT_ATTRACTIVE";

export type PriceBar = {
  datetime: string;
  close: number;
};

export type BuyZoneFactors = {
  drawdownScore: number;
  trendScore: number;
  volatilityScore: number;
  recoveryScore: number;
  drawdownPercent: number;
  above50MA: boolean;
  above200MA: boolean;
  ma50Above200: boolean;
  volatilityPercent: number;
  reboundFrom20DayLowPercent: number;
};

export type BuyZoneSignal = {
  ticker: string;
  currentPrice: number;
  high52Week: number;
  low52Week: number;
  drawdownPercent: number;
  score: number;
  zone: Zone;
  factors: BuyZoneFactors;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getSMA(values: number[], length: number) {
  if (values.length < length) return null;
  const slice = values.slice(-length);
  return average(slice);
}

function getDailyReturns(closes: number[]) {
  const returns: number[] = [];

  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1];
    const curr = closes[i];
    if (prev <= 0) continue;
    returns.push(((curr - prev) / prev) * 100);
  }

  return returns;
}

function mapScoreToZone(score: number): Zone {
  if (score >= 70) return "IN_BUY_ZONE";
  if (score >= 50) return "APPROACHING";
  return "NOT_ATTRACTIVE";
}

function scoreDrawdown(drawdownPercent: number) {
  // Best zone is roughly 15% to 35% off highs.
  // Too close to highs = not much opportunity.
  // Too deep = can be damaged, so taper after 35%.
  if (drawdownPercent <= 0) return 0;
  if (drawdownPercent < 5) return 5;
  if (drawdownPercent < 10) return 12;
  if (drawdownPercent < 15) return 22;
  if (drawdownPercent < 20) return 32;
  if (drawdownPercent < 25) return 40;
  if (drawdownPercent < 35) return 45;
  if (drawdownPercent < 45) return 34;
  if (drawdownPercent < 55) return 22;
  return 10;
}

function scoreTrend(
  current: number,
  ma50: number | null,
  ma200: number | null
) {
  let score = 0;

  const above50MA = ma50 != null ? current > ma50 : false;
  const above200MA = ma200 != null ? current > ma200 : false;
  const ma50Above200 =
    ma50 != null && ma200 != null ? ma50 > ma200 : false;

  if (above50MA) score += 10;
  if (above200MA) score += 8;
  if (ma50Above200) score += 7;

  return {
    score,
    above50MA,
    above200MA,
    ma50Above200,
  };
}

function scoreVolatility(volatilityPercent: number) {
  // Lower average daily movement is calmer and more investable.
  if (volatilityPercent < 1) return 15;
  if (volatilityPercent < 1.5) return 13;
  if (volatilityPercent < 2.25) return 10;
  if (volatilityPercent < 3.5) return 7;
  if (volatilityPercent < 5) return 4;
  return 1;
}

function scoreRecovery(reboundFrom20DayLowPercent: number) {
  // We want signs of stabilization/recovery, not pure collapse.
  if (reboundFrom20DayLowPercent < 0) return 0;
  if (reboundFrom20DayLowPercent < 2) return 3;
  if (reboundFrom20DayLowPercent < 5) return 6;
  if (reboundFrom20DayLowPercent < 8) return 10;
  if (reboundFrom20DayLowPercent < 15) return 13;
  return 15;
}

export function calculateBuyZoneSignal(
  ticker: string,
  bars: PriceBar[]
): BuyZoneSignal {
  if (bars.length < 200) {
    throw new Error("At least 200 daily bars are required to calculate signal.");
  }

  const sortedBars = [...bars].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );

  const closes = sortedBars.map((bar) => bar.close).filter((v) => Number.isFinite(v));

  if (closes.length < 200) {
    throw new Error("Not enough valid closing prices.");
  }

  const currentPrice = closes[closes.length - 1];
  const trailing252 = closes.slice(-252);
  const trailing20 = closes.slice(-20);

  const high52Week = Math.max(...trailing252);
  const low52Week = Math.min(...trailing252);
  const low20Day = Math.min(...trailing20);

  const drawdownPercent =
    high52Week > 0 ? ((high52Week - currentPrice) / high52Week) * 100 : 0;

  const ma50 = getSMA(closes, 50);
  const ma200 = getSMA(closes, 200);

  const recentReturns = getDailyReturns(closes.slice(-21));
  const volatilityPercent = average(recentReturns.map((r) => Math.abs(r)));

  const reboundFrom20DayLowPercent =
    low20Day > 0 ? ((currentPrice - low20Day) / low20Day) * 100 : 0;

  const drawdownScore = scoreDrawdown(drawdownPercent);

  const trend = scoreTrend(currentPrice, ma50, ma200);
  const trendScore = trend.score;

  const volatilityScore = scoreVolatility(volatilityPercent);
  const recoveryScore = scoreRecovery(reboundFrom20DayLowPercent);

  const rawScore =
    drawdownScore + trendScore + volatilityScore + recoveryScore;

  const score = clamp(Math.round(rawScore), 0, 100);
  const zone = mapScoreToZone(score);

  return {
    ticker,
    currentPrice,
    high52Week,
    low52Week,
    drawdownPercent: Number(drawdownPercent.toFixed(2)),
    score,
    zone,
    factors: {
      drawdownScore,
      trendScore,
      volatilityScore,
      recoveryScore,
      drawdownPercent: Number(drawdownPercent.toFixed(2)),
      above50MA: trend.above50MA,
      above200MA: trend.above200MA,
      ma50Above200: trend.ma50Above200,
      volatilityPercent: Number(volatilityPercent.toFixed(2)),
      reboundFrom20DayLowPercent: Number(reboundFrom20DayLowPercent.toFixed(2)),
    },
  };
}