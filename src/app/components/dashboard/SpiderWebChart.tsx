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
  riskPerTrade?: number; // 🔥 шинэ
};

type ChartDataPoint = {
  metric: string;
  value: number;
  unit: string;
  rawValue?: number;
  target?: number;
  isPercentage?: boolean;
  fullMark?: number;
  good?: number;
};

// 🔥 NON-LINEAR SCORING (REALISTIC)
const scorePF = (v: number) => {
  if (v <= 1) return 0;
  if (v >= 3) return 100;
  return ((v - 1) / 2) * 100;
};

const scoreRR = (v: number) => {
  if (v <= 1) return 20;
  if (v >= 3) return 100;
  return ((v - 1) / 2) * 80 + 20;
};

const scoreSharpe = (v: number) => {
  if (v <= 0) return 0;
  if (v >= 3) return 100;
  return (v / 3) * 100;
};

const scoreCalmar = (v: number) => {
  if (v <= 0) return 0;
  if (v >= 10) return 100;
  return (v / 10) * 100;
};

const scoreExpectancy = (r: number) => {
  if (r <= 0) return 0;
  if (r >= 1) return 100;
  return r * 100;
};

export default function SpiderWebChart({
  tradesLength,
  metrics,
  startingBalance = 10000,
  riskPerTrade = 100,
}: Props) {
  const [scaleMode, setScaleMode] = useState<"normalized" | "absolute">(
    "normalized",
  );

  const normalizedMetrics: ChartDataPoint[] = useMemo(() => {
    const expectancyR = metrics.expectancy / riskPerTrade;

    return [
      {
        metric: "Win Rate",
        value: Math.min(100, metrics.winRate),
        rawValue: metrics.winRate,
        unit: "%",
        target: 50,
        isPercentage: true,
      },
      {
        metric: "Profit Factor",
        value: scorePF(metrics.profitFactor),
        rawValue: metrics.profitFactor,
        unit: "x",
        target: 70,
      },
      {
        metric: "Risk/Reward",
        value: scoreRR(metrics.riskReward),
        rawValue: metrics.riskReward,
        unit: "x",
        target: 70,
      },
      {
        metric: "Sharpe Ratio",
        value: scoreSharpe(metrics.sharpeRatio),
        rawValue: metrics.sharpeRatio,
        unit: "",
        target: 60,
      },
      {
        metric: "Calmar Ratio",
        value: scoreCalmar(metrics.calmarRatio),
        rawValue: metrics.calmarRatio,
        unit: "",
        target: 60,
      },
      {
        metric: "Consistency",
        value: Math.min(100, metrics.consistency),
        rawValue: metrics.consistency,
        unit: "%",
        target: 70,
        isPercentage: true,
      },
      {
        metric: "Avg Win/Loss",
        value: scoreRR(metrics.avgWinLoss),
        rawValue: metrics.avgWinLoss,
        unit: "x",
        target: 70,
      },
      {
        metric: "Expectancy",
        value: scoreExpectancy(expectancyR),
        rawValue: expectancyR,
        unit: "R",
        target: 50,
      },
    ];
  }, [metrics, riskPerTrade]);

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
        value: metrics.profitFactor,
        fullMark: 5,
        unit: "x",
        good: 2,
      },
      {
        metric: "Risk/Reward",
        value: metrics.riskReward,
        fullMark: 5,
        unit: "x",
        good: 2,
      },
      {
        metric: "Sharpe Ratio",
        value: metrics.sharpeRatio,
        fullMark: 5,
        unit: "",
        good: 2,
      },
      {
        metric: "Calmar Ratio",
        value: metrics.calmarRatio,
        fullMark: 20,
        unit: "",
        good: 5,
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
        value: metrics.avgWinLoss,
        fullMark: 5,
        unit: "x",
        good: 2,
      },
      {
        metric: "Expectancy",
        value: metrics.expectancy / riskPerTrade,
        fullMark: 2,
        unit: "R",
        good: 0.5,
      },
    ];
  }, [metrics, riskPerTrade]);

  const chartData =
    scaleMode === "normalized" ? normalizedMetrics : absoluteMetrics;

  const getColor = (value: number, target: number, max: number) => {
    const percentage = (value / max) * 100;
    const goodPercentage = (target / max) * 100;

    if (percentage >= goodPercentage) return "#22c55e";
    if (percentage >= goodPercentage * 0.6) return "#eab308";
    return "#ef4444";
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;

      return (
        <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-3">
          <p className="font-semibold">{data.metric}</p>
          <p className="text-2xl font-bold">
            {data.rawValue?.toFixed(2)}
            {data.unit}
          </p>
          {"value" in data && (
            <p className="text-xs text-gray-500">
              Score: {data.value.toFixed(0)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (!tradesLength) {
    return (
      <div className="rounded-lg border bg-white p-6 text-center dark:bg-gray-900">
        <div className="text-4xl mb-2">🕸️</div>
        <p className="text-gray-500">No trading data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4 mt-4 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold">
            Performance Radar / Гүйцэтгэлийн радар
            <HelpTooltip
              title={metricsHelp.spiderChart.title}
              description={metricsHelp.spiderChart.description}
            />
          </h3>
        </div>

        <div className="flex gap-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setScaleMode("normalized")}
            className={`px-3 py-1 rounded-md ${
              scaleMode === "normalized"
                ? "bg-blue-500 text-white"
                : "text-gray-500 hover:bg-gray-200"
            }`}
          >
            📊 Score
          </button>
          <button
            onClick={() => setScaleMode("absolute")}
            className={`px-3 py-1 rounded-md ${
              scaleMode === "absolute"
                ? "bg-blue-500 text-white"
                : "text-gray-500 hover:bg-gray-200"
            }`}
          >
            📈 Raw
          </button>
        </div>
      </div>

      <div style={{ width: "100%", height: 450 }}>
        <ResponsiveContainer>
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis
              domain={[0, scaleMode === "normalized" ? 100 : "auto"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Radar
              dataKey="value"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-center text-sm">
        Overall Score:{" "}
        {(
          normalizedMetrics.reduce((s, m) => s + m.value, 0) /
          normalizedMetrics.length
        ).toFixed(0)}
        %
      </div>
    </div>
  );
}
