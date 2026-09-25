"use client";

import { Trade } from "@/types/trade";
import { getRealTrades } from "@/lib/utils/tradeFilters";
import {
  calculateTradeCount,
  calculateWinRate,
  calculateLossRate,
  calculateNetProfit,
  calculateProfitFactor,
  calculateAvgWin,
  calculateAvgLoss,
  calculateExpectancy,
  calculateAvgPositionSize,
  calculateAvgHoldingTime,
  calculateRRR,
  calculateMaxDrawdownWithDuration,
  calculateAvgDrawdown,
} from "@/lib/analytics";
import { buildEquityCurve } from "@/lib/equity";

type DashboardStatsProps = {
  trades: Trade[];
  balance?: number;
};

/**
 * Аюулгүй тоо
 */
const safeNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return fallback;
};

/**
 * Аюулгүй toFixed
 */
const safeFixed = (value: unknown, decimals = 2, fallback = "0.00"): string => {
  const num = safeNumber(value, NaN);
  if (!Number.isFinite(num)) return fallback;
  return num.toFixed(decimals);
};

/**
 * Хугацааг хүн уншиж болохоор форматлах
 */
const formatDuration = (minutes: number): string => {
  if (!Number.isFinite(minutes) || minutes <= 0) return "—";

  if (minutes < 60) return `${minutes.toFixed(0)}м`;

  const hours = minutes / 60;
  if (hours < 24) return `${hours.toFixed(1)}ц`;

  const days = hours / 24;
  return `${days.toFixed(1)}ө`;
};

