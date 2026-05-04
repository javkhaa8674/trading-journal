"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { LongShortStats } from "@/lib/advancedAnalytics";
import { metricsHelp } from "@/lib/constants/metricsHelp";
import { HelpTooltip } from "./HelpTooltip";

interface LongShortAnalysisProps {
  data: LongShortStats[];
}

const COLORS = ["#10b981", "#ef4444"];

function LongShortPieTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;
  const type = data?.name;
  const value = data?.value;
  const winRate = data?.winRate;

  const efficiency =
    winRate >= 55
      ? "🔥 Strong side"
      : winRate >= 45
        ? "📊 Balanced"
        : "⚠ Weak performance";

  return (
    <div
      className="
      bg-white dark:bg-gray-800
      border border-gray-200 dark:border-gray-700
      shadow-lg rounded-lg p-3 text-xs
      min-w-[180px]
    "
    >
      {/* Type */}
      <div className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
        {type}
      </div>

      {/* Trades */}
      <div className="flex justify-between text-blue-500">
        <span>Trades:</span>
        <span>{value}</span>
      </div>

      {/* Win Rate */}
      <div className="flex justify-between text-green-500 mt-1">
        <span>Win Rate:</span>
        <span>{Number(winRate).toFixed(1)}%</span>
      </div>

      {/* Insight */}
      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-gray-500">
        {efficiency}
      </div>
    </div>
  );
}

function LongShortBarTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  const profit = payload.find((p: any) => p.dataKey === "totalProfit")?.value;
  const winRate = payload.find((p: any) => p.dataKey === "winRate")?.value;

  const isProfit = Number(profit) >= 0;

  const insight =
    Number(winRate) > 55 && isProfit
      ? "🔥 High-quality setup"
      : Number(winRate) < 45
        ? "⚠ Low efficiency"
        : "📊 Neutral performance";

  return (
    <div
      className="
      bg-white dark:bg-gray-800
      border border-gray-200 dark:border-gray-700
      shadow-lg rounded-lg p-3 text-xs
      min-w-[190px]
    "
    >
      {/* Type */}
      <div className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
        {label}
      </div>

      {/* Profit */}
      <div
        className={`flex justify-between ${isProfit ? "text-green-500" : "text-red-500"}`}
      >
        <span>Profit:</span>
        <span>${Number(profit).toFixed(2)}</span>
      </div>

      {/* Win Rate */}
      <div className="flex justify-between text-blue-500 mt-1">
        <span>Win Rate:</span>
        <span>{Number(winRate).toFixed(1)}%</span>
      </div>

      {/* Insight */}
      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-gray-500">
        {insight}
      </div>
    </div>
  );
}

export function LongShortAnalysis({ data }: LongShortAnalysisProps) {
  const pieData = data.map((item) => ({
    name: item.type,
    value: item.totalTrades,
    winRate: item.winRate,
  }));

  const hasData = data.some((d) => d.totalTrades > 0);

  if (!hasData) {
    return (
      <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold">Long vs Short Analysis</h3>
        <div className="flex h-[400px] items-center justify-center text-gray-500">
          No long/short data available
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
      <div className="mb-4 flex items-start justify-start gap-2">
        <h3 className="mb-4 text-lg font-semibold">Long vs Short Analysis</h3>
        <HelpTooltip
          title={metricsHelp.longShortAnalysis.title}
          description={metricsHelp.longShortAnalysis.description}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pie Chart */}
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-600">
            Trade Distribution
          </h4>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart
                style={{
                  fontSize: "10px",
                }}
              >
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) =>
                    `${entry.name}: ${entry.value} (${entry.winRate.toFixed(1)}% WR)`
                  }
                  outerRadius={90}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<LongShortPieTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-600">
            Performance Comparison
          </h4>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="type" />
                <YAxis
                  yAxisId="left"
                  label={{
                    value: "Total Profit ($)",
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 12,
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  label={{
                    value: "Win Rate (%)",
                    angle: 90,
                    position: "insideRight",
                    fontSize: 12,
                  }}
                />
                <Tooltip content={<LongShortBarTooltip />} />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="totalProfit"
                  fill="#3b82f6"
                  name="Total Profit"
                />
                <Bar
                  yAxisId="right"
                  dataKey="winRate"
                  fill="#10b981"
                  name="Win Rate (%)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        {data.map((item) => (
          <div
            key={item.type}
            className={`rounded-lg border p-3 ${
              item.type === "Long"
                ? "border-green-200 bg-green-50 dark:border-green-800/50 dark:bg-green-950/30"
                : "border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-950/30"
            }`}
          >
            <div className="mb-2 text-lg font-semibold dark:text-white">
              {item.type}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-gray-600 dark:text-gray-400">
                  Total Trades
                </div>
                <div className="font-mono font-medium dark:text-white">
                  {item.totalTrades}
                </div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">Win Rate</div>
                <div
                  className={`font-mono font-medium ${
                    item.winRate >= 50
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {item.winRate.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">
                  Wins / Losses
                </div>
                <div className="font-mono font-medium dark:text-white">
                  {item.wins} / {item.loss}
                </div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">
                  Avg Profit/Trade
                </div>
                <div
                  className={`font-mono font-medium ${
                    item.avgProfit >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  ${item.avgProfit.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
