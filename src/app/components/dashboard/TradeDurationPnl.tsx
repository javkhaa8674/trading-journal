"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Legend,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { DurationPnL } from "@/lib/advancedAnalytics";

interface TradeDurationPnLProps {
  data: DurationPnL[];
}

type Bucket = {
  range: string;
  min: number;
  max: number;
  wins: DurationPnL[];
  losses: DurationPnL[];
  totalProfit: number;
  totalTrades: number;
};

export function TradeDurationPnL({ data }: TradeDurationPnLProps) {
  // Split data into wins and losses for different colors
  const winData = data
    .filter((item) => item.profit > 0)
    .map((item) => ({
      duration: item.durationHours,
      profit: item.profit,
      size: Math.min(Math.abs(item.profit) / 50, 500),
      symbol: item.symbol,
    }));

  const lossData = data
    .filter((item) => item.profit < 0)
    .map((item) => ({
      duration: item.durationHours,
      profit: item.profit,
      size: Math.min(Math.abs(item.profit) / 50, 500),
      symbol: item.symbol,
    }));

  const breakEvenData = data
    .filter((item) => item.profit === 0)
    .map((item) => ({
      duration: item.durationHours,
      profit: item.profit,
      size: Math.min(Math.abs(item.profit) / 50, 500),
      symbol: item.symbol,
    }));

  // ✅ Explicitly type the buckets array
  const buckets: Bucket[] = [
    {
      range: "0-1h",
      min: 0,
      max: 1,
      wins: [],
      losses: [],
      totalProfit: 0,
      totalTrades: 0,
    },
    {
      range: "1-4h",
      min: 1,
      max: 4,
      wins: [],
      losses: [],
      totalProfit: 0,
      totalTrades: 0,
    },
    {
      range: "4-24h",
      min: 4,
      max: 24,
      wins: [],
      losses: [],
      totalProfit: 0,
      totalTrades: 0,
    },
    {
      range: "1-7d",
      min: 24,
      max: 168,
      wins: [],
      losses: [],
      totalProfit: 0,
      totalTrades: 0,
    },
    {
      range: "7d+",
      min: 168,
      max: Infinity,
      wins: [],
      losses: [],
      totalProfit: 0,
      totalTrades: 0,
    },
  ];

  data.forEach((item) => {
    const bucket = buckets.find(
      (b) => item.durationHours >= b.min && item.durationHours < b.max,
    );
    if (bucket) {
      bucket.totalTrades++;
      bucket.totalProfit += item.profit;
      if (item.profit > 0) {
        bucket.wins.push(item);
      } else if (item.profit < 0) {
        bucket.losses.push(item);
      }
    }
  });

  const barData = buckets.map((bucket) => ({
    range: bucket.range,
    avgProfit:
      bucket.totalTrades > 0 ? bucket.totalProfit / bucket.totalTrades : 0,
    tradeCount: bucket.totalTrades,
    winCount: bucket.wins.length,
    lossCount: bucket.losses.length,
    winRate:
      bucket.totalTrades > 0
        ? (bucket.wins.length / bucket.totalTrades) * 100
        : 0,
    totalProfit: bucket.totalProfit,
  }));

  // Calculate summary statistics
  const totalWins = winData.length;
  const totalLosses = lossData.length;
  const totalTrades = data.length;
  const avgWinDuration =
    winData.reduce((sum, w) => sum + w.duration, 0) / (totalWins || 1);
  const avgLossDuration =
    lossData.reduce((sum, l) => sum + l.duration, 0) / (totalLosses || 1);
  const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;

  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold">
          PnL Distribution by Duration
        </h3>
        <div className="flex h-[400px] items-center justify-center text-gray-500">
          No duration data available (missing open/close times)
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
      <h3 className="mb-4 text-lg font-semibold">
        PnL Distribution by Duration
      </h3>

      {/* Summary Stats Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg bg-green-50 p-3 text-center dark:bg-green-950/20">
          <div className="text-xs text-gray-500">Total Wins</div>
          <div className="text-xl font-bold text-green-600">{totalWins}</div>
          <div className="text-xs text-gray-500">
            Avg Duration: {avgWinDuration.toFixed(1)}h
          </div>
        </div>
        <div className="rounded-lg bg-red-50 p-3 text-center dark:bg-red-950/20">
          <div className="text-xs text-gray-500">Total Losses</div>
          <div className="text-xl font-bold text-red-600">{totalLosses}</div>
          <div className="text-xs text-gray-500">
            Avg Duration: {avgLossDuration.toFixed(1)}h
          </div>
        </div>
        <div className="rounded-lg bg-blue-50 p-3 text-center dark:bg-blue-950/20">
          <div className="text-xs text-gray-500">Win Rate</div>
          <div className="text-xl font-bold text-blue-600">
            {winRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">
            {totalWins} / {totalTrades} trades
          </div>
        </div>
        <div className="rounded-lg bg-purple-50 p-3 text-center dark:bg-purple-950/20">
          <div className="text-xs text-gray-500">Best/Worst Duration</div>
          <div className="text-sm font-medium">
            <span className="text-green-600">
              {winData.length > 0
                ? winData
                    .reduce(
                      (min, w) => (w.duration < min ? w.duration : min),
                      Infinity,
                    )
                    .toFixed(1)
                : "0"}
              h
            </span>
            <span className="text-gray-400"> / </span>
            <span className="text-red-600">
              {lossData.length > 0
                ? lossData
                    .reduce(
                      (max, l) => (l.duration > max ? l.duration : max),
                      0,
                    )
                    .toFixed(1)
                : "0"}
              h
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Scatter Plot */}
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-600">
            Individual Trades (Green = Win, Red = Loss)
          </h4>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  dataKey="duration"
                  name="Duration"
                  label={{
                    value: "Duration (Hours)",
                    position: "bottom",
                    fontSize: 12,
                  }}
                  domain={[0, "dataMax"]}
                />
                <YAxis
                  type="number"
                  dataKey="profit"
                  name="Profit"
                  label={{
                    value: "Profit ($)",
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 12,
                  }}
                />
                <ZAxis
                  type="number"
                  dataKey="size"
                  range={[50, 400]}
                  name="Trade Size"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                  }}
                  formatter={(value: any, name: any, props: any) => {
                    if (name === "Duration")
                      return [`${Number(value).toFixed(1)} hours`, "Duration"];
                    if (name === "Profit")
                      return [`$${Number(value).toFixed(2)}`, "Profit"];
                    if (name === "Symbol") return [value, "Symbol"];
                    return [value, name];
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0] && payload[0].payload) {
                      return `Symbol: ${payload[0].payload.symbol}`;
                    }
                    return "";
                  }}
                />
                <Legend />
                <Scatter
                  name="Winning Trades"
                  data={winData}
                  fill="#10b981"
                  shape="circle"
                />
                <Scatter
                  name="Losing Trades"
                  data={lossData}
                  fill="#ef4444"
                  shape="circle"
                />
                {breakEvenData.length > 0 && (
                  <Scatter
                    name="Breakeven Trades"
                    data={breakEvenData}
                    fill="#6b7280"
                    shape="circle"
                  />
                )}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center text-xs text-gray-500">
            ● Green: Winning trades | ● Red: Losing trades | Circle size =
            Profit magnitude
          </div>
        </div>

        {/* Bar Chart */}
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-600">
            Win/Loss Distribution by Duration
          </h4>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="range" fontSize={12} />
                <YAxis
                  yAxisId="left"
                  label={{
                    value: "Number of Trades",
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 12,
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  label={{
                    value: "Avg Profit ($)",
                    angle: 90,
                    position: "insideRight",
                    fontSize: 12,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                  }}
                  formatter={(value: any, name: any) => {
                    if (name === "Winning Trades")
                      return [value, "Winning Trades"];
                    if (name === "Losing Trades")
                      return [value, "Losing Trades"];
                    if (name === "Avg Profit")
                      return [`$${Number(value).toFixed(2)}`, "Avg Profit"];
                    if (name === "Win Rate")
                      return [`${Number(value).toFixed(1)}%`, "Win Rate"];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="winCount"
                  stackId="a"
                  fill="#10b981"
                  name="Winning Trades"
                />
                <Bar
                  yAxisId="left"
                  dataKey="lossCount"
                  stackId="a"
                  fill="#ef4444"
                  name="Losing Trades"
                />
                <Bar
                  yAxisId="right"
                  dataKey="avgProfit"
                  fill="#8b5cf6"
                  name="Avg Profit"
                  opacity={0.7}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="mt-4">
        <h4 className="mb-2 text-sm font-medium text-gray-600">
          Detailed Breakdown by Duration
        </h4>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left">Duration</th>
                <th className="px-3 py-2 text-right">Trades</th>
                <th className="px-3 py-2 text-right">Wins</th>
                <th className="px-3 py-2 text-right">Losses</th>
                <th className="px-3 py-2 text-right">Win Rate</th>
                <th className="px-3 py-2 text-right">Total PnL</th>
                <th className="px-3 py-2 text-right">Avg PnL</th>
              </tr>
            </thead>
            <tbody>
              {barData.map((bucket) => (
                <tr key={bucket.range} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{bucket.range}</td>
                  <td className="px-3 py-2 text-right">{bucket.tradeCount}</td>
                  <td className="px-3 py-2 text-right text-green-600">
                    {bucket.winCount}
                  </td>
                  <td className="px-3 py-2 text-right text-red-600">
                    {bucket.lossCount}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    <span
                      className={
                        bucket.winRate >= 50
                          ? "text-green-600"
                          : bucket.winRate > 0
                            ? "text-yellow-600"
                            : "text-red-600"
                      }
                    >
                      {bucket.winRate.toFixed(1)}%
                    </span>
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-medium ${
                      bucket.totalProfit >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    ${bucket.totalProfit.toFixed(2)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right ${
                      bucket.avgProfit >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ${bucket.avgProfit.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
