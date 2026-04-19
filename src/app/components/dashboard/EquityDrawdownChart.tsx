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
};

export default function EquityDrawdownChart({ trades }: Props) {
  const data = buildEquityWithDrawdown(trades);

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Equity vs Drawdown</h2>

      <div style={{ width: "100%", height: 350 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="date"
              tickFormatter={(v) => new Date(v).toLocaleDateString()}
            />

            <YAxis />

            <Tooltip labelFormatter={(v) => new Date(v).toLocaleString()} />

            {/* Equity Curve */}
            <Line
              type="monotone"
              dataKey="equity"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
            />

            {/* Drawdown Curve */}
            <Line
              type="monotone"
              dataKey="drawdown"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
