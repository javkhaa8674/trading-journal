import { Trade } from "@/types/trade";
import { getSafeDateString } from "@/lib/utils/dateUtils";
import { getRealTrades } from "@/lib/utils/tradeFilters";

/**
 * =========================
 * 📊 BASIC STATS (Зөвхөн buy/sell)
 * =========================
 */

export function calculateTradeCount(trades: Trade[]) {
  // ⭐ Зөвхөн жинхэнэ арилжаанууд
  return getRealTrades(trades || []).length;
}

export function calculateWinRate(trades: Trade[]) {
  const realTrades = getRealTrades(trades || []);
  const wins = realTrades.filter((t) => (t.profit || 0) > 0);

  return realTrades.length ? (wins.length / realTrades.length) * 100 : 0;
}

export function calculateLossRate(trades: Trade[]) {
  const realTrades = getRealTrades(trades || []);
  const losses = realTrades.filter((t) => (t.profit || 0) < 0);

  return realTrades.length ? (losses.length / realTrades.length) * 100 : 0;
}

/**
 * ⚠️ Net Profit — энэ нь БҮХ төрлийг оруулна
 * (equity, balance-д нөлөөлдөг)
 */
export function calculateNetProfit(trades: Trade[]) {
  return (trades || []).reduce((sum, t) => sum + Number(t.profit || 0), 0);
}

/**
 * ⚠️ Net Trade Profit — ЗӨВХӨН buy/sell
 */
export function calculateNetTradeProfit(trades: Trade[]) {
  return getRealTrades(trades || []).reduce(
    (sum, t) => sum + Number(t.profit || 0),
    0,
  );
}

export function calculateProfitFactor(trades: Trade[]) {
  const realTrades = getRealTrades(trades || []);

  const wins = realTrades.filter((t) => (t.profit || 0) > 0);
  const losses = realTrades.filter((t) => (t.profit || 0) < 0);

  const grossProfit = wins.reduce((s, t) => s + Number(t.profit || 0), 0);

  const grossLoss = Math.abs(
    losses.reduce((s, t) => s + Number(t.profit || 0), 0),
  );

  return grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
}

/**
 * =========================
 * 📈 ADVANCED STATS (Зөвхөн buy/sell)
 * =========================
 */

export function calculateAvgWin(trades: Trade[]) {
  const realTrades = getRealTrades(trades || []);
  const wins = realTrades.filter((t) => (t.profit || 0) > 0);

  return wins.length
    ? wins.reduce((s, t) => s + Number(t.profit || 0), 0) / wins.length
    : 0;
}

export function calculateAvgLoss(trades: Trade[]) {
  const realTrades = getRealTrades(trades || []);
  const losses = realTrades.filter((t) => (t.profit || 0) < 0);

  return losses.length
    ? losses.reduce((s, t) => s + Number(t.profit || 0), 0) / losses.length
    : 0;
}

/**
 * =========================
 * 💡 EXPECTANCY (Зөвхөн buy/sell)
 * =========================
 */

export function calculateExpectancy(trades: Trade[]) {
  const realTrades = getRealTrades(trades || []);

  const winRate = calculateWinRate(realTrades) / 100;
  const avgWin = calculateAvgWin(realTrades);
  const avgLoss = calculateAvgLoss(realTrades);

  return winRate * avgWin + (1 - winRate) * avgLoss;
}

/**
 * =========================
 * 📦 POSITION SIZE (Зөвхөн buy/sell)
 * =========================
 */

export function calculateAvgPositionSize(trades: Trade[]) {
  const realTrades = getRealTrades(trades || []);

  return realTrades.length
    ? realTrades.reduce((s, t) => s + Number(t.lot_size || 0), 0) /
        realTrades.length
    : 0;
}

/**
 * =========================
 * ⏱ HOLDING TIME (minutes)
 * Зөвхөн buy/sell
 * =========================
 */

