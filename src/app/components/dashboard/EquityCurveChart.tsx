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

type Props = {
  data: {
    date: string;
    equity: number;
  }[];
};

export default function EquityCurveChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="p-4 border rounded-lg">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Equity Curve</h2>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="index"
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />

            <YAxis />

            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleString()}
            />

            <Line
              type="monotone"
              dataKey="equity"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
