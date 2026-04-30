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
  forecast,
}: {
  winRate: number;
  lossProb: number;
  forecast?: { expected: number; p95: number; p99: number } | null;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mt-3 border rounded-lg bg-blue-50 dark:bg-blue-950 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex justify-between items-center hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📘</span>
          <span className="font-semibold text-sm">Тайлбар</span>
        </div>
        {isOpen ? <span>▲</span> : <span>▼</span>}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-4 text-sm border-t border-blue-200 dark:border-blue-800">
          {/* ⭐ 1. ДЭЭРХ ГУРВАН ҮЗҮҮЛЭЛТИЙН ТАЙЛБАР - ХАМГИЙН ЧУХАЛ */}
          {forecast && (
            <div className="bg-indigo-50 dark:bg-indigo-950 p-3 rounded-lg border-2 border-indigo-300">
              <p className="font-bold text-indigo-800 dark:text-indigo-200 text-base mb-2">
                🎯 Дээрх &quot;{forecast.expected.toFixed(1)}&quot;, &quot;
                {forecast.p95}&quot;, &quot;
                {forecast.p99}&quot; гэсэн тоонууд юу гэсэн үг вэ?
              </p>

              <div className="space-y-3 mt-2">
                {/* Дундаж */}
                <div className="bg-white dark:bg-gray-800 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    <span className="font-bold text-lg">
                      {forecast.expected.toFixed(1)} удаа
                    </span>
                    <span className="text-gray-500">ДУНДАЖ</span>
                  </div>
                  <p className="text-sm mt-1">
                    <span className="font-semibold">Энгийнээр:</span> Таны
                    дараагийн 100 арилжаанд хамгийн урт дараалсан алдагдлын{" "}
                    <span className="font-bold">дундаж утга</span>.
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    📌 Жишээ: Хэрэв та 100 арилжааг 1000 удаа давтан хийвэл,
                    тухай бүрийн хамгийн урт дараалсан алдагдлын дундаж{" "}
                    {forecast.expected.toFixed(1)} болно.
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded mt-2">
                    <p className="text-xs font-mono">
                      → {forecast.expected.toFixed(1)} удаа дараалан алдахад,
                      {forecast.expected && forecast.expected * 2}% алдагдал (2%
                      risk үед)
                    </p>
                  </div>
                </div>

                {/* Хамгийн муу (95%) */}
                <div className="bg-white dark:bg-gray-800 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    <span className="font-bold text-lg text-yellow-600">
                      {forecast.p95} удаа
                    </span>
                    <span className="text-gray-500">ХАМГИЙН МУУ (95%)</span>
                  </div>
                  <p className="text-sm mt-1">
                    <span className="font-semibold">Энгийнээр:</span> 100
                    арилжаа хийхэд,
                    <span className="font-bold">
                      {" "}
                      100-аас 95 удаа (95%)
                    </span>{" "}
                    энэ тооноос
                    <span className="font-bold text-yellow-600">
                      {" "}
                      хэтрэхгүй
                    </span>
                    .
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    📌 Өөрөөр хэлбэл: Зөвхөн{" "}
                    <span className="font-bold">5% тохиолдолд л</span>{" "}
                    {forecast.p95} удаагаас илүү дараалан алдах болно.
                  </p>
                  <div className="bg-yellow-50 dark:bg-yellow-950 p-2 rounded mt-2">
                    <p className="text-xs">
                      ⚠️ {forecast.p95} удаа дараалан алдахад ={" "}
                      {forecast.p95 && forecast.p95 * 2}%-ийн алдагдал (2% risk)
                    </p>
                  </div>
                </div>

                {/* Хэт муу (99%) */}
                <div className="bg-white dark:bg-gray-800 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔥</span>
                    <span className="font-bold text-lg text-red-600">
                      {forecast.p99} удаа
                    </span>
                    <span className="text-gray-500">ХЭТ МУУ (99%)</span>
                  </div>
                  <p className="text-sm mt-1">
                    <span className="font-semibold">Энгийнээр:</span> 100
                    арилжаа хийхэд,
                    <span className="font-bold">
                      {" "}
                      100-аас 99 удаа (99%)
                    </span>{" "}
                    энэ тооноос
                    <span className="font-bold text-red-600"> хэтрэхгүй</span>.
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    📌 Зөвхөн <span className="font-bold">1% тохиолдолд л</span>{" "}
                    {forecast.p99} удаагаас илүү дараалан алдана. Энэ бол маш
                    ховор тохиолдол!
                  </p>
                  <div className="bg-red-50 dark:bg-red-950 p-2 rounded mt-2">
                    <p className="text-xs">
                      🔥 Хэрэв та энэ хэмжээний алдагдлыг тэсвэрлэж чадвал, 99%
                      тохиолдолд данс чинь хамгаалагдана.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. ЭНГИЙН ТОДОРХОЙЛОЛТ */}
          <div className="pt-2">
            <p className="font-bold text-blue-800 dark:text-blue-200">
              🎯 Дараалсан алдагдал гэж юу вэ?
            </p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Хэдэн арилжаа{" "}
              <span className="font-bold text-red-600">дараалан</span> алдаж
              байгааг хэлнэ.
            </p>
            <div className="mt-2 bg-white dark:bg-gray-800 p-2 rounded">
              <p className="font-mono text-xs">
                📉 Алдагдал → 📉 Алдагдал → 📉 Алдагдал → ✅ Ашиг
              </p>
              <p className="text-xs mt-1">
                👆 Энэ тохиолдолд{" "}
                <span className="font-bold text-red-600">
                  3 удаа дараалан алдсан
                </span>
              </p>
            </div>
          </div>

          {/* 3. ТАНЫ ТООЦОО - ЖИШЭЭ */}
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
            <p className="font-semibold mb-2">💡 Танд хэрхэн ойлгох вэ:</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b pb-1">
                <span>Таны хожих магадлал:</span>
                <span className="font-bold text-green-600">
                  {(winRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>Таны алдах магадлал:</span>
                <span className="font-bold text-red-600">
                  {(lossProb * 100).toFixed(1)}%
                </span>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950 p-2 rounded mt-2">
                <p className="text-center">
                  ⚡ {forecast?.p95 || "?"} удаа дараалан алдахад бэлэн байх
                  хэрэгтэй!
                </p>
              </div>
            </div>
          </div>

          {/* 4. PROP FIRM ЗӨВЛӨМЖ */}
          {forecast && (
            <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
              <p className="font-semibold text-green-800 mb-1">
                🏢 Prop Firm зөвлөмж:
              </p>
              <p className="text-xs">
                Таны хамгийн муу тохиолдол {forecast.p95} удаа дараалан алдах
                боломжтой. Prop firm-ийн drawdown хязгаар 10% бол →{" "}
                <span className="font-bold">нэг арилжаанд 0.7%</span> эрсдэл
                авах
              </p>
              <div className="mt-2 bg-white dark:bg-gray-800 p-2 rounded text-xs">
                <p>
                  📊 Тооцоо: {forecast.p95} удаа × 0.7% ={" "}
                  {(forecast.p95 * 0.7).toFixed(1)}% алдагдал (хязгаарт багтана)
                </p>
              </div>
            </div>
          )}

          {/* 5. ДҮГНЭЛТ */}
          <div className="bg-gray-200 dark:bg-gray-700 p-2 rounded text-center text-xs">
            <p className="font-bold">✅ Үндсэн дүгнэлт:</p>
            <p>
              Таны стратеги {forecast?.expected.toFixed(1) || "?"} удаа дараалан
              алдана. Хамгийн муу тохиолдолд {forecast?.p95 || "?"} удаа. Үүнд
              бэлэн байгаарай!
            </p>
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
      <StreakExplanation
        winRate={winRate}
        lossProb={lossProb}
        forecast={forecast}
      />
    </div>
  );
}
