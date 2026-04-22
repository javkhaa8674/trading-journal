"use client";

import { useMemo } from "react";
import { Trade } from "@/types/trade";
import { metricsHelp } from "@/lib/constants/metricsHelp";
import { HelpTooltip } from "./HelpTooltip";

type RiskData = {
  dailyLossPercent?: number;
  totalDrawdown?: number;
  dailyBreached?: boolean;
  totalBreached?: boolean;
  startingBalance?: number;
  currentBalance?: number;
};

type RiskPanelProps = {
  data?: RiskData | Trade[];
  startingBalance?: number;
};

export default function RiskPanel({
  data,
  startingBalance = 10000,
}: RiskPanelProps) {
  // Calculate risk metrics from trades if array is passed
  const riskMetrics = useMemo(() => {
    // If data is already RiskData object
    if (data && !Array.isArray(data)) {
      return {
        dailyLossPercent: data.dailyLossPercent ?? 0,
        totalDrawdown: data.totalDrawdown ?? 0,
        dailyBreached: data.dailyBreached ?? false,
        totalBreached: data.totalBreached ?? false,
        startingBalance: data.startingBalance ?? startingBalance,
        currentBalance: data.currentBalance ?? startingBalance,
      };
    }

    // If data is Trade array, calculate metrics
    if (data && Array.isArray(data) && data.length > 0) {
      const trades = data as Trade[];

      // Calculate today's P&L
      const now = new Date();
      const todayDateString = now.toDateString();

      const todayTrades = trades.filter((trade) => {
        if (!trade.close_time) return false;
        try {
          const closeDate = new Date(trade.close_time);
          return closeDate.toDateString() === todayDateString;
        } catch {
          return false;
        }
      });

      const todayPnL = todayTrades.reduce(
        (sum, trade) => sum + (trade.profit || 0),
        0,
      );
      const dailyLossPercent = (todayPnL / startingBalance) * 100;

      // Calculate total drawdown
      let peak = startingBalance;
      let currentBalance = startingBalance;
      let maxDrawdown = 0;

      // Sort trades by date
      const sortedTrades = [...trades].sort((a, b) => {
        const timeA = a.close_time ? new Date(a.close_time).getTime() : 0;
        const timeB = b.close_time ? new Date(b.close_time).getTime() : 0;
        return timeA - timeB;
      });

      for (const trade of sortedTrades) {
        currentBalance += trade.profit || 0;
        if (currentBalance > peak) {
          peak = currentBalance;
        }
        const drawdown = ((peak - currentBalance) / peak) * 100;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      }

      return {
        dailyLossPercent: Number(dailyLossPercent.toFixed(2)),
        totalDrawdown: Number(maxDrawdown.toFixed(2)),
        dailyBreached: dailyLossPercent <= -5, // -5% or worse
        totalBreached: maxDrawdown >= 10, // 10% or more drawdown
        startingBalance: startingBalance,
        currentBalance: currentBalance,
      };
    }

    // Default values
    return {
      dailyLossPercent: 0,
      totalDrawdown: 0,
      dailyBreached: false,
      totalBreached: false,
      startingBalance: startingBalance,
      currentBalance: startingBalance,
    };
  }, [data, startingBalance]);

  const dailyLoss = riskMetrics.dailyLossPercent;
  const totalDrawdown = riskMetrics.totalDrawdown;

  // Check if any limit is breached
  const isDailyBreached = dailyLoss <= -5;
  const isTotalBreached = totalDrawdown >= 10;

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800">
        <p className="text-gray-500 text-center">No trading data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Prop Firm Challenge Status */}
      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 text-center">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
          🏆 Prop Firm Challenge Rules
        </p>
        <div className="flex justify-center gap-4 mt-1 text-xs text-blue-600 dark:text-blue-400">
          <span>Daily Loss Limit: -5%</span>
          <span>Total Drawdown Limit: -10%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 📉 Daily Loss */}

        <div
          className={`p-4 rounded-xl text-white transition-all ${
            isDailyBreached ? "bg-red-600" : "bg-green-600"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium opacity-90">Daily Loss</h3>{" "}
              <HelpTooltip
                title={metricsHelp.dailyLossLimit.title}
                description={metricsHelp.dailyLossLimit.description}
              />
            </div>
            <span className="text-lg">📉</span>
          </div>
          <p className="text-2xl font-bold mt-2">{dailyLoss.toFixed(2)}%</p>
          <p className="text-xs opacity-80 mt-1">Limit: -5%</p>
          {isDailyBreached ? (
            <p className="text-xs mt-2 font-medium">
              ❌ CHALLENGE FAILED! Daily limit exceeded.
            </p>
          ) : (
            <p className="text-xs mt-2 font-medium opacity-80">
              ✅ Within limit
            </p>
          )}
        </div>

        {/* 📊 Total Drawdown */}
        <div
          className={`p-4 rounded-xl text-white transition-all ${
            isTotalBreached ? "bg-red-600" : "bg-green-600"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium opacity-90">Total Drawdown</h3>
              <HelpTooltip
                title={metricsHelp.totalLossLimit.title}
                description={metricsHelp.totalLossLimit.description}
              />
            </div>
            <span className="text-lg">📊</span>
          </div>
          <p className="text-2xl font-bold mt-2">{totalDrawdown.toFixed(2)}%</p>
          <p className="text-xs opacity-80 mt-1">Limit: -10%</p>
          {isTotalBreached ? (
            <p className="text-xs mt-2 font-medium">
              ❌ CHALLENGE FAILED! Drawdown limit exceeded.
            </p>
          ) : (
            <p className="text-xs mt-2 font-medium opacity-80">
              ✅ Within limit
            </p>
          )}
        </div>
      </div>

      {/* Challenge Status Summary */}
      {(isDailyBreached || isTotalBreached) && (
        <div className="p-3 rounded-lg bg-red-100 dark:bg-red-950 text-center">
          <p className="text-sm font-bold text-red-800 dark:text-red-300">
            ⚠️ PROP FIRM CHALLENGE FAILED!
          </p>
          <p className="text-xs text-red-700 dark:text-red-400 mt-1">
            {isDailyBreached && "Daily loss limit (-5%) exceeded. "}
            {isTotalBreached && "Total drawdown limit (-10%) exceeded."}
          </p>
        </div>
      )}

      {!isDailyBreached && !isTotalBreached && (
        <div className="p-3 rounded-lg bg-green-100 dark:bg-green-950 text-center">
          <p className="text-sm font-bold text-green-800 dark:text-green-300">
            ✅ PROP FIRM CHALLENGE ACTIVE
          </p>
          <p className="text-xs text-green-700 dark:text-green-400 mt-1">
            Both daily loss and total drawdown limits are within range.
          </p>
        </div>
      )}
    </div>
  );
}
