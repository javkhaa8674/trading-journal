"use client";

import { useMemo } from "react";

type Trade = {
  profit: number;
};

type Props = {
  trades: Trade[];
  initialBalance: number;
  riskPerTrade: number; // % (e.g. 1 = 1%)
  simulations?: number;
  maxTrades?: number;
};

const rand = () => Math.random();

export default function RiskOfRuinCalculator({
  trades,
  initialBalance,
  riskPerTrade,
  simulations = 1000,
  maxTrades = 200,
}: Props) {
  // -----------------------------
  // CORE STATISTICS
  // -----------------------------
  const stats = useMemo(() => {
    const wins = trades.filter((t) => t.profit > 0).length;
    const losses = trades.filter((t) => t.profit <= 0).length;

    const winRate = trades.length ? wins / trades.length : 0.5;

    const avgWin =
      trades.filter((t) => t.profit > 0).reduce((s, t) => s + t.profit, 0) /
      Math.max(1, wins);

    const avgLoss =
      Math.abs(
        trades.filter((t) => t.profit < 0).reduce((s, t) => s + t.profit, 0),
      ) / Math.max(1, losses);

    const rr = avgWin / (avgLoss || 1);

    return { winRate, avgWin, avgLoss, rr };
  }, [trades]);

  // -----------------------------
  // PERCENT-BASED RISK FUNCTION
  // -----------------------------
  const getRiskAmount = (balance: number) => {
    return balance * (riskPerTrade / 100);
  };

  // -----------------------------
  // MONTE CARLO SIMULATION
  // -----------------------------
  const result = useMemo(() => {
    let ruined = 0;

    for (let i = 0; i < simulations; i++) {
      let balance = initialBalance;

      for (let t = 0; t < maxTrades; t++) {
        const isWin = rand() < stats.winRate;

        const riskAmount = getRiskAmount(balance);

        if (isWin) {
          balance += riskAmount * stats.rr; // win scaled by RR
        } else {
          balance -= riskAmount;
        }

        // 💥 RUIN CONDITION
        if (balance <= 0) {
          ruined++;
          break;
        }
      }
    }

    const ruinProbability = (ruined / simulations) * 100;

    return {
      ruinProbability,
      survivalProbability: 100 - ruinProbability,
    };
  }, [stats, initialBalance, riskPerTrade, simulations, maxTrades]);

  // -----------------------------
  // EMPTY STATE
  // -----------------------------
  if (!trades.length) {
    return (
      <div className="p-6 border rounded-lg text-center text-gray-500 dark:bg-gray-900">
        Trade data байхгүй байна
      </div>
    );
  }

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-900">
      {/* HEADER */}
      <h3 className="text-lg font-semibold mb-2">
        Risk of Ruin Calculator (Percent Mode)
      </h3>

      <p className="text-xs text-gray-500 mb-4">
        Энэхүү tool нь таны account balance-ийн хувь (%)-д тулгуурлан урт
        хугацааны дампуурах магадлалыг тооцоолно.
      </p>

      {/* MAIN RESULT */}
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950">
          <p className="text-xs text-gray-500">❌ Risk of Ruin</p>
          <p className="text-2xl font-bold text-red-500">
            {result.ruinProbability.toFixed(2)}%
          </p>
        </div>

        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950">
          <p className="text-xs text-gray-500">🟢 Survival Probability</p>
          <p className="text-2xl font-bold text-green-500">
            {result.survivalProbability.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className="mt-4 grid grid-cols-3 text-center text-xs border-t pt-3">
        <div>
          <p className="text-gray-500">Win Rate</p>
          <p className="font-bold">{(stats.winRate * 100).toFixed(1)}%</p>
        </div>

        <div>
          <p className="text-gray-500">RR</p>
          <p className="font-bold">{stats.rr.toFixed(2)}</p>
        </div>

        <div>
          <p className="text-gray-500">Risk / Trade</p>
          <p className="font-bold">{riskPerTrade}%</p>
        </div>
      </div>

      {/* EXPLANATION */}
      <div className="mt-4 p-3 text-xs bg-blue-50 dark:bg-blue-950 rounded">
        <p className="font-medium text-blue-700 dark:text-blue-300">
          📖 Percent Mode гэж юу вэ?
        </p>

        <p className="text-blue-600 dark:text-blue-400 mt-2">
          👉 Та нэг trade бүр дээр account-ын <b>{riskPerTrade}%</b>-ийг эрсдэлд
          оруулж байна гэсэн үг.
        </p>

        <p className="mt-2 text-blue-600 dark:text-blue-400">
          📊 Жишээ:
          <br />• $10,000 account
          <br />• 1% risk = $100 per trade
          <br />• Account өсөх тусам risk мөн өснө
        </p>

        <p className="mt-2 text-blue-600 dark:text-blue-400">
          ⚠️ Давуу тал:
          <br />
          ✔ Prop firm стандарт
          <br />
          ✔ Dynamic risk scaling
          <br />✔ Capital хамгаалалт хамгийн сайн
        </p>
      </div>
    </div>
  );
}