export function calculateAvgHoldingTime(trades: Trade[]): number {
  const realTrades = getRealTrades(trades || []);

  if (realTrades.length === 0) return 0;

  let totalMinutes = 0;
  let validCount = 0;

  for (const trade of realTrades) {
    if (!trade.open_time || !trade.close_time) continue;

    const openTime = new Date(trade.open_time).getTime();
    const closeTime = new Date(trade.close_time).getTime();

    if (isNaN(openTime) || isNaN(closeTime)) continue;
    if (closeTime < openTime) continue;

    totalMinutes += (closeTime - openTime) / (1000 * 60);
    validCount++;
  }

  return validCount === 0 ? 0 : totalMinutes / validCount;
}

/**
 * =========================
 * 📊 REAL RRR (profit / risk)
 *
 * ⚠️ Зөвхөн бодит арилжааны RRR:
 *
 *   realRRR = profit / risk
 *
 * risk = entry_price - stop_loss (buy)
 *        stop_loss - entry_price (sell)
 *
 * Break-even (SL нь entry-тэй хэт ойрхон) арилжаануудыг алгасна.
 * Planned RRR (TP/SL дээр суурилсан) огт ашиглагдахгүй.
 * =========================
 */

/**
 * Symbol-оос хамаарч MIN_RISK_PERCENT
 *
 * Энэ нь "SL хэт ойрхон байвал break-even гэж үзнэ" гэсэн үг.
 */
function getMinRiskPercent(symbol: string | null): number {
  if (!symbol) return 0.001;

  const upper = symbol.toUpperCase();

  // Gold: 0.1%
  if (upper.includes("XAU")) return 0.001;

  // Forex: 0.05%
  if (upper.includes("USD") || upper.includes("EUR")) return 0.0005;

  // Crypto: 0.5%
  if (upper.includes("BTC") || upper.includes("ETH")) return 0.005;

  return 0.001;
}

/**
 * Тухайн арилжааны бодит RRR-ийг тооцоолно
 *
 * @returns profit / risk (эсвэл null)
 */
function calculateTradeRealRRR(
  trade: Trade,
  balanceAtEntry: number,
): number | null {
  // Зөвхөн buy/sell
  if (trade.type !== "buy" && trade.type !== "sell") return null;

  // profit шалгах
  if (trade.profit == null || !isFinite(trade.profit)) return null;

  // balance шалгах
  if (
    balanceAtEntry == null ||
    !isFinite(balanceAtEntry) ||
    balanceAtEntry <= 0
  ) {
    return null;
  }

  // ⭐ Risk = 1% of balance (SMC)
  const risk = balanceAtEntry * 0.01;

  if (risk <= 0) return null;

  const rrr = trade.profit / risk;

  // ⭐ Хэт том RRR-уудыг алгасна
  const MAX_RRR = 10;
  if (Math.abs(rrr) > MAX_RRR) return null;

  return rrr;
}

/**
 * Бүх арилжааны Real RRR-ийг тооцоолно
 *
 * ⭐ 3 үзүүлэлт:
 *   - overall — бүх арилжааны дундаж RRR
 *   - avgWin  — win арилжааны дундаж RRR
 *   - avgLoss — loss арилжааны дундаж RRR
 */
export function calculateRRR(trades: Trade[], startBalance: number = 5000) {
  const realTrades = getRealTrades(trades || []);

  if (!realTrades.length) {
    return {
      overall: 0,
      avgWin: 0,
      avgLoss: 0,
    };
  }

  // ⭐ Sort by open_time
  const sortedTrades = [...realTrades].sort(
    (a, b) => new Date(a.open_time).getTime() - new Date(b.open_time).getTime(),
  );

  let balance = startBalance;
  const allRRRs: number[] = [];
  const winRRRs: number[] = [];
  const lossRRRs: number[] = [];

  for (const trade of sortedTrades) {
    const rrr = calculateTradeRealRRR(trade, balance);

    if (rrr !== null && isFinite(rrr)) {
      allRRRs.push(rrr);

      if (trade.profit > 0) {
        winRRRs.push(rrr);
      } else if (trade.profit < 0) {
        lossRRRs.push(rrr);
      }
    }

    // ⭐ Balance-ийг шинэчлэх
    balance += trade.profit ?? 0;
    if (balance < 0) balance = 0;
  }

  return {
    overall: average(allRRRs),
    avgWin: average(winRRRs),
    avgLoss: average(lossRRRs),
  };
}

// =========================
// 🧠 helper
// =========================

