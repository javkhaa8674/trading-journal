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
} from "recharts";
import { Trade } from "@/types/trade";

type Props = {
  trades: Trade[];
  simulations?: number;
  futureTrades?: number;
  initialBalance?: number;
};

type CurvePoint = {
  step: number;
  p50: number;
  p95: number;
  worst: number;
};

export function MonteCarloEquityChart({
  trades,
  simulations = 300,
  futureTrades = 100,
  initialBalance = 5000,
}: Props) {
  // -----------------------------
  // PREP DATA (REAL DISTRIBUTION)
  // -----------------------------
  const profits = useMemo(() => {
    return trades
      .map((t) => t.profit)
      .filter((p) => Number.isFinite(p));
  }, [trades]);

  // хамгаалалт
  if (!profits.length) {
    return (
      <div className="p-6 border rounded-lg text-center text-gray-500 dark:bg-gray-900">
        No valid trade data
      </div>
    );
  }

  // -----------------------------
  // MONTE CARLO (REAL SAMPLING)
  // -----------------------------
  const data: CurvePoint[] = useMemo(() => {
    const allPaths: number[][] = [];

    for (let i = 0; i < simulations; i++) {
      let balance = initialBalance;
      const path: number[] = [];

      for (let t = 0; t < futureTrades; t++) {
        const randomTrade =
          profits[Math.floor(Math.random() * profits.length)];

        balance += randomTrade;
        path.push(balance);
      }

      allPaths.push(path);
    }

    const result: CurvePoint[] = [];

    for (let i = 0; i < futureTrades; i++) {
      const values = allPaths
        .map((p) => p[i])
        .sort((a, b) => a - b);

      const p50 = values[Math.floor(values.length * 0.5)];
      const p95 = values[Math.floor(values.length * 0.95)];
      const worst = values[0];

      result.push({
        step: i + 1,
        p50,
        p95,
        worst,
      });
    }

    return result;
  }, [profits, simulations, futureTrades, initialBalance]);

  // -----------------------------
  // SIMPLE STATS (UI ONLY)
  // -----------------------------
  const totalTrades = profits.length;
  const wins = profits.filter((p) => p > 0);
  const losses = profits.filter((p) => p < 0);

  const winRate = wins.length / totalTrades;

  const avgWin =
    wins.reduce((a, b) => a + b, 0) / Math.max(1, wins.length);

  const avgLoss =
    Math.abs(
      losses.reduce((a, b) => a + b, 0),
    ) / Math.max(1, losses.length);

  const rr = avgWin / (avgLoss || 1);

  // -----------------------------
  // TOOLTIP
  // -----------------------------
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;

      return (
        <div className="bg-white dark:bg-gray-800 border rounded-lg shadow p-2 text-xs">
          <p className="font-semibold">Step {d.step}</p>
          <p className="text-yellow-500">p95: ${d.p95.toFixed(0)}</p>
          <p className="text-green-500">p50: ${d.p50.toFixed(0)}</p>
          <p className="text-red-500">worst: ${d.worst.toFixed(0)}</p>
        </div>
      );
    }
    return null;
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-900">
      <div className="mb-3">
        <h3 className="text-lg font-semibold">
          Monte Carlo Equity Forecast
        </h3>
        <p className="text-xs text-gray-500">
          Бодит trade distribution дээр үндэслэсэн симуляци
        </p>
      </div>

      <div className="w-full h-[350px] md:h-[450px]">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="step" tick={{ fontSize: 11 }} />

            <YAxis
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              width={60}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend />

            <Line
              type="monotone"
              dataKey="p50"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              name="Дундаж (p50)"
            />

            <Line
              type="monotone"
              dataKey="p95"
              stroke="#eab308"
              strokeWidth={2}
              dot={false}
              name="Сайн (p95)"
            />

            <Line
              type="monotone"
              dataKey="worst"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="Муу"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 text-center text-xs mt-3 border-t pt-3">
        <div>
          <p className="text-gray-500">Win Rate</p>
          <p className="font-bold">{(winRate * 100).toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-gray-500">Avg RR</p>
          <p className="font-bold">{rr.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-500">Trades</p>
          <p className="font-bold">{totalTrades}</p>
        </div>
      </div>

      <div className="mt-3 p-3 text-xs bg-blue-50 dark:bg-blue-950 rounded">
        <p className="font-medium text-blue-700 dark:text-blue-300">
          📊 Тайлбар
        </p>
        <p className="text-blue-600 dark:text-blue-400">
          Энэ нь historical trade-уудыг random байдлаар давтан ашиглаж
          ирээдүйн equity-ийн боломжит хувилбаруудыг харуулж байна.
        </p>
      </div>
    </div>
  );
}