import { Trade } from "@/types/trade";

/**
 * =========================
 * 📊 EQUITY CURVE (FIXED)
 * =========================
 */

export function buildEquityCurve(trades: Trade[], balance: number) {
  // Safe date to timestamp converter
  const toTimestamp = (date: string | number | Date | undefined | null): number => {
    if (date === undefined || date === null || date === "") return NaN;
    const d = new Date(date);
    const t = d.getTime();
    return Number.isFinite(t) ? t : NaN;
  };

  // Зөвхөн хүчинтэй close_time-тай trades-ийг шүүх
  const validTrades = (Array.isArray(trades) ? trades : [])
    .map((trade) => ({
      trade,
      time: toTimestamp(trade.close_time),
    }))
    .filter(({ time }) => Number.isFinite(time))
    .sort((a, b) => a.time - b.time);

  // Хэрэв хүчинтэй trade байхгүй бол зөвхөн эхлэлийн цэг
  if (validTrades.length === 0) {
    return [{ date: Date.now(), equity: balance, drawdown: 0 }];
  }

  let equity = balance;
  let peak = balance;

  const result: { date: number; equity: number; drawdown: number }[] = [];

  // Эхлэлийн цэг — эхний trade-ээс 1 өдрийн өмнө
  const firstTradeTime = validTrades[0].time;
  result.push({
    date: firstTradeTime - 24 * 60 * 60 * 1000,
    equity: balance,
    drawdown: 0,
  });

  for (const { trade, time } of validTrades) {
    const profit = Number(trade.profit ?? 0);
    if (!Number.isFinite(profit)) continue;

    equity = Number((equity + profit).toFixed(2));

    if (equity > peak) peak = equity;
    const drawdownPercent = peak > 0 ? ((peak - equity) / peak) * 100 : 0;

    result.push({
      date: time,
      equity,
      drawdown: Number(drawdownPercent.toFixed(2)),
    });
  }

  return result;
}

/**
 * =========================
 * 📉 EQUITY + DRAWDOWN
 * =========================
 */

const getTime = (date: string | number | Date | null | undefined): number => {
  if (!date) return 0;
  const d = new Date(date);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

export function buildEquityWithDrawdown(trades: Trade[], balance: number) {
  // Хоосон trades үед эхлэлийн цэг буцаах
  if (!trades || trades.length === 0) {
    return [
      {
        date: Date.now(),
        equity: balance,
        drawdown: 0,
        peak: balance,
      },
    ];
  }

  // Filter and sort
  const validTrades = trades.filter((t) => t.close_time);

  if (validTrades.length === 0) {
    return [
      {
        date: Date.now(),
        equity: balance,
        drawdown: 0,
        peak: balance,
      },
    ];
  }

  const sortedTrades = [...validTrades].sort(
    (a, b) => getTime(a.close_time) - getTime(b.close_time),
  );

  let equity = balance;
  let peak = balance;
  const result: {
    date: number;
    equity: number;
    drawdown: number;
    peak: number;
  }[] = [];

  // Эхлэлийн цэг
  const firstTime = getTime(sortedTrades[0].close_time);
  result.push({
    date: firstTime - 86400000, // One day before
    equity: balance,
    drawdown: 0,
    peak: balance,
  });

  // Trade бүрээр тооцоолох
  for (const trade of sortedTrades) {
    const profit = Number(trade.profit || 0);
    equity = Number((equity + profit).toFixed(2));

    if (equity > peak) {
      peak = equity;
    }

    let drawdownPercent = 0;
    if (peak > 0 && equity < peak) {
      drawdownPercent = ((equity - peak) / peak) * 100;
      drawdownPercent = Number(drawdownPercent.toFixed(2));
    }

    result.push({
      date: getTime(trade.close_time),
      equity: equity,
      drawdown: drawdownPercent,
      peak: peak,
    });
  }

  return result;
}

/**
 * =========================
 * 📈 ROLLING EQUITY (SAFE)
 * =========================
 */
export function buildRollingEquity(values: number[], window = 5) {
  const result: number[] = [];

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);

    const avg = slice.reduce((sum, val) => sum + val, 0) / slice.length;

    result.push(Number(avg.toFixed(2)));
  }

  return result;
}
