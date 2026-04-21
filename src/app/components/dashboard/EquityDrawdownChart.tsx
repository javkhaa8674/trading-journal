"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Trade } from "@/types/trade";
import { buildEquityWithDrawdown } from "@/lib/equity";

type Props = {
  trades: Trade[];
  balance: number;
};

export default function EquityDrawdownChart({ trades, balance }: Props) {
  // Data бэлтгэх (мемоization)
  const data = useMemo(() => {
    const rawData = buildEquityWithDrawdown(trades, balance);

    // Огноогоор эрэмбэлэх (хамгаалалт)
    return [...rawData].sort((a, b) => a.date - b.date);
  }, [trades, balance]);

  // Хоосон үед
  if (!data || data.length === 0) {
    return (
      <div className="p-4 border rounded-lg">
        <p className="text-gray-500">No trading data available</p>
      </div>
    );
  }

  // Equity хязгаарыг тооцоолох
  const equities = data.map((d) => d.equity);
  const minEquity = Math.min(...equities, balance);
  const maxEquity = Math.max(...equities, balance);
  const equityPadding = (maxEquity - minEquity) * 0.1;

  // Drawdown хязгаарыг тооцоолох (динамик)
  const drawdowns = data.map((d) => d.drawdown);
  const minDrawdown = Math.min(...drawdowns, -5);
  const maxDrawdown = Math.max(...drawdowns, 5);
  const drawdownPadding = Math.abs(minDrawdown) * 0.1;

  const yAxisDrawdownMin = Math.floor(minDrawdown - drawdownPadding);
  const yAxisDrawdownMax = Math.ceil(maxDrawdown + drawdownPadding);

  // Max drawdown олох
  const maxDrawdownValue = Math.min(...drawdowns);

  // Format огноо
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-900">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Equity vs Drawdown</h2>
        <div className="text-sm text-gray-500 space-x-3">
          <span className="text-green-600">
            📈 Current: ${data[data.length - 1]?.equity.toLocaleString()}
          </span>
          <span className="text-red-600">
            📉 Max DD: {maxDrawdownValue.toFixed(2)}%
          </span>
        </div>
      </div>

      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 10, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

            {/* X-Axis */}
            <XAxis
              dataKey="date"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={formatDate}
              tick={{ fontSize: 11 }}
              tickMargin={10}
              height={50}
            />

            {/* Left Y-Axis (Equity) */}
            <YAxis
              yAxisId="left"
              domain={[minEquity - equityPadding, maxEquity + equityPadding]}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              width={55}
              label={{
                value: "Equity",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fontSize: 12, fill: "#22c55e" },
              }}
            />

            {/* Right Y-Axis (Drawdown) */}
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[yAxisDrawdownMin, yAxisDrawdownMax]}
              tickFormatter={(value) => `${value}%`}
              width={50}
              label={{
                value: "Drawdown",
                angle: 90,
                position: "insideRight",
                style: { textAnchor: "middle", fontSize: 12, fill: "#ef4444" },
              }}
            />

            <Tooltip
              labelFormatter={(timestamp) =>
                new Date(timestamp).toLocaleString()
              }
              formatter={(value: any, name: any) => {
                if (name === "drawdown")
                  return [`${value.toFixed(2)}%`, "Drawdown"];
                if (name === "equity")
                  return [`$${value.toLocaleString()}`, "Equity"];
                return [value, name];
              }}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #ccc",
                borderRadius: "8px",
              }}
            />

            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => {
                if (value === "equity") return "Equity Curve";
                if (value === "drawdown") return "Drawdown";
                return value;
              }}
            />

            {/* Equity Curve - Green */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="equity"
              stroke="#22c55e"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: "#22c55e" }}
              name="equity"
            />

            {/* Drawdown Curve - Red */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="drawdown"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#ef4444" }}
              name="drawdown"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Дүн шинжилгээ */}
      <div className="mt-3 text-xs text-gray-400 flex justify-between">
        <span>Start: ${data[0]?.equity.toLocaleString()}</span>
        <span>Current: ${data[data.length - 1]?.equity.toLocaleString()}</span>
        <span>
          Change: $
          {(data[data.length - 1]?.equity - data[0]?.equity).toLocaleString()}
        </span>
        <span className="text-red-500">
          Max DD: {maxDrawdownValue.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}
