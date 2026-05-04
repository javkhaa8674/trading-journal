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
} from "recharts";

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
  riskPerTrade?: number;
};

// -----------------------------
// WEIGHTS
// -----------------------------
const WEIGHTS = {
  expectancy: 0.2,
  profitFactor: 0.2,
  sharpe: 0.15,
  calmar: 0.15,
  riskReward: 0.1,
  consistency: 0.1,
  winRate: 0.1,
};

// -----------------------------
// SCORING
// -----------------------------
const scoreExpectancy = (r: number) => {
  if (r <= 0) return 0;
  if (r >= 0.5) return 100;
  return (r / 0.5) * 100;
};

const scorePF = (v: number) => {
  if (v <= 1) return 0;
  if (v >= 2.0) return 100;
  return ((v - 1) / 1.0) * 100;
};

const scoreRR = (v: number) => {
  if (v <= 0.5) return 0;
  if (v >= 3) return 100;
  return ((v - 0.5) / 2.5) * 100;
};

const scoreSharpe = (v: number) => {
  if (v <= 0) return 0;
  if (v >= 2) return 100;
  return (v / 2) * 100;
};

const scoreCalmar = (v: number) => {
  if (v <= 0) return 0;
  if (v >= 3) return 100;
  return (v / 3) * 100;
};

const scoreConsistency = (v: number) => Math.min(100, v);

const scoreWinRate = (wr: number, rr: number) => {
  const breakeven = 1 / (1 + rr);
  const edge = wr - breakeven;

  if (edge <= 0) return 0;
  if (edge >= 0.2) return 100;

  return (edge / 0.2) * 100;
};

// -----------------------------
// SINGLE SOURCE
// -----------------------------
function buildMetrics(metrics: Metrics, riskPerTrade: number) {
  const expectancyR = metrics.expectancy / riskPerTrade;

  const scores = {
    expectancy: scoreExpectancy(expectancyR),
    profitFactor: scorePF(metrics.profitFactor),
    sharpe: scoreSharpe(metrics.sharpeRatio),
    calmar: scoreCalmar(metrics.calmarRatio),
    riskReward: scoreRR(metrics.riskReward),
    consistency: scoreConsistency(metrics.consistency),
    winRate: scoreWinRate(metrics.winRate / 100, metrics.riskReward),
  };

  const chartData = [
    { metric: "Expectancy", score: scores.expectancy, raw: expectancyR },
    {
      metric: "Profit Factor",
      score: scores.profitFactor,
      raw: metrics.profitFactor,
    },
    { metric: "Sharpe", score: scores.sharpe, raw: metrics.sharpeRatio },
    { metric: "Calmar", score: scores.calmar, raw: metrics.calmarRatio },
    { metric: "RR", score: scores.riskReward, raw: metrics.riskReward },
    {
      metric: "Consistency",
      score: scores.consistency,
      raw: metrics.consistency,
    },
    { metric: "WinRate", score: scores.winRate, raw: metrics.winRate },
  ];

  const overall =
    scores.expectancy * WEIGHTS.expectancy +
    scores.profitFactor * WEIGHTS.profitFactor +
    scores.sharpe * WEIGHTS.sharpe +
    scores.calmar * WEIGHTS.calmar +
    scores.riskReward * WEIGHTS.riskReward +
    scores.consistency * WEIGHTS.consistency +
    scores.winRate * WEIGHTS.winRate;

  return { raw: metrics, chartData, overall };
}

// -----------------------------
// EXPLANATION COMPONENT (БУЦААСАН)
// -----------------------------
function MetricsExplanation() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-4 text-xs p-3 bg-blue-50 dark:bg-blue-950 rounded">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center font-semibold"
      >
        <span>📖 Үзүүлэлтүүдийн тайлбар</span>
        <span className="text-xl">{isExpanded ? "▲" : "▼"}</span>
      </button>

      {!isExpanded && (
        <div className="mt-2 text-gray-600 dark:text-gray-400">
          Expectancy, PF, Sharpe, Calmar, RR, Consistency, WinRate
        </div>
      )}

      {isExpanded && (
        <div className="mt-3 space-y-3 border-t pt-3">
          <p>
            <b>🎯 Expectancy:</b> ≥0.5 сайн
          </p>
          <p>
            <b>💰 Profit Factor:</b> ≥2 сайн
          </p>
          <p>
            <b>📊 Sharpe:</b> ≥2 тогтвортой
          </p>
          <p>
            <b>⬇️ Calmar:</b> ≥3 сайн
          </p>
          <p>
            <b>⚖️ RR:</b> ≥3 сайн
          </p>
          <p>
            <b>📅 Consistency:</b> ≥75 сайн
          </p>
          <p>
            <b>🎲 WinRate:</b> RR-тэй уялдана
          </p>
        </div>
      )}
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-gray-800 dark:text-gray-100">
        {data.metric}
      </p>

      <p className="text-blue-500">Score: {data.score.toFixed(1)}</p>

      <p className="text-gray-600 dark:text-gray-300">
        Raw: {data.raw.toFixed?.(2)}
      </p>
    </div>
  );
}

// -----------------------------
// MAIN COMPONENT
// -----------------------------
export default function SpiderWebChart({
  tradesLength,
  metrics,
  riskPerTrade = 1,
}: Props) {
  const computed = useMemo(() => {
    return buildMetrics(metrics, riskPerTrade);
  }, [metrics, riskPerTrade]);

  const diagnosis = useMemo(() => {
    const msgs: string[] = [];
    const m = computed.raw;

    if (m.profitFactor < 1.5) msgs.push("⚠ Profit Factor бага");
    if (m.calmarRatio < 1) msgs.push("⚠ Drawdown их");

    if (!msgs.length) msgs.push("✅ Balanced strategy");

    return msgs;
  }, [computed]);

  if (!tradesLength) {
    return <div className="p-6 text-center">Өгөгдөл алга</div>;
  }

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-900">
      <h3 className="text-lg font-semibold mb-3">
        📊 Performance Radar (Score 0–100)
      </h3>

      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer>
          <RadarChart data={computed.chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis domain={[0, 100]} />

            <Tooltip content={<CustomTooltip />} />

            <Radar
              dataKey="score"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="text-center mt-3 text-lg font-bold">
        Overall Score: {computed.overall.toFixed(0)}%
      </div>

      {/* ✅ ТАЙЛБАР БУЦСАН */}
      <MetricsExplanation />

      <div className="mt-4 text-xs p-3 bg-yellow-50 dark:bg-yellow-950 rounded">
        <p className="font-semibold">🧠 Стратегийн Анализ</p>
        {diagnosis.map((m, i) => (
          <p key={i}>{m}</p>
        ))}
      </div>
    </div>
  );
}
