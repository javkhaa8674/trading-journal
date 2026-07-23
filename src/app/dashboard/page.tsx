"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";

import { DateRangeFilter } from "@/app/components/dashboard/DateRangeFilter";
import DashboardStats from "@/app/components/dashboard/DashboardStats";
import EquityCurveChart from "@/app/components/dashboard/EquityCurveChart";
import EquityDrawdownChart from "@/app/components/dashboard/EquityDrawdownChart";
import RiskPanel from "@/app/components/dashboard/RiskPanel";
import { KeyMetricsCards } from "@/app/components/dashboard/KeyMetricsCards";
import { TradingDayPerformance } from "@/app/components/dashboard/TradingDayPerformance";
import { MostTradedInstruments } from "@/app/components/dashboard/MostTradedInstruments";
import { DailySummaryCalendar } from "@/app/components/dashboard/DailySummaryCalendar";
import { LongShortAnalysis } from "@/app/components/dashboard/LongShortAnalysis";
import { TradeDurationPnL } from "@/app/components/dashboard/TradeDurationPnl";
import { InstrumentProfitAnalysis } from "@/app/components/dashboard/InstrumentProfitAnalysis";
import { InstrumentVolumeAnalysis } from "@/app/components/dashboard/InstrumentVolumeAnalysis";
import { StreakRiskTool } from "@/app/components/dashboard/RiskForcasting";
import { MonteCarloEquityChart } from "@/app/components/dashboard/MonteCarloEquityChart";
import { RiskOfRuinCalculator } from "@/app/components/dashboard/RiskOfRuin";

import { buildDashboardData } from "@/lib/dashboardAnalytics";
import {
  getTradingDayPerformance,
  getMostTradedInstruments,
  getDailySummary,
  getKeyMetrics,
  getLongShortAnalysis,
  getPnLByDuration,
  getInstrumentProfitAnalysis,
  getInstrumentVolumeAnalysis,
} from "@/lib/advancedAnalytics";

import { getStatusColor, getStatusIcon } from "@/lib/utils/statusUtils";

export default function DashboardPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const [dateRange, setDateRange] = useState<{
    from: string;
    to: string;
  } | null>(null);

  // =========================
  // 📥 ACCOUNTS QUERY
  // =========================
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) return [];

      const { data } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active");
      return data || [];
    },
  });

  // =========================
  // 📥 TRADES QUERY
  // =========================
  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["trades", selectedAccountId, dateRange],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) return [];

      let query = supabase.from("trades").select("*").eq("user_id", user.id);

      if (selectedAccountId) {
        query = query.eq("account_id", selectedAccountId);
      }

      if (dateRange) {
        query = query
          .gte("close_time", dateRange.from)
          .lte("close_time", dateRange.to);
      }

      const { data, error } = await query;

      if (error) {
        console.error(error);
        return [];
      }

      return data || [];
    },
  });

  // =========================
  // ⚠️ LOADING
  // =========================
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center p-6">
        <div className="text-center">
          <div className="mb-4 text-2xl">📊</div>
          <div className="text-gray-500 dark:text-gray-400">
            Ачааллаж байна...
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // 📊 ACCOUNT
  // =========================
  const selectedAccount =
    accounts.find((a) => a.id === selectedAccountId) ?? accounts[0];

  const balance = selectedAccount?.start_balance;
  const isValidBalance = typeof balance === "number" && balance > 0;

  // =========================
  // 📊 ANALYTICS
  // =========================
  const { chartData } = buildDashboardData(
    trades,
    isValidBalance ? balance : 5000,
  );

  const tradingDayData = getTradingDayPerformance(trades);
  const mostTradedData = getMostTradedInstruments(trades);
  const dailySummary = getDailySummary(trades);
  const keyMetrics = getKeyMetrics(trades);
  const longShortData = getLongShortAnalysis(trades);
  const durationData = getPnLByDuration(trades);
  const profitAnalysisData = getInstrumentProfitAnalysis(trades);
  const volumeAnalysisData = getInstrumentVolumeAnalysis(trades);

  // =========================
  // 🎯 UI
  // =========================
  return (
    <div className="space-y-6 p-1">
      <h1 className="text-2xl font-bold dark:text-white">Хяналтын самбар</h1>

      {/* Account + Filters */}
      <div className="mb-4 space-y-3">
        <select
          className="w-full sm:w-auto rounded-lg border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
          value={selectedAccountId || ""}
          onChange={(e) => setSelectedAccountId(e.target.value || null)}
        >
          <option value="">Бүх данс</option>
          {accounts.map((acc) => (
            <option
              key={acc.id}
              value={acc.id}
              className={getStatusColor(acc.status)}
            >
              {getStatusIcon(acc.status)} {acc.name}
            </option>
          ))}
        </select>

        <DateRangeFilter onRangeChange={setDateRange} trades={trades} />

        <div className="text-xs text-gray-500 dark:text-gray-400">
          📊 Нийт {trades.length} арилжаа
        </div>
      </div>

      {/* Dashboard */}
      <DashboardStats
        trades={trades}
        balance={isValidBalance ? balance : 5000}
      />
      <EquityCurveChart data={chartData} />
      <EquityDrawdownChart
        trades={trades}
        balance={isValidBalance ? balance : 5000}
      />

      <KeyMetricsCards {...keyMetrics} />

      <TradingDayPerformance data={tradingDayData} />

      <div className="grid gap-6 lg:grid-cols-2">
        <MostTradedInstruments data={mostTradedData} />
        <LongShortAnalysis data={longShortData} />
      </div>

      <DailySummaryCalendar data={dailySummary} />
      <TradeDurationPnL data={durationData} />

      <div className="grid gap-6 lg:grid-cols-2">
        <InstrumentProfitAnalysis data={profitAnalysisData} />
        <InstrumentVolumeAnalysis data={volumeAnalysisData} />
      </div>

      <StreakRiskTool trades={trades} />
      <MonteCarloEquityChart trades={trades} />
      <RiskOfRuinCalculator
        trades={trades}
        initialBalance={isValidBalance ? balance : 5000}
        riskPerTrade={1}
      />

      <RiskPanel data={trades} />

      {trades.length === 0 && (
        <div className="mt-12 rounded-lg border-2 border-dashed p-12 text-center dark:border-gray-700">
          <div className="mb-2 text-4xl">📭</div>
          <h3 className="text-lg font-semibold dark:text-white">
            Арилжаа олдсонгүй.
          </h3>
        </div>
      )}
    </div>
  );
}
