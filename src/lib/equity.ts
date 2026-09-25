import { Trade } from "@/types/trade";

/**
 * =========================
 * 📊 EQUITY CURVE (FIXED)
 *
 * ⚠️ Энэ функц нь БҮХ төрлийг оруулна:
 *    - buy, sell (арилжаа)
 *    - payout, violation, deposit (балансын бичлэг)
 *
 * Учир нь equity curve нь бүх balance өөрчлөлтийг харуулах ёстой.
 * =========================
 */

export function buildEquityCurve(trades: Trade[], balance: number) {
  // Safe date to timestamp converter
  const toTimestamp = (
    date: string | number | Date | undefined | null,
  ): number => {
    if (date === undefined || date === null || date === "") return NaN;
    const d = new Date(date);
    const t = d.getTime();
    return Number.isFinite(t) ? t : NaN;
  };

  // ⭐ close_time БАЙХГҮЙ бол open_time-ийг ашиглана
  // (payout/violation/deposit-д ихэвчлэн close_time = open_time)
  const getTradeTime = (trade: Trade): number => {
    const closeTime = toTimestamp(trade.close_time);
    if (Number.isFinite(closeTime)) return closeTime;

    const openTime = toTimestamp(trade.open_time);
    if (Number.isFinite(openTime)) return openTime;

    return NaN;
  };

  // Зөвхөн хүчинтэй цагтай trades-ийг шүүх
  const validTrades = (Array.isArray(trades) ? trades : [])
    .map((trade) => ({
      trade,
      time: getTradeTime(trade),
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
 *
 * ⚠️ Энэ функц нь БҮХ төрлийг оруулна.
 * =========================
 */

const getTime = (date: string | number | Date | null | undefined): number => {
  if (!date) return 0;
  const d = new Date(date);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

/**
 * close_time БАЙХГҮЙ бол open_time-ийг буцаана
 */
const getTradeTime = (trade: Trade): number => {
  const closeTime = getTime(trade.close_time);
  if (closeTime > 0) return closeTime;

  const openTime = getTime(trade.open_time);
  if (openTime > 0) return openTime;

  return 0;
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

  // ⭐ close_time эсвэл open_time-тай trades-ийг шүүх
  const validTrades = trades.filter(
    (t) => getTradeTime(t) > 0 && Number.isFinite(Number(t.profit ?? 0)),
  );

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

  // Sort by time
  const sortedTrades = [...validTrades].sort(
    (a, b) => getTradeTime(a) - getTradeTime(b),
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
  const firstTime = getTradeTime(sortedTrades[0]);
  result.push({
    date: firstTime - 86400000, // One day before
    equity: balance,
    drawdown: 0,
    peak: balance,
  });

  // Trade бүрээр тооцоолох (бүх төрөл)
  for (const trade of sortedTrades) {
    const profit = Number(trade.profit ?? 0);
    if (!Number.isFinite(profit)) continue;

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
      date: getTradeTime(trade),
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
