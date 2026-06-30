"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { instruments } from "@/types/instrument";
import { calcLotSize, calcRR } from "@/lib/trading/engine";

export default function PositionCalculator({ symbol }: { symbol: string }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const instrument =
    instruments.find((i) => i.symbol === symbol) || instruments[0];

  // ================= INPUTS =================
  const [entry, setEntry] = useState<string>("");
  const [tp, setTp] = useState<string>("");
  const [sl, setSl] = useState<string>("");

  const [balance, setBalance] = useState<string>("50000");
  const [riskPercent, setRiskPercent] = useState<string>("1");

  const [isLong, setIsLong] = useState(true);

  // ================= OUTPUTS =================
  const [lot, setLot] = useState(0);
  const [risk, setRisk] = useState(0);
  const [reward, setReward] = useState(0);
  const [rr, setRr] = useState(0);

  const [slDist, setSlDist] = useState(0);
  const [tpDist, setTpDist] = useState(0);

  const toNumber = (v: string) => {
    const n = parseFloat(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  useEffect(() => {
    const entryNum = toNumber(entry);
    const tpNum = toNumber(tp);
    const slNum = toNumber(sl);
    const balanceNum = toNumber(balance);
    const riskPercentNum = toNumber(riskPercent);

    if (!entryNum || !tpNum || !slNum) return;

    const slRaw = isLong ? entryNum - slNum : slNum - entryNum;
    const tpRaw = isLong ? tpNum - entryNum : entryNum - tpNum;

    const slAbs = Math.abs(slRaw);
    const tpAbs = Math.abs(tpRaw);

    setSlDist(slAbs);
    setTpDist(tpAbs);

    const riskValue = (balanceNum * riskPercentNum) / 100;

    const lotSize = calcLotSize(riskValue, slAbs, instrument) || 0;

    const rewardValue =
      (tpAbs / instrument.tickSize) * instrument.tickValue * lotSize;

    const rrValue = calcRR(entryNum, tpNum, slNum) || 0;

    setRisk(riskValue);
    setLot(Number(lotSize.toFixed(2)));
    setReward(Number(rewardValue.toFixed(2)));
    setRr(Number(rrValue.toFixed(2)));
  }, [entry, tp, sl, balance, riskPercent, instrument, isLong]);

  // ================= STYLE =================
  const input =
    "w-full px-3 py-2 rounded-lg border text-sm outline-none transition " +
    (isDark
      ? "bg-gray-800 text-white border-gray-700 focus:border-blue-500"
      : "bg-white text-gray-900 border-gray-200 focus:border-blue-500");

  const card =
    "rounded-xl border p-3 space-y-3 " +
    (isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200");

  return (
    <div className="w-[280px] h-full p-3 overflow-y-auto space-y-3">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="text-sm font-semibold">📐 Position Calculator</div>
        <div className="text-xs opacity-60">{symbol}</div>
      </div>

      {/* LONG / SHORT */}
      <div className="flex rounded-lg overflow-hidden border">
        <button
          onClick={() => setIsLong(true)}
          className={`flex-1 py-2 text-sm font-medium transition ${
            isLong
              ? "bg-green-500 text-white"
              : isDark
                ? "bg-gray-800 text-gray-300"
                : "bg-gray-100 text-gray-600"
          }`}
        >
          📈 Long
        </button>

        <button
          onClick={() => setIsLong(false)}
          className={`flex-1 py-2 text-sm font-medium transition ${
            !isLong
              ? "bg-red-500 text-white"
              : isDark
                ? "bg-gray-800 text-gray-300"
                : "bg-gray-100 text-gray-600"
          }`}
        >
          📉 Short
        </button>
      </div>

      {/* INPUTS */}
      <div className="space-y-2">
        <input
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          className={input}
          placeholder="Entry"
        />
        <input
          value={sl}
          onChange={(e) => setSl(e.target.value)}
          className={input}
          placeholder="SL"
        />
        <input
          value={tp}
          onChange={(e) => setTp(e.target.value)}
          className={input}
          placeholder="TP"
        />

        <div className="grid grid-cols-2 gap-2">
          <input
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className={input}
            placeholder="Balance"
          />
          <input
            value={riskPercent}
            onChange={(e) => setRiskPercent(e.target.value)}
            className={input}
            placeholder="Risk %"
          />
        </div>
      </div>

      {/* RESULTS */}
      <div className={card}>
        <div className="flex justify-between">
          <span className="text-sm opacity-70">Lot Size</span>
          <b className="text-yellow-500">{lot}</b>
        </div>

        <div className="flex justify-between">
          <span className="text-sm opacity-70">Risk</span>
          <b className="text-red-500">${risk.toFixed(2)}</b>
        </div>

        <div className="flex justify-between">
          <span className="text-sm opacity-70">Reward</span>
          <b className="text-green-500">${reward.toFixed(2)}</b>
        </div>

        <div className="flex justify-between">
          <span className="text-sm opacity-70">R:R</span>
          <b
            className={
              rr >= 2
                ? "text-green-500"
                : rr >= 1
                  ? "text-yellow-500"
                  : "text-red-500"
            }
          >
            {rr}
          </b>
        </div>

        <div className="text-xs opacity-60 border-t pt-2">
          SL: {slDist.toFixed(2)} | TP: {tpDist.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
