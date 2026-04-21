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

interface LongShortAnalysisProps {
  data: LongShortStats[];
}

const COLORS = ["#10b981", "#ef4444"];

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
      <h3 className="mb-4 text-lg font-semibold">Long vs Short Analysis</h3>

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
                <Tooltip />
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
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                  }}
                  formatter={(value: any, name: any) => {
                    if (name === "Total Profit")
                      return [`$${Number(value).toFixed(2)}`, "Total Profit"];
                    if (name === "Win Rate (%)")
                      return [`${Number(value).toFixed(1)}%`, "Win Rate"];
                    return [value, name];
                  }}
                />
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
            className={`rounded-lg border p-3 ${item.type === "Long" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"} dark:bg-opacity-10`}
          >
            <div className="mb-2 text-lg font-semibold">{item.type}</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-gray-600">Total Trades</div>
                <div className="font-mono font-medium">{item.totalTrades}</div>
              </div>
              <div>
                <div className="text-gray-600">Win Rate</div>
                <div
                  className={`font-mono font-medium ${item.winRate >= 50 ? "text-green-600" : "text-red-600"}`}
                >
                  {item.winRate.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-gray-600">Wins / Losses</div>
                <div className="font-mono font-medium">
                  {item.wins} / {item.loss}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Avg Profit/Trade</div>
                <div
                  className={`font-mono font-medium ${item.avgProfit >= 0 ? "text-green-600" : "text-red-600"}`}
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
