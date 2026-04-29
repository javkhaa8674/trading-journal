"use client";

import { useMemo } from "react";
import { Trade } from "@/types/trade";
import {
  calculateWinRate,
  calculateProfitFactor,
  calculateNetProfit,
  calculateAvgWin,
  calculateAvgLoss,
  calculateExpectancy,
  calculateAvgPositionSize,
  calculateAvgHoldingTime,
  calculateRRR,
  calculateMaxDrawdownWithDuration,
  calculateTradeCount,
  calculateLossRate,
  calculateAvgDrawdown,
} from "@/lib/analytics";
import SpiderWebChart from "@/app/components/dashboard/SpiderWebChart";
import { MetricCard } from "@/app/components/dashboard/MetricCard";
import { buildEquityCurve } from "@/lib/equity";

type Props = {
  trades: Trade[];
  balance: number;
};

function Card({
  title,
  value,
  color = "text-black",
  sub,
}: {
  title: string;
  value: number | string;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-900 dark:border-gray-800">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <h2
        className={`text-2xl font-bold ${color} dark:${color.replace("text-", "dark:text-")}`}
      >
        {value}
      </h2>
      {sub && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{sub}</p>
      )}
    </div>
  );
}

export default function DashboardStats({ trades, balance }: Props) {
  // Calculate all metrics once
  const metrics = useMemo(() => {
    const winRate = calculateWinRate(trades);
    const lossRate = calculateLossRate(trades);
    const tradeCount = calculateTradeCount(trades);
    const profitFactor = calculateProfitFactor(trades);
    const netProfit = calculateNetProfit(trades);
    const avgWin = calculateAvgWin(trades);
    const avgLoss = calculateAvgLoss(trades);
    const expectancy = calculateExpectancy(trades);
    const avgPositionSize = calculateAvgPositionSize(trades);
    const avgHoldingTime = calculateAvgHoldingTime(trades);
    const rrr = calculateRRR(trades);
    const equity = buildEquityCurve(trades, balance);
    const { maxDrawdown, duration } = calculateMaxDrawdownWithDuration(
      equity.map((e) => e.equity),
    );
    const avgDrawdown = calculateAvgDrawdown(equity.map((e) => e.equity));

    // Calculate additional metrics for SpiderWebChart
    const riskReward = rrr.overall;

    // Sharpe Ratio (simplified)
    const returns = trades.map((t) => t.profit / balance);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns
        .map((r) => Math.pow(r - avgReturn, 2))
        .reduce((a, b) => a + b, 0) / returns.length,
    );
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

    // Calmar Ratio
    let peak = balance;
    let maxDrawdownPercent = 0;
    let runningEquity = balance;
    const sortedTrades = [...trades].sort((a, b) => {
      const timeA = a.close_time
        ? new Date(a.close_time).getTime()
        : new Date(a.open_time).getTime();
      const timeB = b.close_time
        ? new Date(b.close_time).getTime()
        : new Date(b.open_time).getTime();
      return timeA - timeB;
    });
    sortedTrades.forEach((trade) => {
      runningEquity += trade.profit;
      if (runningEquity > peak) peak = runningEquity;
      const drawdownPercent = ((peak - runningEquity) / peak) * 100;
      if (drawdownPercent > maxDrawdownPercent)
        maxDrawdownPercent = drawdownPercent;
    });
    const totalReturnPercent = ((runningEquity - balance) / balance) * 100;
    const calmarRatio =
      maxDrawdownPercent > 0 ? totalReturnPercent / maxDrawdownPercent : 0;

    // Consistency (rolling win rate stability)
    let consistency = 50;
    if (trades.length >= 10) {
      const windowSize = Math.min(
        20,
        Math.max(5, Math.floor(trades.length / 3)),
      );
      const rollingWR: number[] = [];
      for (let i = windowSize; i <= trades.length; i++) {
        const windowTrades = trades.slice(i - windowSize, i);
        const wins = windowTrades.filter((t) => t.profit > 0).length;
        rollingWR.push((wins / windowSize) * 100);
      }
      if (rollingWR.length > 0) {
        const avgWR = rollingWR.reduce((a, b) => a + b, 0) / rollingWR.length;
        const variance =
          rollingWR
            .map((wr) => Math.pow(wr - avgWR, 2))
            .reduce((a, b) => a + b, 0) / rollingWR.length;
        const wrStdDev = Math.sqrt(variance);
        consistency = Math.max(0, Math.min(100, 100 - wrStdDev * 1.5));
      }
    }

    // Avg Win/Loss Ratio
    const avgWinLoss =
      Math.abs(avgLoss) > 0 ? avgWin / Math.abs(avgLoss) : avgWin;

    return {
      winRate,
      lossRate,
      tradeCount,
      profitFactor,
      netProfit,
      avgWin,
      avgLoss,
      expectancy,
      avgPositionSize,
      avgHoldingTime,
      rrr,
      maxDrawdown,
      drawdownDuration: duration,
      avgDrawdown,
      spiderMetrics: {
        winRate,
        profitFactor,
        riskReward,
        sharpeRatio,
        calmarRatio,
        consistency,
        avgWinLoss,
        expectancy,
      },
    };
  }, [trades, balance]);

  return (
    <div>
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard
          title="Total Trades"
          value={metrics.tradeCount}
          metricKey="totalTrades"
        />
        <MetricCard
          title="Win Rate"
          value={`${metrics.winRate.toFixed(2)}%`}
          metricKey="winRate"
        />
        <MetricCard
          title="Loss Rate"
          value={`${metrics.lossRate.toFixed(2)}%`}
          metricKey="lossRate"
        />
        <MetricCard
          title="Net Profit"
          value={metrics.netProfit.toFixed(2)}
          color={metrics.netProfit >= 0 ? "text-green-500" : "text-red-500"}
          metricKey="netProfit"
        />
        <MetricCard
          title="Profit Factor"
          value={metrics.profitFactor.toFixed(2)}
          metricKey="profitFactor"
        />
        <MetricCard
          title="Avg Drawdown"
          value={`${metrics.avgDrawdown.toFixed(2)}%`}
          color="text-red-400"
          metricKey="avgDrawdown"
        />
        <MetricCard
          title="Max Drawdown"
          value={`${metrics.maxDrawdown}%`}
          color="text-red-500"
          metricKey="maxDrawdown"
          sub={`Duration: ${metrics.drawdownDuration} trades`}
        />
        <MetricCard
          title="Expectancy"
          value={metrics.expectancy.toFixed(4)}
          metricKey="expectancy"
        />
        <MetricCard
          title="Avg Win"
          value={metrics.avgWin.toFixed(2)}
          metricKey="avgWin"
        />
        <MetricCard
          title="Avg Loss"
          value={metrics.avgLoss.toFixed(2)}
          metricKey="avgLoss"
        />
        <MetricCard
          title="Avg Position Size"
          value={metrics.avgPositionSize.toFixed(2)}
          metricKey="avgPositionSize"
        />
        <MetricCard
          title="Avg Holding Time"
          value={`${metrics.avgHoldingTime.toFixed(2)} min`}
          metricKey="avgHoldingTime"
        />
        <MetricCard
          title="RRR Overall"
          value={metrics.rrr.overall.toFixed(2)}
          metricKey="rrrOverall"
        />
        <MetricCard
          title="RRR Win"
          value={metrics.rrr.win.toFixed(2)}
          metricKey="rrrWin"
        />
        <MetricCard
          title="RRR Loss"
          value={metrics.rrr.loss.toFixed(2)}
          metricKey="rrrLoss"
        />
      </div>

      {/* Spider Web Chart - receives pre-calculated metrics */}
      <div className="mt-6">
        <SpiderWebChart
          tradesLength={metrics.tradeCount}
          metrics={metrics.spiderMetrics}
          riskPerTrade={1}
        />
      </div>
    </div>
  );
}
