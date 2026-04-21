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
} from "recharts";
import { HelpTooltip } from "./HelpTooltip";
import { metricsHelp } from "@/lib/constants/metricsHelp";

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

  // Calculate min and max equity for Y-axis domain
  const equities = data.map((d) => d.equity);
  const minEquity = Math.min(...equities);
  const maxEquity = Math.max(...equities);

  // Add small padding (2% margin from min and max for better visualization)
  const padding = (maxEquity - minEquity) * 0.02;
  let yAxisMin = Math.floor(minEquity - padding);
  let yAxisMax = Math.ceil(maxEquity + padding);

  // Ensure min is not negative if all values are positive
  if (minEquity > 0 && yAxisMin < 0) {
    yAxisMin = 0;
  }

  // If all values are the same, add padding
  if (maxEquity === minEquity) {
    yAxisMin = minEquity - 100;
    yAxisMax = maxEquity + 100;
  }

  // Format date for X-axis
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Format Y-axis tick values
  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `$${value}`;
    }
    return `$${value}`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      return (
        <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-3">
          <p className="text-sm text-gray-500">
            {date.toLocaleDateString()} {date.toLocaleTimeString()}
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

  const startEquity = data[0]?.equity;
  const endEquity = data[data.length - 1]?.equity;
  const totalChange = endEquity - startEquity;

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-900">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-semibold">
          Equity Curve{" "}
          <HelpTooltip
            title={metricsHelp.equityCurve.title}
            description={metricsHelp.equityCurve.description}
            position="top"
          />
        </h2>
        <div className="text-sm text-gray-500 space-x-3">
          <span>
            📊 Range: ${minEquity.toLocaleString()} - $
            {maxEquity.toLocaleString()}
          </span>
          <span
            className={totalChange >= 0 ? "text-green-600" : "text-red-600"}
          >
            {totalChange >= 0 ? "▲" : "▼"} $
            {Math.abs(totalChange).toLocaleString()}
          </span>
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
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
              minTickGap={30}
            />

            <YAxis
              domain={[yAxisMin, yAxisMax]}
              tickFormatter={formatYAxis}
              tick={{ fontSize: 12 }}
              width={65}
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
              dot={{ r: 3, fill: "#22c55e" }}
              activeDot={{ r: 6, fill: "#22c55e" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-400 border-t pt-2">
        <div>
          <span className="font-medium">Start:</span> $
          {startEquity?.toLocaleString()}
        </div>
        <div>
          <span className="font-medium">End:</span> $
          {endEquity?.toLocaleString()}
        </div>
        <div>
          <span className="font-medium">Min:</span> $
          {minEquity.toLocaleString()}
        </div>
        <div>
          <span className="font-medium">Max:</span> $
          {maxEquity.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
