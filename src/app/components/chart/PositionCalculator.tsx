"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";

interface PositionCalculatorProps {
  symbol?: string;
  onPositionChange?: (data: {
    entry: number;
    tp: number;
    sl: number;
    lotSize: number;
    risk: number;
    reward: number;
    rrRatio: number;
  }) => void;
  defaultVisible?: boolean;
}

export default function PositionCalculator({
  symbol = "XAUUSD",
  onPositionChange,
  defaultVisible = true,
}: PositionCalculatorProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = resolvedTheme === "dark";

  // State
  const [entry, setEntry] = useState<number>(4100.0);
  const [tp, setTp] = useState<number>(4120.0);
  const [sl, setSl] = useState<number>(4080.0);
  const [accountBalance, setAccountBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(2);
  const [lotSize, setLotSize] = useState<number>(0.01);
  const [pipValue, setPipValue] = useState<number>(1.0);
  const [contractSize, setContractSize] = useState<number>(100);
  const [isLong, setIsLong] = useState<boolean>(true);

  // Calculated values
  const [riskAmount, setRiskAmount] = useState<number>(0);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [rrRatio, setRrRatio] = useState<number>(0);
  const [tpDistance, setTpDistance] = useState<number>(0);
  const [slDistance, setSlDistance] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate position size
  useEffect(() => {
    const slPips = isLong ? entry - sl : sl - entry;
    const tpPips = isLong ? tp - entry : entry - tp;

    setSlDistance(Math.abs(slPips));
    setTpDistance(Math.abs(tpPips));

    const risk = (accountBalance * riskPercent) / 100;
    setRiskAmount(risk);

    if (slPips > 0 && pipValue > 0) {
      const calculatedLot = risk / (Math.abs(slPips) * pipValue * contractSize);
      setLotSize(Math.round(calculatedLot * 100) / 100);
    }

    const reward = tpPips * pipValue * lotSize * contractSize;
    setRewardAmount(Math.round(reward * 100) / 100);

    if (riskAmount > 0) {
      const ratio = reward / riskAmount;
      setRrRatio(Math.round(ratio * 100) / 100);
    }

    if (onPositionChange) {
      onPositionChange({
        entry: Math.round(entry * 100) / 100,
        tp: Math.round(tp * 100) / 100,
        sl: Math.round(sl * 100) / 100,
        lotSize: Math.round(lotSize * 100) / 100,
        risk: Math.round(risk * 100) / 100,
        reward: Math.round(reward * 100) / 100,
        rrRatio: Math.round(rrRatio * 100) / 100,
      });
    }
  }, [
    entry,
    tp,
    sl,
    accountBalance,
    riskPercent,
    pipValue,
    contractSize,
    isLong,
    lotSize,
  ]);

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  const handlePriceChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: number) => void,
  ) => {
    const rawValue = parseFloat(e.target.value);
    if (!isNaN(rawValue)) {
      setter(Math.round(rawValue * 100) / 100);
    } else {
      setter(0);
    }
  };

  if (!mounted) {
    return null;
  }

  const colors = {
    bg: isDark ? "bg-gray-800" : "bg-white",
    bgHover: isDark ? "hover:bg-gray-700" : "hover:bg-gray-50",
    border: isDark ? "border-gray-700" : "border-gray-200",
    text: isDark ? "text-gray-200" : "text-gray-800",
    textMuted: isDark ? "text-gray-400" : "text-gray-500",
    input: isDark
      ? "bg-gray-700 border-gray-600 text-white"
      : "bg-gray-50 border-gray-300 text-gray-900",
    inputFocus: isDark
      ? "focus:ring-blue-500 focus:border-blue-500"
      : "focus:ring-blue-500 focus:border-blue-500",
    label: isDark ? "text-gray-300" : "text-gray-700",
    gold: "text-yellow-500",
  };

  return (
    <div className="h-full w-full overflow-y-auto p-3 space-y-3">
      {/* Header */}
      <div
        className={`flex items-center justify-between border-b ${colors.border} pb-2`}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">📐 Position Calculator</span>
          <span className={`text-xs ${colors.textMuted}`}>{symbol}</span>
        </div>
      </div>

      {/* Direction Toggle */}
      <div
        className={`flex rounded-lg overflow-hidden border ${colors.border}`}
      >
        <button
          onClick={() => setIsLong(true)}
          className={`
            flex-1 py-1.5 text-sm font-medium transition-colors
            ${
              isLong
                ? "bg-green-500 text-white"
                : `${colors.textMuted} ${colors.bgHover}`
            }
          `}
        >
          📈 Long
        </button>
        <button
          onClick={() => setIsLong(false)}
          className={`
            flex-1 py-1.5 text-sm font-medium transition-colors
            ${
              !isLong
                ? "bg-red-500 text-white"
                : `${colors.textMuted} ${colors.bgHover}`
            }
          `}
        >
          📉 Short
        </button>
      </div>

      {/* Input Fields */}
      <div className="space-y-2">
        <div>
          <label className={`block text-xs font-medium ${colors.label} mb-0.5`}>
            Entry Price
          </label>
          <input
            type="number"
            value={entry}
            onChange={(e) => handlePriceChange(e, setEntry)}
            step="0.01"
            className={`
              w-full px-2.5 py-1.5 rounded-lg border text-sm 
              ${colors.input} ${colors.inputFocus}
              focus:outline-none focus:ring-2
            `}
          />
        </div>

        <div>
          <label className={`block text-xs font-medium ${colors.label} mb-0.5`}>
            <span className="text-green-500">●</span> Take Profit (TP)
          </label>
          <input
            type="number"
            value={tp}
            onChange={(e) => handlePriceChange(e, setTp)}
            step="0.01"
            className={`
              w-full px-2.5 py-1.5 rounded-lg border text-sm 
              ${colors.input} ${colors.inputFocus}
              focus:outline-none focus:ring-2
            `}
          />
        </div>

        <div>
          <label className={`block text-xs font-medium ${colors.label} mb-0.5`}>
            <span className="text-red-500">●</span> Stop Loss (SL)
          </label>
          <input
            type="number"
            value={sl}
            onChange={(e) => handlePriceChange(e, setSl)}
            step="0.01"
            className={`
              w-full px-2.5 py-1.5 rounded-lg border text-sm 
              ${colors.input} ${colors.inputFocus}
              focus:outline-none focus:ring-2
            `}
          />
        </div>

        <div className={`border-t ${colors.border} my-1.5`} />

        <div>
          <label className={`block text-xs font-medium ${colors.label} mb-0.5`}>
            Account Balance
          </label>
          <input
            type="number"
            value={accountBalance}
            onChange={(e) => setAccountBalance(parseFloat(e.target.value) || 0)}
            step="100"
            className={`
              w-full px-2.5 py-1.5 rounded-lg border text-sm 
              ${colors.input} ${colors.inputFocus}
              focus:outline-none focus:ring-2
            `}
          />
        </div>

        <div>
          <label className={`block text-xs font-medium ${colors.label} mb-0.5`}>
            Risk per Trade (%)
          </label>
          <input
            type="number"
            value={riskPercent}
            onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 0)}
            step="0.5"
            min="0.1"
            max="10"
            className={`
              w-full px-2.5 py-1.5 rounded-lg border text-sm 
              ${colors.input} ${colors.inputFocus}
              focus:outline-none focus:ring-2
            `}
          />
        </div>

        <div className="flex gap-1">
          {[1, 2, 3, 5].map((risk) => (
            <button
              key={risk}
              onClick={() => setRiskPercent(risk)}
              className={`
                flex-1 py-1 text-xs rounded-lg border 
                ${colors.border} ${colors.textMuted} 
                ${colors.bgHover} transition-colors
                ${riskPercent === risk ? (isDark ? "bg-gray-600" : "bg-gray-200") : ""}
              `}
            >
              {risk}%
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label
              className={`block text-xs font-medium ${colors.label} mb-0.5`}
            >
              Pip Value
            </label>
            <input
              type="number"
              value={pipValue}
              onChange={(e) => setPipValue(parseFloat(e.target.value) || 0)}
              step="0.1"
              className={`
                w-full px-2.5 py-1.5 rounded-lg border text-sm 
                ${colors.input} ${colors.inputFocus}
                focus:outline-none focus:ring-2
              `}
            />
          </div>
          <div>
            <label
              className={`block text-xs font-medium ${colors.label} mb-0.5`}
            >
              Contract Size
            </label>
            <input
              type="number"
              value={contractSize}
              onChange={(e) => setContractSize(parseFloat(e.target.value) || 0)}
              step="10"
              className={`
                w-full px-2.5 py-1.5 rounded-lg border text-sm 
                ${colors.input} ${colors.inputFocus}
                focus:outline-none focus:ring-2
              `}
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div
        className={`p-2.5 rounded-lg ${isDark ? "bg-gray-700/50" : "bg-gray-50"} border ${colors.border}`}
      >
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <div className={`text-xs ${colors.textMuted}`}>Entry</div>
            <div className={`text-sm font-bold text-yellow-400`}>
              {entry.toFixed(2)}
            </div>
          </div>
          <div>
            <div className={`text-xs ${colors.textMuted}`}>TP</div>
            <div className={`text-sm font-bold text-green-500`}>
              {tp.toFixed(2)}
            </div>
          </div>
          <div>
            <div className={`text-xs ${colors.textMuted}`}>SL</div>
            <div className={`text-sm font-bold text-red-500`}>
              {sl.toFixed(2)}
            </div>
          </div>
          <div>
            <div className={`text-xs ${colors.textMuted}`}>Lot Size</div>
            <div className={`text-sm font-bold ${colors.gold}`}>
              {lotSize.toFixed(2)}
            </div>
          </div>
          <div>
            <div className={`text-xs ${colors.textMuted}`}>R:R Ratio</div>
            <div
              className={`text-sm font-bold ${
                rrRatio >= 2
                  ? "text-green-500"
                  : rrRatio >= 1
                    ? "text-yellow-500"
                    : "text-red-500"
              }`}
            >
              {rrRatio.toFixed(2)}
            </div>
          </div>
          <div>
            <div className={`text-xs ${colors.textMuted}`}>Risk</div>
            <div className={`text-sm font-semibold text-red-500`}>
              {formatCurrency(riskAmount)}
            </div>
          </div>
          <div>
            <div className={`text-xs ${colors.textMuted}`}>Reward</div>
            <div className={`text-sm font-semibold text-green-500`}>
              {formatCurrency(rewardAmount)}
            </div>
          </div>
          <div>
            <div className={`text-xs ${colors.textMuted}`}>SL Distance</div>
            <div className={`text-sm font-semibold ${colors.text}`}>
              {slDistance.toFixed(2)} pips
            </div>
          </div>
          <div>
            <div className={`text-xs ${colors.textMuted}`}>TP Distance</div>
            <div className={`text-sm font-semibold ${colors.text}`}>
              {tpDistance.toFixed(2)} pips
            </div>
          </div>
        </div>
      </div>

      {/* Symbol info */}
      <div
        className={`text-xs ${colors.textMuted} text-center border-t ${colors.border} pt-1.5`}
      >
        <span className="font-mono">{symbol}</span>
        <span className="mx-2">•</span>
        <span>1 pip = ${(pipValue * contractSize).toFixed(2)}</span>
        <span className="mx-2">•</span>
        <span>{isLong ? "Long" : "Short"}</span>
      </div>
    </div>
  );
}
