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
  ReferenceLine,
} from "recharts";

type Props = {
  data: {
    date: string;
    equity: number;
    smoothEquity?: number;
    maxLossLimit?: number; // ⭐ chartData дотор байгаа
  }[];
};

// ✅ Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-3">
        <p className="text-sm text-gray-500 mb-2">
          {new Date(label).toLocaleDateString()}
        </p>

        {payload.find((p: any) => p.dataKey === "equity") && (
          <div className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Actual Equity:
              </span>
            </div>
            <span className="font-semibold text-green-600">
              $
              {payload
                .find((p: any) => p.dataKey === "equity")
                ?.value?.toLocaleString()}
            </span>
          </div>
        )}

        {payload.find((p: any) => p.dataKey === "smoothEquity") && (
          <div className="flex items-center justify-between gap-4 text-sm mt-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Smooth Equity:
              </span>
            </div>
            <span className="font-semibold text-blue-600">
              $
              {payload
                .find((p: any) => p.dataKey === "smoothEquity")
                ?.value?.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function EquityCurveChart({ data }: Props) {
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [data]);

  // ⭐ chartData-с maxLossLimit утгыг авна
  const maxLossLimit = useMemo(() => {
    if (!sortedData.length) return null;
    const value = sortedData[0]?.maxLossLimit;
    return typeof value === "number" && value > 0 && Number.isFinite(value)
      ? value
      : null;
  }, [sortedData]);

  if (!sortedData.length) {
    return (
      <div className="p-4 border rounded-lg">
        <p className="text-gray-500">No equity data available</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const hasMaxLoss = maxLossLimit !== null;

  const equities = sortedData.map((d) => d.equity);

  // ⭐ maxLossLimit байвал Y тэнхлэгийн min-д оруулна
  const minEquity = hasMaxLoss
    ? Math.min(...equities, maxLossLimit as number)
    : Math.min(...equities);
  const maxEquity = Math.max(...equities);

  const padding = (maxEquity - minEquity) * 0.05 || 100;
  const yAxisMin = Math.floor(minEquity - padding);
  const yAxisMax = Math.ceil(maxEquity + padding);

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-900">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Equity Curve</h2>
        <div className="text-sm text-gray-500">
          Current: ${sortedData[sortedData.length - 1]?.equity.toLocaleString()}
        </div>
      </div>

      <div
        style={{ width: "100%", height: 350, minWidth: 300, minHeight: 250 }}
      >
        <ResponsiveContainer>
          <LineChart
            data={sortedData}
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
              tickFormatter={(v) => `$${v.toLocaleString()}`}
              width={65}
              label={{
                value: "Equity ($)",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 12, fill: "#6b7280" },
              }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* ⭐ Max Loss Limit - chartData-с авсан утга */}
            {hasMaxLoss && (
              <ReferenceLine
                y={maxLossLimit as number}
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="6 4"
                label={{
                  value: `Max Loss: $${(maxLossLimit as number).toLocaleString()}`,
                  position: "insideTopRight",
                  fill: "#ef4444",
                  fontSize: 12,
                }}
              />
            )}

            <Line
              type="monotone"
              dataKey="equity"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 6, fill: "#22c55e" }}
            />
            {sortedData[0]?.smoothEquity && (
              <Line
                type="monotone"
                dataKey="smoothEquity"
                stroke="#3b82f6"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-xs text-gray-400 flex justify-between">
        <span>Min: ${minEquity.toLocaleString()}</span>
        <span>Max: ${maxEquity.toLocaleString()}</span>
        <span>Change: ${(maxEquity - minEquity).toLocaleString()}</span>
        {hasMaxLoss && (
          <span className="text-red-400">
            Max Loss: ${(maxLossLimit as number).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}
