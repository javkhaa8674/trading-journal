"use client";

import { useMemo } from "react";
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

  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 p-4 mt-4">
      <h3 className="text-lg font-semibold mb-2">Streak Risk Forecast</h3>

      {/* Histogram */}
      <div className="w-full h-[250px] md:h-[350px]">
        <ResponsiveContainer>
          <BarChart data={histogramData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="streak" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast numbers */}
      {forecast && (
        <div className="grid grid-cols-3 gap-2 text-center mt-4 text-sm">
          <div>
            <p className="text-gray-500">Expected</p>
            <p className="font-bold">{forecast.expected.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-gray-500">Worst (95%)</p>
            <p className="font-bold text-yellow-500">{forecast.p95}</p>
          </div>
          <div>
            <p className="text-gray-500">Extreme (99%)</p>
            <p className="font-bold text-red-500">{forecast.p99}</p>
          </div>
        </div>
      )}

      {/* Probability table */}
      <div className="mt-4 text-xs border-t pt-3">
        <p className="font-medium mb-2">Магадлал:</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[3, 5, 7].map((n) => (
            <div key={n}>
              <p>{n} losses</p>
              <p className="font-bold">
                {(probabilityOfN(n) * 100).toFixed(2)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 rounded text-xs">
        <p className="font-medium text-red-700 dark:text-red-300">📖 Тайлбар</p>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Энэ хэрэгсэл нь ирээдүйн хамгийн муу дараалсан хожигдолыг таамаглаж,
          эрсдлийн менежмент болон лотын хэмжээг зөв тохируулахад ашиглагдана.{" "}
          <br />
          <br />
          <b>Expected:</b> Бүх симуляцид гарсан max loss streak-ийн дундаж.
          <br />
          <b>Worst (95%):</b> 100 симуляцид 95%-д үүнээс бага эсвэл тэнцүү max
          streak гарна.
          <br />
          <b>Extreme (99%):</b> симуляцийн 99%-д энэ утгаас доогуур max streak
          гарна.
          <br />
          <br />
          <b>Дараалласан алдагдлын магадлал:</b>
          <br />
          3 loss = XX.XX% <br />
          5 loss = XX.XX%
          <br />
          7 loss = XX.XX%
          <br />
          <br />
          Эдгээр үзүүлэлтүүд нь дараалласан алдагдал зайлшгүй тохиолддог гэдгийг
          харуулж, лотын хэмжээ болон эрсдэлийн менежментийг зөв хийхэд
          ашиглагдана.
        </p>
      </div>
    </div>
  );
}
