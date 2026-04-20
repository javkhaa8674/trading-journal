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

interface InstrumentProfitAnalysisProps {
  data: InstrumentStats[];
}

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
      <h3 className="mb-4 text-lg font-semibold">Instrument Profit Analysis</h3>
      <div className="h-[450px]">
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
              formatter={(value: any, name: string) => {
                if (name === "profit")
                  return [`$${Number(value).toFixed(2)}`, "Net Profit"];
                if (name === "winRate")
                  return [`${Number(value).toFixed(1)}%`, "Win Rate"];
                return [value, name];
              }}
            />
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
