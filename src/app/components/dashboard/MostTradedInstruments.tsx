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
} from "recharts";
import { InstrumentStats } from "@/lib/advancedAnalytics";
import { metricsHelp } from "@/lib/constants/metricsHelp";
import { HelpTooltip } from "./HelpTooltip";

interface MostTradedInstrumentsProps {
  data: InstrumentStats[];
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

export function MostTradedInstruments({ data }: MostTradedInstrumentsProps) {
  const chartData = data.map((item) => ({
    name: item.symbol,
    trades: item.tradeCount,
  }));

  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold">Most Traded Instruments</h3>
        <div className="flex h-[400px] items-center justify-center text-gray-500">
          No trading data available
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
      <div className="mb-4 flex items-start justify-start gap-2">
        <h3 className="mb-4 text-lg font-semibold">Most Traded Instruments</h3>
        <HelpTooltip
          title={metricsHelp.mostTradedPairs.title}
          description={metricsHelp.mostTradedPairs.description}
        />
      </div>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={80} fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #ccc",
                borderRadius: "8px",
              }}
              formatter={(value: any) => [value, "Trade Count"]}
            />
            <Bar dataKey="trades" fill="#3b82f6">
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
