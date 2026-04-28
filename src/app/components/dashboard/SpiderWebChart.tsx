"use client";

import { useMemo, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { HelpTooltip } from "./HelpTooltip";
import { metricsHelp } from "@/lib/constants/metricsHelp";

type Metrics = {
  winRate: number;
  profitFactor: number;
  riskReward: number;
  sharpeRatio: number;
  calmarRatio: number;
  consistency: number;
  avgWinLoss: number;
  expectancy: number;
};

type Props = {
  tradesLength: number;
  metrics: Metrics;
  startingBalance?: number;
};

// Unified chart data type
type ChartDataPoint = {
  metric: string;
  value: number;
  unit: string;
  // For normalized mode
  rawValue?: number;
  target?: number;
  isPercentage?: boolean;
  // For absolute mode
  fullMark?: number;
  good?: number;
};

export default function SpiderWebChart({
  tradesLength,
  metrics,
  startingBalance = 10000,
}: Props) {
  const [scaleMode, setScaleMode] = useState<"normalized" | "absolute">(
    "normalized",
  );

  // Normalize metrics to 0-100 scale
  const normalizedMetrics: ChartDataPoint[] = useMemo(() => {
    const ranges = {
      winRate: { min: 0, max: 100, target: 50, isPercentage: true, good: 50 },
      profitFactor: {
        min: 0,
        max: 3,
        target: 1.5,
        isPercentage: false,
        good: 1.5,
      },
      riskReward: {
        min: 0,
        max: 3,
        target: 1.5,
        isPercentage: false,
        good: 1.5,
      },
      sharpeRatio: { min: -1, max: 3, target: 1, isPercentage: false, good: 1 },
      calmarRatio: { min: -2, max: 3, target: 1, isPercentage: false, good: 1 },
      consistency: {
        min: 0,
        max: 100,
        target: 70,
        isPercentage: true,
        good: 70,
      },
      avgWinLoss: {
        min: 0,
        max: 3,
        target: 1.5,
        isPercentage: false,
        good: 1.5,
      },
      expectancy: {
        min: -200,
        max: 500,
        target: 50,
        isPercentage: false,
        good: 50,
      },
    };

    const normalize = (value: number, min: number, max: number) => {
      if (value <= min) return 0;
      if (value >= max) return 100;
      return ((value - min) / (max - min)) * 100;
    };

    return [
      {
        metric: "Win Rate",
        value: normalize(
          metrics.winRate,
          ranges.winRate.min,
          ranges.winRate.max,
        ),
        rawValue: metrics.winRate,
        unit: "%",
        target: ranges.winRate.target,
        isPercentage: true,
      },
      {
        metric: "Profit Factor",
        value: normalize(
          metrics.profitFactor,
          ranges.profitFactor.min,
          ranges.profitFactor.max,
        ),
        rawValue: metrics.profitFactor,
        unit: "x",
        target: ranges.profitFactor.target,
        isPercentage: false,
      },
      {
        metric: "Risk/Reward",
        value: normalize(
          metrics.riskReward,
          ranges.riskReward.min,
          ranges.riskReward.max,
        ),
        rawValue: metrics.riskReward,
        unit: "x",
        target: ranges.riskReward.target,
        isPercentage: false,
      },
      {
        metric: "Sharpe Ratio",
        value: normalize(
          Math.max(0, metrics.sharpeRatio),
          ranges.sharpeRatio.min,
          ranges.sharpeRatio.max,
        ),
        rawValue: metrics.sharpeRatio,
        unit: "",
        target: ranges.sharpeRatio.target,
        isPercentage: false,
      },
      {
        metric: "Calmar Ratio",
        value: normalize(
          Math.max(0, metrics.calmarRatio),
          ranges.calmarRatio.min,
          ranges.calmarRatio.max,
        ),
        rawValue: metrics.calmarRatio,
        unit: "",
        target: ranges.calmarRatio.target,
        isPercentage: false,
      },
      {
        metric: "Consistency",
        value: normalize(
          metrics.consistency,
          ranges.consistency.min,
          ranges.consistency.max,
        ),
        rawValue: metrics.consistency,
        unit: "%",
        target: ranges.consistency.target,
        isPercentage: true,
      },
      {
        metric: "Avg Win/Loss",
        value: normalize(
          metrics.avgWinLoss,
          ranges.avgWinLoss.min,
          ranges.avgWinLoss.max,
        ),
        rawValue: metrics.avgWinLoss,
        unit: "x",
        target: ranges.avgWinLoss.target,
        isPercentage: false,
      },
      {
        metric: "Expectancy",
        value: normalize(
          metrics.expectancy,
          ranges.expectancy.min,
          ranges.expectancy.max,
        ),
        rawValue: metrics.expectancy,
        unit: "$",
        target: ranges.expectancy.target,
        isPercentage: false,
      },
    ];
  }, [metrics]);

  // Absolute values
  const absoluteMetrics: ChartDataPoint[] = useMemo(() => {
    return [
      {
        metric: "Win Rate",
        value: metrics.winRate,
        fullMark: 100,
        unit: "%",
        good: 50,
      },
      {
        metric: "Profit Factor",
        value: Math.min(3, metrics.profitFactor),
        fullMark: 3,
        unit: "x",
        good: 1.5,
      },
      {
        metric: "Risk/Reward",
        value: Math.min(3, metrics.riskReward),
        fullMark: 3,
        unit: "x",
        good: 1.5,
      },
      {
        metric: "Sharpe Ratio",
        value: Math.min(3, Math.max(0, metrics.sharpeRatio)),
        fullMark: 3,
        unit: "",
        good: 1,
      },
      {
        metric: "Calmar Ratio",
        value: Math.min(3, Math.max(0, metrics.calmarRatio)),
        fullMark: 3,
        unit: "",
        good: 1,
      },
      {
        metric: "Consistency",
        value: metrics.consistency,
        fullMark: 100,
        unit: "%",
        good: 70,
      },
      {
        metric: "Avg Win/Loss",
        value: Math.min(3, metrics.avgWinLoss),
        fullMark: 3,
        unit: "x",
        good: 1.5,
      },
      {
        metric: "Expectancy",
        value: Math.min(500, Math.max(-200, metrics.expectancy)),
        fullMark: 500,
        unit: "$",
        good: 50,
      },
    ];
  }, [metrics]);

  const chartData: ChartDataPoint[] =
    scaleMode === "normalized" ? normalizedMetrics : absoluteMetrics;

  const getColor = (value: number, target: number, max: number) => {
    if (scaleMode === "normalized") {
      if (value >= 70) return "#22c55e";
      if (value >= 40) return "#eab308";
      return "#ef4444";
    } else {
      const percentage = (value / max) * 100;
      const goodPercentage = (target / max) * 100;
      if (percentage >= goodPercentage) return "#22c55e";
      if (percentage >= goodPercentage * 0.6) return "#eab308";
      return "#ef4444";
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      if (scaleMode === "normalized") {
        return (
          <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-3">
            <p className="font-semibold">{data.metric}</p>
            <p
              className="text-2xl font-bold"
              style={{ color: getColor(data.value, data.target || 0, 100) }}
            >
              {data.rawValue?.toFixed(1)}
              {data.unit}
            </p>
            <p className="text-xs text-gray-500">
              Score: {data.value.toFixed(0)}%
              {data.value >= 70
                ? " 🎯 Excellent"
                : data.value >= 40
                  ? " 📊 Average"
                  : " ⚠️ Needs Work"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Target: &gt;{data.target}
              {data.isPercentage ? "%" : data.unit === "$" ? "" : "x"}
            </p>
            <div className="mt-1 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, data.value)}%`,
                  backgroundColor: getColor(data.value, data.target || 0, 100),
                }}
              />
            </div>
          </div>
        );
      } else {
        return (
          <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-3">
            <p className="font-semibold">{data.metric}</p>
            <p
              className="text-2xl font-bold"
              style={{
                color: getColor(
                  data.value,
                  data.good || 0,
                  data.fullMark || 100,
                ),
              }}
            >
              {data.value.toFixed(1)}
              {data.unit}
            </p>
            <p className="text-xs text-gray-500">
              Range: 0 - {data.fullMark}
              {data.unit}
            </p>
            <p className="text-xs text-gray-400">
              Good: &gt;{data.good}
              {data.unit}
            </p>
          </div>
        );
      }
    }
    return null;
  };

  if (!tradesLength) {
    return (
      <div className="rounded-lg border bg-white p-6 text-center dark:bg-gray-900">
        <div className="text-4xl mb-2">🕸️</div>
        <p className="text-gray-500">No trading data available</p>
        <p className="text-xs text-gray-400 mt-1">
          Add trades to see your performance radar
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4 mt-4 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold">
            Performance Radar{" "}
            <HelpTooltip
              title={metricsHelp.spiderChart.title}
              description={metricsHelp.spiderChart.description}
            />
          </h3>
          <p className="text-xs text-gray-500">
            Multi-dimensional performance analysis
          </p>
        </div>

        <div className="flex gap-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setScaleMode("normalized")}
            className={`px-3 py-1 rounded-md transition-all ${
              scaleMode === "normalized"
                ? "bg-blue-500 text-white"
                : "text-gray-500 hover:bg-gray-200"
            }`}
          >
            📊 Normalized (0-100%)
          </button>
          <button
            onClick={() => setScaleMode("absolute")}
            className={`px-3 py-1 rounded-md transition-all ${
              scaleMode === "absolute"
                ? "bg-blue-500 text-white"
                : "text-gray-500 hover:bg-gray-200"
            }`}
          >
            📈 Absolute Values
          </button>
        </div>
      </div>

      <div
        style={{ width: "100%", height: 450, minWidth: 300, minHeight: 350 }}
      >
        <ResponsiveContainer>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, scaleMode === "normalized" ? 100 : "auto"]}
              tick={{ fontSize: 10 }}
              tickFormatter={(value) =>
                scaleMode === "normalized" ? `${value}%` : value.toString()
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Radar
              name={
                scaleMode === "normalized"
                  ? "Normalized Score (0-100%)"
                  : "Your Performance"
              }
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="#3b82f6"
              fillOpacity={0.3}
            />
            {scaleMode === "normalized" && (
              <Radar
                name="Target (70%+)"
                dataKey="target"
                stroke="#9ca3af"
                strokeWidth={1}
                fill="#9ca3af"
                fillOpacity={0.05}
                strokeDasharray="4 4"
              />
            )}
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs border-t pt-3">
        <div>
          <span className="text-gray-500">Overall Score</span>
          <div className="text-lg font-bold">
            {(
              normalizedMetrics.reduce((s, m) => s + m.value, 0) /
              normalizedMetrics.length
            ).toFixed(0)}
            %
          </div>
        </div>
        <div>
          <span className="text-gray-500">Best Metric</span>
          <div className="text-sm font-medium text-green-600">
            {
              normalizedMetrics.reduce((best, m) =>
                m.value > best.value ? m : best,
              ).metric
            }
          </div>
        </div>
        <div>
          <span className="text-gray-500">Needs Work</span>
          <div className="text-sm font-medium text-red-600">
            {
              normalizedMetrics.reduce((worst, m) =>
                m.value < worst.value ? m : worst,
              ).metric
            }
          </div>
        </div>
        <div>
          <span className="text-gray-500">Total Trades</span>
          <div className="text-lg font-bold">{tradesLength}</div>
        </div>
      </div>

      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-xs">
        <p className="font-medium text-blue-800 dark:text-blue-300">
          📖 How to read this chart:
        </p>
        <p className="text-blue-700 dark:text-blue-400 mt-1">
          {scaleMode === "normalized"
            ? "Values are normalized to 0-100% scale. Green (≥70%) = Excellent, Yellow (40-70%) = Average, Red (&lt;40%) = Needs improvement. The dotted line shows the 70% target."
            : "Values are shown in absolute terms. Compare against the outer edge (max value) to see your performance."}
        </p>
      </div>
    </div>
  );
}
