"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Legend,
} from "recharts";
import { DailyPerformance } from "@/lib/advancedAnalytics";
import { metricsHelp } from "@/lib/constants/metricsHelp";
import { HelpTooltip } from "./HelpTooltip";

interface TradingDayPerformanceProps {
  data: DailyPerformance[];
}

function TradingDayCustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  const netProfit = payload.find((p: any) => p.dataKey === "netProfit")?.value;
  const tradeCount = payload.find(
    (p: any) => p.dataKey === "tradeCount",
  )?.value;

  const profit = Number(netProfit || 0);
  const trades = Number(tradeCount || 0);

  const isProfit = profit > 0;
  const isActiveDay = trades > 0;

  return (
    <div
      className="
      bg-white dark:bg-gray-800
      border border-gray-200 dark:border-gray-700
      shadow-lg rounded-lg p-3 text-xs
      min-w-[170px]
    "
    >
      {/* Date */}
      <div className="text-gray-500 dark:text-gray-300 mb-2">📅 {label}</div>

      {/* Net Profit */}
      <div
        className={`flex justify-between ${isProfit ? "text-green-500" : "text-red-500"}`}
      >
        <span>Net Profit:</span>
        <span>${profit.toFixed(2)}</span>
      </div>

      {/* Trade Count */}
      <div className="flex justify-between text-blue-500 mt-1">
        <span>Trades:</span>
        <span>{trades}</span>
      </div>

      {/* Insight */}
      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-gray-500">
        {!isActiveDay && <div>⚪ No trades</div>}

        {isActiveDay && isProfit && (
          <div className="text-green-500">🔥 Profitable day</div>
        )}

        {isActiveDay && !isProfit && (
          <div className="text-red-500">⚠ Losing day</div>
        )}
      </div>
    </div>
  );
}

export function TradingDayPerformance({ data }: TradingDayPerformanceProps) {
  const chartData = data.map((day) => ({
    date: new Date(day.date).toLocaleDateString(),
    netProfit: day.netProfit,
    tradeCount: day.tradeCount,
  }));

  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold">Trading Day Performance</h3>
        <div className="flex h-[400px] items-center justify-center text-gray-500">
          No trading data available
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
      <div className="mb-4 flex flex-start justify-start gap-2">
        <h3 className="mb-4 text-lg font-semibold">Trading Day Performance </h3>
        <HelpTooltip
          title={metricsHelp.tradingDayPerformance.title}
          description={metricsHelp.tradingDayPerformance.description}
        />
      </div>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
              fontSize={12}
            />
            <YAxis
              yAxisId="left"
              label={{
                value: "Net Profit ($)",
                angle: -90,
                position: "insideLeft",
                fontSize: 12,
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{
                value: "Trade Count",
                angle: 90,
                position: "insideRight",
                fontSize: 12,
              }}
            />
            <Tooltip content={<TradingDayCustomTooltip />} />
            <Legend />
            <Bar
              yAxisId="right"
              dataKey="tradeCount"
              fill="#8884d8"
              opacity={0.5}
              name="Trade Count"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="netProfit"
              stroke="#82ca9d"
              name="Net Profit"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
