"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { InstrumentStats } from "@/lib/advancedAnalytics";
import { metricsHelp } from "@/lib/constants/metricsHelp";
import { HelpTooltip } from "./HelpTooltip";

interface InstrumentVolumeAnalysisProps {
  data: InstrumentStats[];
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#6366f1",
  "#14b8a6",
];

export function InstrumentVolumeAnalysis({
  data,
}: InstrumentVolumeAnalysisProps) {
  const pieData = data.map((item) => ({
    name: item.symbol,
    value: item.volume,
    tradeCount: item.tradeCount,
  }));

  const barData = data.map((item) => ({
    name: item.symbol,
    volume: item.volume,
    profitPerLot: item.volume > 0 ? item.netProfit / item.volume : 0,
  }));

  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold">
          Instrument Volume Analysis
        </h3>
        <div className="flex h-[400px] items-center justify-center text-gray-500">
          No volume data available
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
      <div className="mb-4 flex flex-start justify-start gap-2">
        <h3 className="mb-4 text-lg font-semibold">
          Instrument Volume Analysis
        </h3>
        <HelpTooltip
          title={metricsHelp.instrumentVolumeAnalysis.title}
          description={metricsHelp.instrumentVolumeAnalysis.description}
        />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pie Chart */}
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-600">
            Volume Distribution
          </h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart
                style={{
                  fontSize: "10px",
                }}
              >
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={(entry) =>
                    `${entry.name}: ${entry.value.toFixed(1)} lots`
                  }
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  isAnimationActive={true}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => {
                    if (name === "value")
                      return [`${Number(value).toFixed(2)} lots`, "Volume"];
                    if (name === "tradeCount") return [value, "Trade Count"];
                    return [Number(value).toFixed(2), name];
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart - Profit per Lot */}
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-600">
            Profit per Lot by Instrument
          </h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis
                  label={{
                    value: "Profit per Lot ($)",
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 12,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                  }}
                  formatter={(value: any) => [
                    `$${Number(value).toFixed(2)}`,
                    "Profit per Lot",
                  ]}
                />
                <Bar dataKey="profitPerLot" fill="#8b5cf6">
                  {barData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.profitPerLot >= 0 ? "#10b981" : "#ef4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
