"use client";

import { useState, useMemo } from "react";

type Trade = {
  profit: number;
};

type Props = {
  trades: Trade[];
  initialBalance: number;
  riskPerTrade: number; // % (e.g. 1 = 1%)
  simulations?: number;
  maxTrades?: number;
  ruinThreshold?: number; // НЭМЭЛТ: Хэзээ "дампуурсан" гэж үзэх
};

const rand = () => Math.random();

function ExpandableExplanation({
  riskPerTrade,
  ruinThreshold,
  initialBalance,
}: {
  riskPerTrade: number;
  ruinThreshold: number;
  initialBalance: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-4 border rounded-lg bg-blue-50 dark:bg-blue-950 overflow-hidden">
      {/* Header Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex justify-between items-center hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📖</span>
          <span className="font-semibold text-sm">Risk of Ruin гэж юу вэ?</span>
        </div>
        {isOpen ? (
          <span className="text-xl dark:text-white">▶</span>
        ) : (
          <span className="text-xl dark:text-white">▼</span>
        )}
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-3 text-sm border-t border-blue-200 dark:border-blue-800">
          {/* Short definition */}
          <div className="pt-3">
            <p className="font-medium text-blue-800 dark:text-blue-200">
              🎯 Таны хөрөнгө {ruinThreshold * 100}% хүртэл буурах магадлал
            </p>
            <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
              {initialBalance.toLocaleString()}$ →{" "}
              {(initialBalance * ruinThreshold).toLocaleString()}$
            </p>
          </div>

          {/* How it works - 3 steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <div className="bg-white dark:bg-gray-800 p-2 rounded">
              <span className="font-bold text-blue-600">1. Monte Carlo</span>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Таны win rate, RR ашиглан 1000 удаагийн боломжит хувилбар
                simulate хийдэг
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-2 rounded">
              <span className="font-bold text-blue-600">2. Percent Risk</span>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Trade бүрт балансын {riskPerTrade}% эрсдэлд оруулна
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-2 rounded">
              <span className="font-bold text-blue-600">3. Ruin Check</span>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Balance {ruinThreshold * 100}% доош буувал
                &quot;дампуурсан&quot; гэж тооцно
              </p>
            </div>
          </div>

          {/* Result interpretation */}
          <div className="bg-yellow-50 dark:bg-yellow-950 p-2 rounded text-xs">
            <p className="font-semibold text-yellow-800 dark:text-yellow-200">
              📊 Үр дүнг хэрхэн ойлгох вэ?
            </p>
            <div className="mt-1 space-y-1 text-yellow-700 dark:text-yellow-300">
              <p>✅ &lt; 5%: Аюулгүй (prop firm standard)</p>
              <p>⚠️ 5-20%: Эрсдэлтэй (стратегиа шалгах хэрэгтэй)</p>
              <p>❌ &gt; 20%: Хэт эрсдэлтэй (рискээ багасгах)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function RiskOfRuinCalculator({
  trades,
  initialBalance,
  riskPerTrade,
  simulations = 1000,
  maxTrades = 200,
  ruinThreshold = 0.5, // Анхны балансын 50% алдвал дампуурсан гэж үзэх
}: Props) {
  // -----------------------------
  // CORE STATISTICS
  // -----------------------------
  const stats = useMemo(() => {
    if (!trades.length) {
      return { winRate: 0.5, avgWin: 0, avgLoss: 0, rr: 1 };
    }

    const wins = trades.filter((t) => t.profit > 0);
    const losses = trades.filter((t) => t.profit <= 0);

    const winRate = trades.length ? wins.length / trades.length : 0.5;

    const avgWin = wins.length
      ? wins.reduce((s, t) => s + t.profit, 0) / wins.length
      : 1; // Default if no wins

    const avgLoss = losses.length
      ? Math.abs(losses.reduce((s, t) => s + t.profit, 0)) / losses.length
      : 1; // Default if no losses

    const rr = avgLoss ? avgWin / avgLoss : 1;

    return { winRate, avgWin, avgLoss, rr };
  }, [trades]);

  // -----------------------------
  // PERCENT-BASED RISK FUNCTION
  // -----------------------------
  const getRiskAmount = (balance: number) => {
    return balance * (riskPerTrade / 100);
  };

  // -----------------------------
  // MONTE CARLO SIMULATION (FIXED)
  // -----------------------------
  const result = useMemo(() => {
    if (!trades.length || stats.winRate === 0 || stats.rr === 0) {
      return { ruinProbability: 0, survivalProbability: 100 };
    }

    let ruined = 0;
    const ruinBalance = initialBalance * ruinThreshold; // Жишээ: $10,000 → $5,000

    for (let i = 0; i < simulations; i++) {
      let balance = initialBalance;

      for (let t = 0; t < maxTrades; t++) {
        const isWin = rand() < stats.winRate;
        const riskAmount = getRiskAmount(balance);

        // Хэтэрхий жижиг balance үед trade хийхээ болих
        if (riskAmount < 1 || balance < ruinBalance) {
          if (balance < ruinBalance) ruined++;
          break;
        }

        if (isWin) {
          balance += riskAmount * stats.rr;
        } else {
          balance -= riskAmount;
        }

        // 💥 RUIN CONDITION (FIXED)
        if (balance <= ruinBalance) {
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
  }, [
    stats,
    initialBalance,
    riskPerTrade,
    simulations,
    maxTrades,
    ruinThreshold,
  ]);

  // -----------------------------
  // WARNING MESSAGES
  // -----------------------------
  const warnings = useMemo(() => {
    const msgs = [];

    if (stats.winRate < 0.3) {
      msgs.push(`⚠ WinRate хэт бага (${(stats.winRate * 100).toFixed(1)}%)`);
    }

    if (stats.rr < 1) {
      msgs.push(`⚠ RR хэт бага (${stats.rr.toFixed(2)})`);
    }

    if (riskPerTrade > 2) {
      msgs.push(`⚠ Нэг trade-д ${riskPerTrade}% эрсдэл их байна`);
    }

    return msgs;
  }, [stats, riskPerTrade]);

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
        📉 Risk of Ruin Calculator (Percent Mode)
      </h3>

      <p className="text-xs text-gray-500 mb-4">
        {riskPerTrade}% risk per trade, {simulations.toLocaleString()} Monte
        Carlo simulations
      </p>

      {/* WARNINGS */}
      {warnings.length > 0 && (
        <div className="mb-4 p-2 bg-yellow-50 dark:bg-yellow-950 rounded text-xs">
          {warnings.map((w, i) => (
            <p key={i} className="text-yellow-700 dark:text-yellow-300">
              {w}
            </p>
          ))}
        </div>
      )}

      {/* MAIN RESULT */}
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950">
          <p className="text-xs text-gray-500">❌ Risk of Ruin</p>
          <p className="text-2xl font-bold text-red-500">
            {result.ruinProbability > 0.01
              ? result.ruinProbability.toFixed(2)
              : "< 0.01"}
            %
          </p>
        </div>

        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950">
          <p className="text-xs text-gray-500">🟢 Survival Probability</p>
          <p className="text-2xl font-bold text-green-500">
            {result.survivalProbability > 99.99
              ? "> 99.99"
              : result.survivalProbability.toFixed(2)}
            %
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
          <p className="text-gray-500">Avg Win</p>
          <p className="font-bold">${stats.avgWin.toFixed(2)}</p>
        </div>

        <div>
          <p className="text-gray-500">Avg Loss</p>
          <p className="font-bold">${stats.avgLoss.toFixed(2)}</p>
        </div>

        <div>
          <p className="text-gray-500">Risk/Reward</p>
          <p className="font-bold">{stats.rr.toFixed(2)}</p>
        </div>

        <div>
          <p className="text-gray-500">Risk / Trade</p>
          <p className="font-bold">{riskPerTrade}%</p>
        </div>

        <div>
          <p className="text-gray-500">Ruin Threshold</p>
          <p className="font-bold">{ruinThreshold * 100}%</p>
        </div>
      </div>

      {/* EXPLANATION */}
      <ExpandableExplanation
        riskPerTrade={riskPerTrade}
        ruinThreshold={ruinThreshold}
        initialBalance={initialBalance}
      />
    </div>
  );
}