function average(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

/**
 * =========================
 * 📉 DRAWDOWN (бүх төрөл — equity дээр суурилсан)
 * =========================
 */

export function calculateMaxDrawdownWithDuration(equity: number[]) {
  if (!equity.length) {
    return { maxDrawdown: 0, duration: 0 };
  }

  let peak = equity[0];
  let maxDrawdown = 0;
  let peakIndexAtMaxDD = 0;
  let troughIndexAtMaxDD = 0;
  let tempPeakIndex = 0;

  for (let i = 0; i < equity.length; i++) {
    if (equity[i] > peak) {
      peak = equity[i];
      tempPeakIndex = i;
    }

    const drawdown = peak - equity[i];

    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      peakIndexAtMaxDD = tempPeakIndex;
      troughIndexAtMaxDD = i;
    }
  }

  const duration = troughIndexAtMaxDD - peakIndexAtMaxDD;
  const percent = peak === 0 ? 0 : (maxDrawdown / peak) * 100;

  return {
    maxDrawdown: Number(percent.toFixed(2)),
    duration: Math.max(0, duration),
  };
}

export function calculateAvgDrawdown(equity: number[]) {
  if (!equity.length) return 0;

  let peak = equity[0];
  const drawdowns: number[] = [];
  let currentDD = 0;

  for (let i = 0; i < equity.length; i++) {
    const value = equity[i];

    if (value > peak) {
      if (currentDD > 0) {
        drawdowns.push(currentDD);
      }
      peak = value;
      currentDD = 0;
    } else {
      if (peak > 0) {
        const dd = ((peak - value) / peak) * 100;
        currentDD = Math.max(currentDD, dd);
      }
    }
  }

  if (currentDD > 0) {
    drawdowns.push(currentDD);
  }

  return drawdowns.length
    ? drawdowns.reduce((a, b) => a + b, 0) / drawdowns.length
    : 0;
}

/**
 * =========================
 * 📉 Monthly Performance (Зөвхөн buy/sell)
 * =========================
 */

export function buildMonthlyPerformance(trades: Trade[]) {
  const realTrades = getRealTrades(trades || []);

  const result: Record<string, { profit: number; count: number }> = {};

  realTrades.forEach((trade) => {
    if (!trade.close_time) return;

    const month = new Date(trade.close_time).toISOString().slice(0, 7); // YYYY-MM

    if (!result[month]) {
      result[month] = { profit: 0, count: 0 };
    }

    result[month].profit += Number(trade.profit || 0);
    result[month].count += 1;
  });

  return Object.entries(result).map(([month, value]) => ({
    month,
    profit: Number(value.profit.toFixed(2)),
    count: value.count,
  }));
}

/**
 * =========================
 * ⚠️ Risk Limits (БҮХ төрөл — equity, drawdown)
 * =========================
 */

export function calculateRiskLimits(trades: Trade[], startingBalance: number) {
  if (!trades || trades.length === 0) {
    return {
      dailyLossPercent: 0,
      totalDrawdown: 0,
      dailyBreached: false,
      totalBreached: false,
    };
  }

  const now = new Date();
  const todayDateString = now.toDateString();

  // 📌 DAILY LOSS — бүх төрөл
  const todayTrades = trades.filter((trade) => {
    if (!trade.close_time) return false;
    const closeDateString = getSafeDateString(trade.close_time);
    return closeDateString === todayDateString;
  });

  const todayPnL = todayTrades.reduce(
    (sum, trade) => sum + (trade.profit || 0),
    0,
  );
  const dailyLossPercent =
    startingBalance > 0 ? (todayPnL / startingBalance) * 100 : 0;

  // 📌 EQUITY CURVE & DRAWDOWN — бүх төрөл
  let equity = startingBalance;
  let peak = startingBalance;

  for (const trade of trades) {
    equity += trade.profit || 0;
    if (equity > peak) {
      peak = equity;
    }
  }

  const totalDrawdown = peak > 0 ? ((equity - peak) / peak) * 100 : 0;

  return {
    dailyLossPercent: Number(dailyLossPercent.toFixed(2)),
    totalDrawdown: Number(totalDrawdown.toFixed(2)),
    dailyBreached: dailyLossPercent <= -5,
    totalBreached: totalDrawdown <= -10,
  };
}
