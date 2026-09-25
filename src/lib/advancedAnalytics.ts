import { Trade } from "@/types/trade";
import { getRealTrades } from "@/lib/utils/tradeFilters";

export interface DailyPerformance {
  date: string;
  netProfit: number;
  tradeCount: number;
  winningTrades: number;
  losingTrades: number;
}

export interface InstrumentStats {
  symbol: string;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  volume: number;
}

export interface DurationPnL {
  durationHours: number;
  profit: number;
  symbol: string;
  isWin: boolean;
}

export interface LongShortStats {
  type: "Long" | "Short";
  totalTrades: number;
  wins: number;
  loss: number;
  winRate: number;
  totalProfit: number;
  avgProfit: number;
}

// ============================================================
// 1. Trading Day Performance
//    ⭐ Зөвхөн buy/sell
// ============================================================
export function getTradingDayPerformance(trades: Trade[]): DailyPerformance[] {
  // ⭐ Зөвхөн жинхэнэ арилжаанууд
  const realTrades = getRealTrades(trades);

  const dailyMap = new Map<string, DailyPerformance>();

  realTrades.forEach((trade) => {
    const date = new Date(trade.close_time || trade.open_time)
      .toISOString()
      .split("T")[0];

    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        date,
        netProfit: 0,
        tradeCount: 0,
        winningTrades: 0,
        losingTrades: 0,
      });
    }

    const day = dailyMap.get(date)!;
    day.netProfit += trade.profit;
    day.tradeCount++;
    if (trade.profit > 0) day.winningTrades++;
    if (trade.profit < 0) day.losingTrades++;
  });

  return Array.from(dailyMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

// ============================================================
// 2. Most Traded Instruments
//    ⭐ Зөвхөн buy/sell
// ============================================================
export function getMostTradedInstruments(
  trades: Trade[],
  limit: number = 10,
): InstrumentStats[] {
  const realTrades = getRealTrades(trades);

  const instrumentMap = new Map<string, InstrumentStats>();

  realTrades.forEach((trade) => {
    const symbol = trade.symbol;
    if (!symbol) return; // symbol хоосон бол алгасна

    if (!instrumentMap.has(symbol)) {
      instrumentMap.set(symbol, {
        symbol,
        totalProfit: 0,
        totalLoss: 0,
        netProfit: 0,
        tradeCount: 0,
        winCount: 0,
        lossCount: 0,
        winRate: 0,
        volume: 0,
      });
    }

    const stats = instrumentMap.get(symbol)!;
    stats.tradeCount++;
    stats.volume += trade.lot_size || 1;

    if (trade.profit > 0) {
      stats.totalProfit += trade.profit;
      stats.winCount++;
    } else if (trade.profit < 0) {
      stats.totalLoss += trade.profit;
      stats.lossCount++;
    }
    stats.netProfit = stats.totalProfit + stats.totalLoss;
    stats.winRate = (stats.winCount / stats.tradeCount) * 100;
  });

  return Array.from(instrumentMap.values())
    .sort((a, b) => b.tradeCount - a.tradeCount)
    .slice(0, limit);
}

// ============================================================
// 3. Daily Summary (Calendar ready)
//    ⭐ Зөвхөн buy/sell
// ============================================================
export function getDailySummary(
  trades: Trade[],
): Map<string, { count: number; profit: number }> {
  const realTrades = getRealTrades(trades);

  const dailySummary = new Map();

  realTrades.forEach((trade) => {
    const date = new Date(trade.close_time || trade.open_time)
      .toISOString()
      .split("T")[0];
    const existing = dailySummary.get(date) || { count: 0, profit: 0 };
    existing.count++;
    existing.profit += trade.profit;
    dailySummary.set(date, existing);
  });

  return dailySummary;
}

// ============================================================
// 4. Key Metrics
//    ⭐ Зөвхөн buy/sell
// ============================================================
export function getKeyMetrics(trades: Trade[]) {
  const realTrades = getRealTrades(trades);

  const profits = realTrades.map((t) => t.profit);
  const wins = profits.filter((p) => p > 0);
  const losses = profits.filter((p) => p < 0);

  const uniqueDays = new Set(
    realTrades.map(
      (t) => new Date(t.close_time || t.open_time).toISOString().split("T")[0],
    ),
  );

  const totalLots = realTrades.reduce((sum, t) => sum + (t.lot_size || 1), 0);

  return {
    numberOfDays: uniqueDays.size,
    totalLotsUsed: totalLots,
    biggestWin: wins.length > 0 ? Math.max(...wins) : 0,
    biggestLoss: losses.length > 0 ? Math.min(...losses) : 0,
    avgWin: wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0,
    avgLoss:
      losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0,
  };
}

// ============================================================
// 5. Long vs Short Analysis
//    ⭐ Зөвхөн buy/sell (аль хэдийн зөв)
// ============================================================
export function getLongShortAnalysis(trades: Trade[]): LongShortStats[] {
  const realTrades = getRealTrades(trades);

  const longTrades = realTrades.filter(
    (t) => t.type?.toLowerCase() === "long" || t.type?.toLowerCase() === "buy",
  );
  const shortTrades = realTrades.filter(
    (t) =>
      t.type?.toLowerCase() === "short" || t.type?.toLowerCase() === "sell",
  );

  const calculateStats = (
    typeTrades: Trade[],
    typeName: "Long" | "Short",
  ): LongShortStats => {
    const wins = typeTrades.filter((t) => t.profit > 0);
    const losses = typeTrades.filter((t) => t.profit < 0);
    const totalProfit = typeTrades.reduce((sum, t) => sum + t.profit, 0);

    return {
      type: typeName,
      totalTrades: typeTrades.length,
      wins: wins.length,
      loss: losses.length,
      winRate:
        typeTrades.length === 0 ? 0 : (wins.length / typeTrades.length) * 100,
      totalProfit: totalProfit,
      avgProfit: typeTrades.length === 0 ? 0 : totalProfit / typeTrades.length,
    };
  };

  return [
    calculateStats(longTrades, "Long"),
    calculateStats(shortTrades, "Short"),
  ];
}

// ============================================================
// 6. PnL by Trade Duration
//    ⭐ Зөвхөн buy/sell
// ============================================================
export function getPnLByDuration(trades: Trade[]): DurationPnL[] {
  const realTrades = getRealTrades(trades);

  return realTrades
    .filter((t) => t.open_time && t.close_time)
    .map((trade) => {
      const durationMs =
        new Date(trade.close_time!).getTime() -
        new Date(trade.open_time!).getTime();
      const durationHours = durationMs / (1000 * 60 * 60);

      return {
        durationHours,
        profit: trade.profit,
        symbol: trade.symbol,
        isWin: trade.profit > 0,
      };
    })
    .filter((d) => d.durationHours > 0 && d.durationHours < 1000);
}

// ============================================================
// 7. Instrument Profit Analysis
//    ⭐ Зөвхөн buy/sell
// ============================================================
export function getInstrumentProfitAnalysis(
  trades: Trade[],
  limit: number = 15,
): InstrumentStats[] {
  const realTrades = getRealTrades(trades);

  const instrumentMap = new Map<string, InstrumentStats>();

  realTrades.forEach((trade) => {
    const symbol = trade.symbol;
    if (!symbol) return;

    if (!instrumentMap.has(symbol)) {
      instrumentMap.set(symbol, {
        symbol,
        totalProfit: 0,
        totalLoss: 0,
        netProfit: 0,
        tradeCount: 0,
        winCount: 0,
        lossCount: 0,
        winRate: 0,
        volume: 0,
      });
    }

    const stats = instrumentMap.get(symbol)!;
    stats.tradeCount++;
    if (trade.profit > 0) {
      stats.totalProfit += trade.profit;
      stats.winCount++;
    } else if (trade.profit < 0) {
      stats.totalLoss += trade.profit;
      stats.lossCount++;
    }
    stats.netProfit = stats.totalProfit + stats.totalLoss;
    stats.winRate = (stats.winCount / stats.tradeCount) * 100;
  });

  return Array.from(instrumentMap.values())
    .sort((a, b) => Math.abs(b.netProfit) - Math.abs(a.netProfit))
    .slice(0, limit);
}

// ============================================================
// 8. Instrument Volume Analysis
//    ⭐ Зөвхөн buy/sell
// ============================================================
export function getInstrumentVolumeAnalysis(
  trades: Trade[],
  limit: number = 10,
): InstrumentStats[] {
  const realTrades = getRealTrades(trades);

  const instrumentMap = new Map<string, InstrumentStats>();

  realTrades.forEach((trade) => {
    const symbol = trade.symbol;
    if (!symbol) return;

    if (!instrumentMap.has(symbol)) {
      instrumentMap.set(symbol, {
        symbol,
        totalProfit: 0,
        totalLoss: 0,
        netProfit: 0,
        tradeCount: 0,
        winCount: 0,
        lossCount: 0,
        winRate: 0,
        volume: 0,
      });
    }

    const stats = instrumentMap.get(symbol)!;
    stats.tradeCount++;
    stats.volume += trade.lot_size || 0;

    // Profit/Loss тооцоолол
    const profit = trade.profit || 0;
    if (profit > 0) {
      stats.totalProfit += profit;
      stats.winCount++;
    } else if (profit < 0) {
      stats.totalLoss += Math.abs(profit);
      stats.lossCount++;
    }

    stats.netProfit = stats.totalProfit - stats.totalLoss;
    stats.winRate =
      stats.tradeCount > 0 ? (stats.winCount / stats.tradeCount) * 100 : 0;
  });

  return Array.from(instrumentMap.values())
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit);
}
