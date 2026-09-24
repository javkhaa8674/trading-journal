import { Trade } from "@/types/trade";

import { buildEquityCurve, buildRollingEquity } from "./equity";

export function buildDashboardData(trades: Trade[], balance: number = 5000) {
  const safeTrades = Array.isArray(trades) ? trades : [];

  const rawEquity = buildEquityCurve(safeTrades, balance);

  const sortedEquity = [...rawEquity].sort((a, b) => a.date - b.date);

  const equityValues = sortedEquity.map((e) => e.equity);
  const smoothEquity = buildRollingEquity(equityValues, 7);

  const chartData = sortedEquity.map((item, i) => ({
    index: i + 1,
    date: new Date(item.date).toISOString(),
    equity: item.equity,
    drawdown: item.drawdown,
    smoothEquity: smoothEquity[i] ?? item.equity,
  }));

  return { chartData };
}
