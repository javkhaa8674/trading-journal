"use client";

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
} from "@/lib/analytics";

import { buildEquityCurve } from "@/lib/equity";

type Props = {
  trades: Trade[];
};

function Card({
  title,
  value,
  color = "text-black",
  sub,
}: {
  title: string;
  value: any;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className={`text-2xl font-bold ${color}`}>{value}</h2>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardStats({ trades }: Props) {
  const winRate = calculateWinRate(trades);
  const profitFactor = calculateProfitFactor(trades);
  const netProfit = calculateNetProfit(trades);

  const avgWin = calculateAvgWin(trades);
  const avgLoss = calculateAvgLoss(trades);

  const expectancy = calculateExpectancy(trades);
  const avgPositionSize = calculateAvgPositionSize(trades);
  const avgHoldingTime = calculateAvgHoldingTime(trades);

  const rrr = calculateRRR(trades);

  const equity = buildEquityCurve(trades);

  const { maxDrawdown, duration } = calculateMaxDrawdownWithDuration(
    equity.map((e) => e.equity),
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* CORE PERFORMANCE */}
      <Card title="Win Rate" value={`${winRate.toFixed(2)}%`} />

      <Card
        title="Net Profit"
        value={netProfit.toFixed(2)}
        color={netProfit >= 0 ? "text-green-500" : "text-red-500"}
      />

      <Card title="Profit Factor" value={profitFactor.toFixed(2)} />

      <Card title="Expectancy" value={expectancy.toFixed(4)} />

      {/* TRADE STATS */}
      <Card title="Avg Win" value={avgWin.toFixed(2)} />
      <Card title="Avg Loss" value={avgLoss.toFixed(2)} />

      <Card title="Avg Position Size" value={avgPositionSize} />

      <Card
        title="Avg Holding Time"
        value={`${avgHoldingTime.toFixed(2)} min`}
      />

      {/* RRR */}
      <Card title="RRR Overall" value={rrr.overall.toFixed(2)} />
      <Card title="RRR Win" value={rrr.win.toFixed(2)} />
      <Card title="RRR Loss" value={rrr.loss.toFixed(2)} />

      {/* RISK */}
      <Card
        title="Max Drawdown"
        value={`${maxDrawdown}%`}
        color="text-red-500"
        sub={`Duration: ${duration} trades`}
      />
    </div>
  );
}
