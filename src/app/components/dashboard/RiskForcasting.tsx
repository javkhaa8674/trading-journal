"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Trade = {
  profit: number;
};

type Props = {
  trades: Trade[];
  simulations?: number;
  futureTrades?: number;
};

type HistogramData = {
  streak: number;
  count: number;
};

// 🔥 random helper
const rand = () => Math.random();

// -----------------------------
// 🔥 EXPANDABLE EXPLANATION
// -----------------------------
function StreakExplanation({
  winRate,
  lossProb,
}: {
  winRate: number;
  lossProb: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-3 border rounded-lg bg-red-50 dark:bg-red-950 overflow-hidden">
      {/* Header Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex justify-between items-center hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <span className="font-semibold text-sm">
            Дараалсан алдагдал гэж юу вэ?
          </span>
        </div>
        {isOpen ? (
          <span className="text-xl dark:text-white">▶</span>
        ) : (
          <span className="text-xl dark:text-white">▼</span>
        )}
      </button>

      {/* Content - Expanded */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-3 text-sm border-t border-red-200 dark:border-red-800">
          {/* Simple explanation */}
          <div className="pt-3">
            <p className="font-medium text-red-800 dark:text-red-200">
              🎲 Таны стратеги хэдэн удаа дараалан алдаж болох вэ?
            </p>
            <p className="text-red-700 dark:text-red-300 text-xs mt-1">
              Жишээ нь: 3 удаа дараалан алдвал{" "}
              {(Math.pow(lossProb, 3) * 100).toFixed(2)}% магадлалтай
            </p>
          </div>

          {/* 3 key concepts - easy to understand */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <div className="bg-white dark:bg-gray-800 p-2 rounded">
              <span className="font-bold text-red-600">📊 Дээрх график</span>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Та арилжаануудад хэдэн удаа, хэдэн дараалсан алдагдал гарах
                магадлалыг харуулж байна.
              </p>
              <p className="text-gray-500 mt-1 text-xs">
                Хэрэв 3 удаа дараалан алдах нь олон удаа тохиолдвол том алдагдал
                хүлээх болно.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-2 rounded">
              <span className="font-bold text-red-600">
                🔮 Ирээдүйн таамаглал
              </span>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Дараагийн арилжаанд хамгийн ихдээ хэдэн удаа дараалан алдах вэ?
              </p>
              <p className="text-gray-500 mt-1 text-xs">
                • Хүлээгдэж буй: Дунджаар ийм удаа алдана
                <br />• Хамгийн муу: 95% тохиолдолд энэ хэмжээнээс хэтрэхгүй
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-2 rounded">
              <span className="font-bold text-red-600">💰 Практик утга</span>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Энэ нь таны лотын хэмжээг тохируулахад хэрэглэгдэнэ
              </p>
              <p className="text-gray-500 mt-1 text-xs">
                Хэрэв 5 удаа дараалан алдах боломжтой бол таны stop-loss хэмжээг
                5-аар үржүүлэх хэрэгтэй
              </p>
            </div>
          </div>

          {/* Real example */}
          <div className="bg-yellow-50 dark:bg-yellow-950 p-2 rounded text-xs">
            <p className="font-semibold text-yellow-800 dark:text-yellow-200">
              📖 Энгийн жишээ:
            </p>
            <div className="mt-1 text-yellow-700 dark:text-yellow-300 space-y-1">
              <p>Таны win rate = {(winRate * 100).toFixed(0)}%</p>
              <p>
                → Дунджаар 100 арилжаанд {Math.round(100 * lossProb)} удаа
                алдана
              </p>
              <p>→ Гэхдээ тэдгээр алдагдал нь дараалан ирж болно!</p>
              <p className="font-medium mt-1">
                ✅ Тиймээс дандаа хамгийн муу тохиолдолд бэлэн байх хэрэгтэй
              </p>
            </div>
          </div>

          {/* Quick tips */}
          <div className="bg-green-50 dark:bg-green-950 p-2 rounded text-xs">
            <p className="font-semibold text-green-800 dark:text-green-200">
              💡 Зөвлөгөө:
            </p>
            <div className="mt-1 text-green-700 dark:text-green-300">
              <p>
                • Дараалсан алдагдлын тоо × Risk per trade = Хамгийн их алдагдал
              </p>
              <p>• Жишээ: 5 удаа алдагдал × 2% risk = 10% account loss</p>
              <p>
                • Prop firm-д 10-20% drawdown хязгаартай тул тохируулах хэрэгтэй
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function StreakRiskTool({
  trades,
  simulations = 500,
  futureTrades = 100,
}: Props) {
  // --------------------------
  // WIN RATE
  // --------------------------
  const winRate = useMemo(() => {
    const wins = trades.filter((t) => t.profit > 0).length;
    return trades.length ? wins / trades.length : 0;
  }, [trades]);

  const lossProb = 1 - winRate;

  // --------------------------
  // HISTOGRAM (REAL DATA)
  // --------------------------
  const histogramData: HistogramData[] = useMemo(() => {
    let current = 0;
    const streaks: number[] = [];

    trades.forEach((t) => {
      if (t.profit < 0) current++;
      else {
        if (current > 0) streaks.push(current);
        current = 0;
      }
    });

    if (current > 0) streaks.push(current);

    const map: Record<number, number> = {};
    streaks.forEach((s) => {
      map[s] = (map[s] || 0) + 1;
    });

    return Object.entries(map)
      .map(([k, v]) => ({ streak: +k, count: v }))
      .sort((a, b) => a.streak - b.streak);
  }, [trades]);

  const maxStreak = useMemo(
    () => Math.max(0, ...histogramData.map((d) => d.streak)),
    [histogramData],
  );

  // --------------------------
  // 🔥 MONTE CARLO SIMULATION
  // --------------------------
  const forecast = useMemo(() => {
    if (!trades.length) return null;

    const maxStreaks: number[] = [];

    for (let i = 0; i < simulations; i++) {
      let current = 0;
      let maxLocal = 0;

      for (let j = 0; j < futureTrades; j++) {
        const isWin = rand() < winRate;

        if (!isWin) {
          current++;
          if (current > maxLocal) maxLocal = current;
        } else {
          current = 0;
        }
      }

      maxStreaks.push(maxLocal);
    }

    maxStreaks.sort((a, b) => a - b);

    const percentile = (p: number) =>
      maxStreaks[Math.floor(p * maxStreaks.length)];

    return {
      expected: maxStreaks.reduce((s, v) => s + v, 0) / maxStreaks.length,
      p95: percentile(0.95),
      p99: percentile(0.99),
    };
  }, [trades, simulations, futureTrades, winRate]);

  // --------------------------
  // PROBABILITY CALC
  // --------------------------
  const probabilityOfN = (n: number) => {
    if (winRate <= 0 || winRate >= 1) return 0;
    return Math.pow(1 - winRate, n);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border rounded-lg p-2 text-sm">
          <p>{d.streak} дараалласан алдагдлал</p>
          <p>{d.count} удаа</p>
        </div>
      );
    }
    return null;
  };

  if (!trades.length) {
    return <div className="p-6 text-center">Өгөгдөл байхгүй.</div>;
  }
  // Probability values for display
  const prob3 = probabilityOfN(3) * 100;
  const prob5 = probabilityOfN(5) * 100;
  const prob7 = probabilityOfN(7) * 100;

  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 p-4 mt-4">
      <h3 className="text-lg font-semibold mb-2">
        ⚠️ Дараалсан алдагдлын эрсдэл
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        Таны стратеги хэдэн удаа дараалан алдаж болох вэ?
      </p>
      {/* Histogram */}
      <div className="w-full h-[250px] md:h-[350px]">
        <ResponsiveContainer>
          <BarChart data={histogramData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="streak"
              label={{ value: "Дараалсан алдагдлын тоо", position: "bottom" }}
            />
            <YAxis
              label={{
                value: "Хэдэн удаа тохиолдсон",
                angle: -90,
                position: "left",
                offset: -5,
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast numbers */}
      {forecast && (
        <div className="grid grid-cols-3 gap-2 text-center mt-4 text-sm">
          <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <p className="text-gray-500 text-xs">📊 Дундаж</p>
            <p className="font-bold text-lg">{forecast.expected.toFixed(1)}</p>
            <p className="text-xs text-gray-400">удаа дараалан</p>
          </div>
          <div className="p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
            <p className="text-gray-500 text-xs">⚠️ Хамгийн муу (95%)</p>
            <p className="font-bold text-lg text-yellow-600">{forecast.p95}</p>
            <p className="text-xs text-gray-400">удаа дараалан</p>
          </div>
          <div className="p-2 bg-red-50 dark:bg-red-950 rounded">
            <p className="text-gray-500 text-xs">🔥 Хэт муу (99%)</p>
            <p className="font-bold text-lg text-red-600">{forecast.p99}</p>
            <p className="text-xs text-gray-400">удаа дараалан</p>
          </div>
        </div>
      )}

      {/* Simple probability cards */}
      <div className="mt-4">
        <p className="text-sm font-medium mb-2">🔮 Дараалан алдах магадлал:</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
            <p className="text-2xl font-bold text-orange-600">
              {prob3.toFixed(2)}%
            </p>
            <p className="text-xs text-gray-500">3 удаа дараалан</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
            <p className="text-2xl font-bold text-orange-600">
              {prob5.toFixed(2)}%
            </p>
            <p className="text-xs text-gray-500">5 удаа дараалан</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
            <p className="text-2xl font-bold text-orange-600">
              {prob7.toFixed(2)}%
            </p>
            <p className="text-xs text-gray-500">7 удаа дараалан</p>
          </div>
        </div>
      </div>

      {/* REPLACE OLD EXPLANATION WITH NEW EXPANDABLE ONE */}
      <StreakExplanation winRate={winRate} lossProb={lossProb} />
    </div>
  );
}
