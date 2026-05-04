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

function InstrumentCustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  const trades = payload[0]?.value || 0;

  // simple insight logic
  const level =
    trades > 50
      ? "🔥 High activity"
      : trades > 20
        ? "📊 Medium activity"
        : "⚪ Low activity";

  const risk = trades > 50 ? "⚠ Over-traded instrument" : "✅ Normal usage";

  return (
    <div
      className="
      bg-white dark:bg-gray-800
      border border-gray-200 dark:border-gray-700
      shadow-lg rounded-lg p-3 text-xs
      min-w-[170px]
    "
    >
      {/* Symbol */}
      <div className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
        📌 {label}
      </div>

      {/* Trades */}
      <div className="flex justify-between text-blue-500">
        <span>Trades:</span>
        <span>{trades}</span>
      </div>

      {/* Insight */}
      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-gray-500 space-y-1">
        <div>{level}</div>
        <div>{risk}</div>
      </div>
    </div>
  );
}

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
            <Tooltip content={<InstrumentCustomTooltip />} />
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