export default function DashboardStats({
  trades,
  balance = 5000,
}: DashboardStatsProps) {
  // ⭐ Зөвхөн buy/sell
  const realTrades = getRealTrades(trades || []);

  // ============================================================
  // 📊 TRADE-BASED STATS
  // ============================================================

  const totalTrades = safeNumber(calculateTradeCount(realTrades));
  const winRate = safeNumber(calculateWinRate(realTrades));
  const lossRate = safeNumber(calculateLossRate(realTrades));
  const profitFactor = safeNumber(calculateProfitFactor(realTrades));
  const avgWin = safeNumber(calculateAvgWin(realTrades));
  const avgLoss = safeNumber(calculateAvgLoss(realTrades));
  const expectancy = safeNumber(calculateExpectancy(realTrades));
  const avgPositionSize = safeNumber(calculateAvgPositionSize(realTrades));
  const avgHoldingTime = safeNumber(calculateAvgHoldingTime(realTrades));

  // ============================================================
  // 📊 RRR
  // ============================================================

  const rrr = calculateRRR(realTrades, balance);
  const rrrOverall = safeNumber(rrr?.overall);
  const rrrAvgWin = safeNumber(rrr?.avgWin);
  const rrrAvgLoss = safeNumber(rrr?.avgLoss);

  // ============================================================
  // 📊 BALANCE-BASED STATS (бүх төрөл)
  // ============================================================

  // ⚠️ Net Profit — бүх төрөл (payout, violation, deposit ч орох ёстой)
  const netProfit = safeNumber(calculateNetProfit(trades || []));

  // Equity curve — бүх төрөл
  const equityCurve = buildEquityCurve(trades || [], balance);
  const equityValues = equityCurve.map((e) => e.equity);

  const { maxDrawdown } = calculateMaxDrawdownWithDuration(equityValues);
  const avgDrawdown = safeNumber(calculateAvgDrawdown(equityValues));

  // ============================================================
  // 🎨 RENDER
  // ============================================================

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {/* ============================== */}
      {/* 1. Total Trades */}
      {/* ============================== */}
      <StatCard
        label="Total Trades"
        value={totalTrades.toString()}
        tooltip="Нийт арилжааны тоо (buy + sell)"
      />

      {/* ============================== */}
      {/* 2. Win Rate */}
      {/* ============================== */}
      <StatCard
        label="Win Rate"
        value={`${safeFixed(winRate)}%`}
        color="green"
        tooltip="Ашигтай арилжааны хувь"
      />

      {/* ============================== */}
      {/* 3. Loss Rate */}
      {/* ============================== */}
      <StatCard
        label="Loss Rate"
        value={`${safeFixed(lossRate)}%`}
        color="red"
        tooltip="Алдагдалтай арилжааны хувь"
      />

      {/* ============================== */}
      {/* 4. Net Profit */}
      {/* ============================== */}
      <StatCard
        label="Net Profit"
        value={`$${safeFixed(netProfit)}`}
        color={netProfit >= 0 ? "green" : "red"}
        tooltip="Нийт P/L (арилжаа + payout + violation + deposit)"
      />

      {/* ============================== */}
      {/* 5. Profit Factor */}
      {/* ============================== */}
      <StatCard
        label="Profit Factor"
        value={safeFixed(profitFactor)}
        color={profitFactor >= 1 ? "green" : "red"}
        tooltip="Gross Profit / Gross Loss (>1 бол ашигтай)"
      />

      {/* ============================== */}
      {/* 6. Avg Drawdown */}
      {/* ============================== */}
      <StatCard
        label="Avg Drawdown"
        value={`${safeFixed(avgDrawdown)}%`}
        color="red"
        tooltip="Дундаж drawdown"
      />

      {/* ============================== */}
      {/* 7. Max Drawdown */}
      {/* ============================== */}
      <StatCard
        label="Max Drawdown"
        value={`${safeFixed(maxDrawdown)}%`}
        color="red"
        tooltip="Хамгийн их drawdown"
      />

      {/* ============================== */}
      {/* 8. Expectancy */}
      {/* ============================== */}
      <StatCard
        label="Expectancy"
        value={`$${safeFixed(expectancy)}`}
        color={expectancy >= 0 ? "green" : "red"}
        tooltip="Арилжаа бүрээс хүлээгдэж буй дундаж ашиг"
      />

      {/* ============================== */}
      {/* 9. Avg Win */}
      {/* ============================== */}
      <StatCard
        label="Avg Win"
        value={`$${safeFixed(avgWin)}`}
        color="green"
        tooltip="Ашигтай арилжааны дундаж"
      />

      {/* ============================== */}
      {/* 10. Avg Loss */}
      {/* ============================== */}
      <StatCard
        label="Avg Loss"
        value={`$${safeFixed(avgLoss)}`}
        color="red"
        tooltip="Алдагдалтай арилжааны дундаж"
      />

      {/* ============================== */}
      {/* 11. Avg Position Size */}
      {/* ============================== */}
      <StatCard
        label="Avg Position Size"
        value={safeFixed(avgPositionSize, 2)}
        tooltip="Дундаж лот хэмжээ"
      />

      {/* ============================== */}
      {/* 12. Avg Holding Time */}
      {/* ============================== */}
      <StatCard
        label="Avg Holding Time"
        value={formatDuration(avgHoldingTime)}
        tooltip="Дундаж барих хугацаа"
      />

      {/* ============================== */}
      {/* 13. RRR Avg Overall */}
      {/* ============================== */}
      <StatCard
        label="RRR Avg Overall"
        value={safeFixed(rrrOverall)}
        color={rrrOverall >= 0 ? "green" : "red"}
        tooltip="Бүх арилжааны дундаж RRR (profit / risk)"
      />

      {/* ============================== */}
      {/* 14. RRR AvgWin */}
      {/* ============================== */}
      <StatCard
        label="RRR AvgWin"
        value={safeFixed(rrrAvgWin)}
        color="green"
        tooltip="Ашигтай арилжааны дундаж RRR"
      />

      {/* ============================== */}
      {/* 15. RRR AvgLoss */}
      {/* ============================== */}
      <StatCard
        label="RRR AvgLoss"
        value={safeFixed(rrrAvgLoss)}
        color="red"
        tooltip="Алдагдалтай арилжааны дундаж RRR"
      />
    </div>
  );
}

// ─────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────

type StatCardProps = {
  label: string;
  value: string;
  color?: "green" | "red" | "default";
  tooltip?: string;
};

function StatCard({ label, value, color = "default", tooltip }: StatCardProps) {
  const colorClass =
    color === "green"
      ? "text-green-600 dark:text-green-400"
      : color === "red"
        ? "text-red-600 dark:text-red-400"
        : "text-gray-900 dark:text-white";

  return (
    <div
      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
      title={tooltip}
    >
      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
        {label}
      </div>
      <div className={`mt-1 text-lg font-semibold truncate ${colorClass}`}>
        {value}
      </div>
    </div>
  );
}
