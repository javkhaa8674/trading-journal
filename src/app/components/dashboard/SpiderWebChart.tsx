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
// 🔥 WEIGHTS (PRO LEVEL)
// -----------------------------
const WEIGHTS = {
  expectancy: 0.25,
  profitFactor: 0.2,
  sharpe: 0.15,
  calmar: 0.15,
  riskReward: 0.1,
  consistency: 0.1,
  winRate: 0.05,
};

// -----------------------------
// 🔥 SCORING FUNCTIONS
// -----------------------------
const scoreExpectancy = (r: number) => {
  if (r <= 0) return 0;
  if (r >= 0.5) return 100;
  return (r / 0.5) * 100;
};

const scorePF = (v: number) => {
  if (v <= 1) return 0;
  if (v >= 2.5) return 100;
  return ((v - 1) / 1.5) * 100;
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
  if (v >= 5) return 100;
  return (v / 5) * 100;
};

const scoreConsistency = (v: number) => Math.min(100, v);

// 🔥 RR-aware winrate
const scoreWinRate = (wr: number, rr: number) => {
  const breakeven = 1 / (1 + rr);
  const edge = wr - breakeven;

  if (edge <= 0) return 0;
  if (edge >= 0.2) return 100;

  return (edge / 0.2) * 100;
};

// -----------------------------
// 🔥 COMPONENT
// -----------------------------
export default function SpiderWebChart({
  tradesLength,
  metrics,
  riskPerTrade = 1,
}: Props) {
  const [mode, setMode] = useState<"score" | "raw">("score");

  const data = useMemo(() => {
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
      { metric: "Expectancy", value: scores.expectancy },
      { metric: "Profit Factor", value: scores.profitFactor },
      { metric: "Sharpe", value: scores.sharpe },
      { metric: "Calmar", value: scores.calmar },
      { metric: "RR", value: scores.riskReward },
      { metric: "Consistency", value: scores.consistency },
      { metric: "WinRate", value: scores.winRate },
    ];

    const overall =
      scores.expectancy * WEIGHTS.expectancy +
      scores.profitFactor * WEIGHTS.profitFactor +
      scores.sharpe * WEIGHTS.sharpe +
      scores.calmar * WEIGHTS.calmar +
      scores.riskReward * WEIGHTS.riskReward +
      scores.consistency * WEIGHTS.consistency +
      scores.winRate * WEIGHTS.winRate;

    return { chartData, overall, expectancyR };
  }, [metrics, riskPerTrade]);

  // -----------------------------
  // 🔥 AI COACH (AUTO DIAGNOSIS)
  // -----------------------------
  const diagnosis = useMemo(() => {
    const msgs: string[] = [];

    if (metrics.expectancy <= 0) msgs.push("❌ Стратеги алдагдалтай байна");

    if (metrics.profitFactor < 1.5) msgs.push("⚠ Profit Factor сул байна");

    if (metrics.calmarRatio < 2) msgs.push("⚠ Drawdown өндөр байна");

    if (metrics.sharpeRatio < 1) msgs.push("⚠ Ашиг тогтворгүй байна");

    if (metrics.riskReward > 3 && metrics.winRate < 40)
      msgs.push("⚠ RR өндөр боловч winrate бага");

    if (metrics.consistency < 60) msgs.push("⚠ Consistency сул байна");

    if (!msgs.length) msgs.push("✅ Сайн balanced strategy байна");

    return msgs;
  }, [metrics]);

  if (!tradesLength) {
    return <div className="p-6 text-center">No data</div>;
  }

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-900">
      <h3 className="text-lg font-semibold mb-3">📊 Performance Radar (Pro)</h3>

      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer>
          <RadarChart data={data.chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis domain={[0, 100]} />
            <Tooltip />
            <Radar
              dataKey="value"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* OVERALL SCORE */}
      <div className="text-center mt-3 text-lg font-bold">
        Overall Score: {data.overall.toFixed(0)}%
      </div>

      {/* EXPLANATION */}
      <div className="mt-4 text-xs p-3 bg-blue-50 dark:bg-blue-950 rounded">
        <p className="font-semibold">📖 Үзүүлэлтүүдийн тайлбар</p>

        <p className="mt-2">
          <b>Expectancy:</b> Нэг trade-ийн дундаж ашиг (хамгийн чухал)
        </p>
        <p>
          <b>Profit Factor:</b> Ашиг / Алдагдал
        </p>
        <p>
          <b>Sharpe:</b> Ашиг vs хэлбэлзэл
        </p>
        <p>
          <b>Calmar:</b> Ашиг vs drawdown
        </p>
        <p>
          <b>RR:</b> Ашиг/алдагдлын харьцаа
        </p>
        <p>
          <b>Consistency:</b> Тогтвортой байдал
        </p>
        <p>
          <b>WinRate:</b> Ашигтай trade-ийн хувь
        </p>
      </div>

      {/* AI COACH */}
      <div className="mt-4 text-xs p-3 bg-yellow-50 dark:bg-yellow-950 rounded">
        <p className="font-semibold">🧠 Strategy Analysis</p>
        {diagnosis.map((m, i) => (
          <p key={i}>{m}</p>
        ))}
      </div>
    </div>
  );
}
