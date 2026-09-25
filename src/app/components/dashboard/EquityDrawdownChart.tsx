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
  ReferenceLine,
} from "recharts";
import { Trade } from "@/types/trade";
import { buildEquityWithDrawdown } from "@/lib/equity";
import { metricsHelp } from "@/lib/constants/metricsHelp";
import { HelpTooltip } from "./HelpTooltip";

type Props = {
  trades: Trade[];
  balance: number;
  // ⭐ Max loss limit - шууд equity түвшин (жишээ: 4500). 0/null бол харуулахгүй
  maxLossLimit?: number | null;
};

function EquityCustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  const equity = payload.find((p: any) => p.dataKey === "equity")?.value;
  const drawdown = payload.find((p: any) => p.dataKey === "drawdown")?.value;

  return (
    <div
      className="
      bg-white dark:bg-gray-800
      border border-gray-200 dark:border-gray-700
      shadow-lg rounded-lg p-3 text-xs
      min-w-[160px]
    "
    >
      <div className="text-gray-500 dark:text-gray-300 mb-2">
        📅 {new Date(label).toLocaleString()}
      </div>

      {equity !== undefined && (
        <div className="flex justify-between text-green-500">
          <span>Equity:</span>
          <span>${Number(equity).toLocaleString()}</span>
        </div>
      )}

      {drawdown !== undefined && (
        <div className="flex justify-between text-red-500 mt-1">
          <span>Drawdown:</span>
          <span>{Number(drawdown).toFixed(2)}%</span>
        </div>
      )}
    </div>
  );
}

export default function EquityDrawdownChart({
  trades,
  balance,
  maxLossLimit,
}: Props) {
  // Data бэлтгэх
  const data = useMemo(() => {
    const rawData = buildEquityWithDrawdown(trades, balance);
    return [...rawData].sort((a, b) => a.date - b.date);
  }, [trades, balance]);

  // ⭐ Max loss limit идэвхтэй эсэх
  const hasMaxLoss =
    typeof maxLossLimit === "number" &&
    maxLossLimit > 0 &&
    Number.isFinite(maxLossLimit);

  if (!data || data.length === 0) {
    return (
      <div className="p-4 border rounded-lg">
        <p className="text-gray-500">No trading data available</p>
      </div>
    );
  }

  // Equity хязгаарыг тооцоолох
  const equities = data.map((d) => d.equity);

  // ⭐ maxLossLimit байвал min-д оруулна
  const minEquity = hasMaxLoss
    ? Math.min(...equities, balance, maxLossLimit as number)
    : Math.min(...equities, balance);
  const maxEquity = Math.max(...equities, balance);
  const equityPadding = (maxEquity - minEquity) * 0.1 || 100;

  // Drawdown хязгаарыг тооцоолох
  const drawdowns = data.map((d) => d.drawdown);
  const minDrawdown = Math.min(...drawdowns, -5);
  const maxDrawdown = Math.max(...drawdowns, 5);
  const drawdownPadding = Math.abs(minDrawdown) * 0.1;

  const yAxisDrawdownMin = Math.floor(minDrawdown - drawdownPadding);
  const yAxisDrawdownMax = Math.ceil(maxDrawdown + drawdownPadding);

  const maxDrawdownValue = Math.min(...drawdowns);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-900">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          Equity vs Drawdown{" "}
          <HelpTooltip
            title={metricsHelp.equityDrawdown.title}
            description={metricsHelp.equityDrawdown.description}
          />
        </h2>
        <div className="text-sm text-gray-500 space-x-3">
          <span className="text-green-600">
            📈 Current: ${data[data.length - 1]?.equity.toLocaleString()}
          </span>
          <span className="text-red-600">
            📉 Max DD: {maxDrawdownValue.toFixed(2)}%
          </span>
          {/* ⭐ Max Loss header-т */}
          {hasMaxLoss && (
            <span className="text-orange-600">
              ⚠️ Max Loss: ${(maxLossLimit as number).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 10, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

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
            <Tooltip content={<EquityCustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => {
                if (value === "equity") return "Equity Curve";
                if (value === "drawdown") return "Drawdown";
                return value;
              }}
            />

            {/* ⭐ Max Loss Limit - left Y-axis дээр */}
            {hasMaxLoss && (
              <ReferenceLine
                yAxisId="left"
                y={maxLossLimit as number}
                stroke="#f97316"
                strokeWidth={2}
                strokeDasharray="6 4"
                label={{
                  value: `Max Loss: $${(maxLossLimit as number).toLocaleString()}`,
                  position: "insideTopRight",
                  fill: "#f97316",
                  fontSize: 12,
                }}
              />
            )}

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
        {/* ⭐ Footer-т Max Loss */}
        {hasMaxLoss && (
          <span className="text-orange-500">
            Max Loss: ${(maxLossLimit as number).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}
