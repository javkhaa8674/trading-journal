"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { InstrumentStats } from "@/lib/advancedAnalytics";
import { metricsHelp } from "@/lib/constants/metricsHelp";
import { HelpTooltip } from "./HelpTooltip";

interface InstrumentProfitAnalysisProps {
  data: InstrumentStats[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;

  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 p-3 shadow-md text-xs">
      {/* Symbol */}
      <div className="mb-2 font-semibold text-gray-800 dark:text-gray-100">
        {label}
      </div>

      {/* Profit */}
      <div className="flex justify-between gap-4">
        <span className="text-gray-500 dark:text-gray-400">Net Profit</span>
        <span
          className={
            data.profit >= 0
              ? "text-green-600 dark:text-green-400 font-medium"
              : "text-red-600 dark:text-red-400 font-medium"
          }
        >
          ${data.profit.toFixed(2)}
        </span>
      </div>

      {/* Win Rate */}
      <div className="flex justify-between gap-4 mt-1">
        <span className="text-gray-500 dark:text-gray-400">Win Rate</span>
        <span className="text-blue-600 dark:text-blue-400 font-medium">
          {data.winRate.toFixed(1)}%
        </span>
      </div>

      {/* Status */}
      <div className="mt-2 text-[10px] text-gray-400">
        {data.profit >= 0 ? "📈 Profitable instrument" : "📉 Losing instrument"}
      </div>
    </div>
  );
};

export function InstrumentProfitAnalysis({
  data,
}: InstrumentProfitAnalysisProps) {
  const sortedData = [...data].sort((a, b) => b.netProfit - a.netProfit);

  const chartData = sortedData.map((item) => ({
    name: item.symbol,
    profit: item.netProfit,
    winRate: item.winRate,
  }));

  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold">
          Instrument Profit Analysis
        </h3>
        <div className="flex h-[400px] items-center justify-center text-gray-500">
          No instrument data available
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
      <div className="mb-4 flex flex-start justify-start gap-2">
        <h3 className="mb-4 text-lg font-semibold">
          Instrument Profit Analysis
        </h3>
        <HelpTooltip
          title={metricsHelp.instrumentProfitAnalysis.title}
          description={metricsHelp.instrumentProfitAnalysis.description}
        />
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={80} fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={0} stroke="#666" />
            <Bar dataKey="profit" name="Net Profit">
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.profit >= 0 ? "#10b981" : "#ef4444"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-center text-sm text-gray-500">
        Green = Profitable | Red = Losing instruments
      </div>
    </div>
  );
}
