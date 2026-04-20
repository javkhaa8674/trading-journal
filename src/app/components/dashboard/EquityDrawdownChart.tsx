"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Trade } from "@/types/trade";
import { buildEquityWithDrawdown } from "@/lib/equity";

type Props = {
  trades: Trade[];
  balance: number;
};

export default function EquityDrawdownChart({ trades, balance }: Props) {
  const data = buildEquityWithDrawdown(trades, balance);

  // Calculate min and max equity for better Y-axis scaling
  const minEquity = Math.min(...data.map((d) => d.equity), balance);
  const maxEquity = Math.max(...data.map((d) => d.equity), balance);
  const equityPadding = (maxEquity - minEquity) * 0.1;

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Equity vs Drawdown</h2>

      <div style={{ width: "100%", height: 350 }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            {/* X-Axis */}
            <XAxis
              dataKey="date"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(timestamp) =>
                new Date(timestamp).toLocaleDateString()
              }
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />

            {/* Left Y-Axis (Equity) */}
            <YAxis
              yAxisId="left"
              domain={[minEquity - equityPadding, maxEquity + equityPadding]}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
              width={80}
              label={{
                value: "Equity ($)",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle" },
              }}
            />

            {/* Right Y-Axis (Drawdown) */}
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[-50, 5]}
              tickFormatter={(value) => `${value}%`}
              width={60}
              label={{
                value: "Drawdown (%)",
                angle: 90,
                position: "insideRight",
                style: { textAnchor: "middle" },
              }}
            />

            <Tooltip
              labelFormatter={(timestamp) =>
                new Date(timestamp).toLocaleDateString()
              }
              formatter={(value: any, name: string) => {
                if (name === "drawdown") return [`${value}%`, "Drawdown"];
                if (name === "equity")
                  return [`$${value.toLocaleString()}`, "Equity"];
                return [value, name];
              }}
            />

            {/* Equity Curve */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="equity"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              name="equity"
            />

            {/* Drawdown Curve */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="drawdown"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="drawdown"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
