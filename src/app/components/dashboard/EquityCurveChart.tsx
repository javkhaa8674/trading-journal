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
        <p className="text-gray-500">No equity data available</p>
      </div>
    );
  }

  // Calculate min and max equity for better Y-axis domain
  const equities = data.map((d) => d.equity);
  const minEquity = Math.min(...equities);
  const maxEquity = Math.max(...equities);

  // Add padding (5% margin from min and max)
  const padding = (maxEquity - minEquity) * 0.05;
  let yAxisMin = Math.floor(minEquity - padding);
  let yAxisMax = Math.ceil(maxEquity + padding);

  // Ensure min is not negative if all values are positive
  if (minEquity > 0 && yAxisMin < 0) {
    yAxisMin = 0;
  }

  // If range is very small, add more padding
  if (maxEquity - minEquity < 100) {
    yAxisMin = Math.floor(minEquity - 50);
    yAxisMax = Math.ceil(maxEquity + 50);
  }

  // Custom Y-axis tick formatter
  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `$${value}`;
    }
    return `$${value}`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-3">
          <p className="text-sm text-gray-500">
            {new Date(label).toLocaleDateString()}
          </p>
          <p className="text-lg font-semibold text-green-600">
            $
            {payload[0].value.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-900">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Equity Curve</h2>
        <div className="text-sm text-gray-500">
          <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span>
          Current: ${data[data.length - 1]?.equity.toLocaleString()}
        </div>
      </div>

      <div style={{ width: "100%", height: 350 }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
              tick={{ fontSize: 12 }}
              minTickGap={30}
            />

            <YAxis
              domain={[yAxisMin, yAxisMax]}
              tickFormatter={formatYAxis}
              tick={{ fontSize: 12 }}
              width={60}
              label={{
                value: "Equity ($)",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 12, fill: "#6b7280" },
              }}
            />

            <Tooltip content={<CustomTooltip />} />

            <Line
              type="monotone"
              dataKey="equity"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: "#22c55e" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Min/Max indicators */}
      <div className="mt-2 text-xs text-gray-400 flex justify-between">
        <span>Min: ${minEquity.toLocaleString()}</span>
        <span>Max: ${maxEquity.toLocaleString()}</span>
        <span>Change: ${(maxEquity - minEquity).toLocaleString()}</span>
      </div>
    </div>
  );
}
