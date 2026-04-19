"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Props = {
  data: {
    index: number;
    equity: number;
    smoothEquity: number;
  }[];
};

export default function EquityCurveChart({ data }: Props) {
  return (
    <div className="w-full h-[300px] bg-white p-4 rounded-xl shadow">
      <h2 className="text-sm text-gray-500 mb-2">Equity Curve</h2>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="index" />
          <YAxis />
          <Tooltip />

          {/* Raw Equity */}
          <Line
            type="monotone"
            dataKey="equity"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
          />

          {/* Smooth Equity */}
          <Line
            type="monotone"
            dataKey="smoothEquity"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
