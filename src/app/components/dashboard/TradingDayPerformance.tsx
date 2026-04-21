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

interface TradingDayPerformanceProps {
  data: DailyPerformance[];
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
      <h3 className="mb-4 text-lg font-semibold">Trading Day Performance</h3>
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
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #ccc",
                borderRadius: "8px",
              }}
              formatter={(value: any, name: any) => {
                if (name === "Net Profit")
                  return [`$${Number(value).toFixed(2)}`, "Net Profit"];
                if (name === "Trade Count") return [value, "Trade Count"];
                return [value, name];
              }}
            />
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
