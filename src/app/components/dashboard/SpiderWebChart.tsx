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
  expectancy: 0.2,
  profitFactor: 0.2,
  sharpe: 0.15,
  calmar: 0.15,
  riskReward: 0.1,
  consistency: 0.1,
  winRate: 0.1, // increased from 0.05
};

// -----------------------------
// 🔥 SCORING FUNCTIONS
// -----------------------------
const scoreExpectancy = (r: number) => {
  if (r <= 0) return 0;
  if (r >= 1.0) return 100; // 1R expectancy бол маш сайн
  return (r / 1.0) * 100;
};

const scorePF = (v: number) => {
  if (v <= 1) return 0;
  if (v >= 2.5) return 100;
  return ((v - 1) / 1.5) * 100;
};

const scoreRR = (v: number) => {
  if (v <= 0.5) return 0;
  if (v >= 4) return 100;
  return ((v - 0.5) / 3.5) * 100;
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

function MetricsExplanation() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-4 text-xs p-3 bg-blue-50 dark:bg-blue-950 rounded">
      {/* Header - click to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center font-semibold"
      >
        <span>📖 Үзүүлэлтүүдийн тайлбар</span>
        {isExpanded ? (
          <span className="text-xl dark:text-white">▶</span>
        ) : (
          <span className="text-xl dark:text-white">▼</span>
        )}
      </button>

      {/* Collapsed view - short summary */}
      {!isExpanded && (
        <div className="mt-2 text-gray-600 dark:text-gray-400">
          <span>
            Expectancy, Profit Factor, Sharpe, Calmar, RR, Consistency, WinRate
          </span>
        </div>
      )}

      {/* Expanded view - full explanation */}
      {isExpanded && (
        <div className="mt-3 space-y-3 border-t pt-3">
          {/* Expectancy */}
          <div>
            <p>
              <b>🎯 Expectancy:</b> Нэг trade-ийн дундаж ашиг (risk-ийн
              хэмжээгээр)
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              📉 ≤0: Алдагдалтай
              <br />
              📈 0.2-0.5: Хэвийн
              <br />⭐ ≥0.5: Маш сайн
            </p>
          </div>

          {/* Profit Factor */}
          <div>
            <p>
              <b>💰 Profit Factor:</b> Нийт ашиг / Нийт алдагдал
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              📉 ≤1: Алдагдалтай
              <br />
              📈 1.2-1.7: Хэвийн
              <br />⭐ ≥2.0: Маш сайн
            </p>
          </div>

          {/* Sharpe Ratio */}
          <div>
            <p>
              <b>📊 Sharpe Ratio:</b> Хэлбэлзлийг харгалзсан ашиг
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              📉 ≤0.5: Тогтворгүй
              <br />
              📈 0.5-1.5: Хэвийн
              <br />⭐ ≥2.0: Тогтвортой
            </p>
          </div>

          {/* Calmar Ratio */}
          <div>
            <p>
              <b>⬇️ Calmar Ratio:</b> Ашиг / Хамгийн их уналт
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              📉 ≤1: Уналт их
              <br />
              📈 1-3: Хэвийн
              <br />⭐ ≥4: Уналтыг тэсвэрлэдэг
            </p>
          </div>

          {/* Risk/Reward */}
          <div>
            <p>
              <b>⚖️ Risk/Reward:</b> Алдагдал vs ашгийн харьцаа
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              📉 ≤1: Бага RR
              <br />
              📈 1.5-2.5: Хэвийн
              <br />⭐ ≥3: Өндөр RR
            </p>
          </div>

          {/* Consistency */}
          <div>
            <p>
              <b>📅 Consistency:</b> Сарын ашгийн тогтвортой байдал
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              📉 ≤50: Тогтворгүй
              <br />
              📈 50-75: Хэвийн
              <br />⭐ ≥75: Тогтвортой
            </p>
          </div>

          {/* WinRate */}
          <div>
            <p>
              <b>🎲 WinRate:</b> Хожсон trade-ийн хувь
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              ⚠️ RR-г харгалзан үнэлнэ:
              <br />
              • RR=1 → 50% шаардлагатай
              <br />
              • RR=2 → 34% хангалттай
              <br />• RR=3 → 25% хангалттай
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

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
      expectancy: scoreExpectancy(expectancyR).toFixed(2),
      profitFactor: scorePF(metrics.profitFactor).toFixed(2),
      sharpe: scoreSharpe(metrics.sharpeRatio).toFixed(2),
      calmar: scoreCalmar(metrics.calmarRatio).toFixed(2),
      riskReward: scoreRR(metrics.riskReward).toFixed(2),
      consistency: scoreConsistency(metrics.consistency).toFixed(2),
      winRate: scoreWinRate(metrics.winRate / 100, metrics.riskReward).toFixed(
        2,
      ),
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
      Number(scores.expectancy) * WEIGHTS.expectancy +
      Number(scores.profitFactor) * WEIGHTS.profitFactor +
      Number(scores.sharpe) * WEIGHTS.sharpe +
      Number(scores.calmar) * WEIGHTS.calmar +
      Number(scores.riskReward) * WEIGHTS.riskReward +
      Number(scores.consistency) * WEIGHTS.consistency +
      Number(scores.winRate) * WEIGHTS.winRate;

    return { chartData, overall, expectancyR };
  }, [metrics, riskPerTrade]);

  // -----------------------------
  // 🔥 AI COACH (AUTO DIAGNOSIS)
  // -----------------------------
  const diagnosis = useMemo(() => {
    const msgs: string[] = [];

    // Expectancy шалгалт
    if (metrics.expectancy <= 0) {
      msgs.push(
        "❌ Expectancy ≤ 0: Стратеги алдагдалтай, нэн даруй өөрчлөх шаардлагатай",
      );
    } else if (metrics.expectancy < 0.2) {
      msgs.push(
        "⚠ Expectancy < 0.2R: Ашиг бага, системийг сайжруулах боломж бий",
      );
    }

    // Profit Factor шалгалт
    if (metrics.profitFactor < 1) {
      msgs.push("❌ Profit Factor < 1: Нийт алдагдал нийт ашгаас их");
    } else if (metrics.profitFactor < 1.5) {
      msgs.push(
        "⚠ Profit Factor 1-1.5: Ашиг бага, алдагдлыг бууруулах хэрэгтэй",
      );
    }

    // Sharpe Ratio шалгалт
    if (metrics.sharpeRatio < 0.5) {
      msgs.push("⚠ Sharpe < 0.5: Ашиг тогтворгүй, хэлбэлзэл их");
    }

    // Calmar Ratio шалгалт
    if (metrics.calmarRatio < 1) {
      msgs.push("⚠ Calmar < 1: Уналт их, drawdown-г хязгаарлах хэрэгтэй");
    }

    // WinRate vs RR харьцаа
    const requiredWR = 1 / (1 + metrics.riskReward);
    const actualWR = metrics.winRate / 100;

    if (actualWR < requiredWR) {
      msgs.push(
        `❌ WinRate ${metrics.winRate}% нь RR=${metrics.riskReward}-д хангалтгүй (${(requiredWR * 100).toFixed(0)}% шаардлагатай)`,
      );
    }

    // Consistency шалгалт
    if (metrics.consistency < 50) {
      msgs.push("⚠ Consistency < 50: Сар бүрийн ашиг тогтворгүй");
    }

    if (!msgs.length) {
      msgs.push("✅ Бүх үзүүлэлт хэвийн, balanced strategy байна");
    }

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

      {/* EXPANDABLE EXPLANATION - NEW */}
      <MetricsExplanation />

      {/* AI COACH */}
      <div className="mt-4 text-xs p-3 bg-yellow-50 dark:bg-yellow-950 rounded">
        <p className="font-semibold">🧠 Стратегийн Анализ</p>
        {diagnosis.map((m, i) => (
          <p key={i}>{m}</p>
        ))}
      </div>
    </div>
  );
}
