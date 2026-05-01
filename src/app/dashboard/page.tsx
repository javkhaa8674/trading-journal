"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { Trade } from "@/types/trade";

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
// =========================
// 🆕 ADVANCED ANALYTICS
// =========================
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
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const [dateRange, setDateRange] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // =========================
  // 📥 ACCOUNTS
  // =========================
  const loadAccounts = async () => {
    const user = await getCurrentUser();
    if (!user) return;

    const { data } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id);

    setAccounts(data || []);
  };

  // =========================
  // 📥 TRADES
  // =========================
  const loadTrades = async () => {
    const user = await getCurrentUser();
    if (!user) return;

    const { data } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id);

    if (!data) return;

    const filteredTrades = selectedAccountId
      ? data.filter((t) => t.account_id === selectedAccountId)
      : data;

    // close_time-оор A-Z (өгсөх дараалал) эрэмбэлэх
    const sortedTrades = [...filteredTrades].sort((a, b) => {
      const timeA = a.close_time ? new Date(a.close_time).getTime() : 0;
      const timeB = b.close_time ? new Date(b.close_time).getTime() : 0;
      return timeA - timeB;
    });

    setTrades(sortedTrades);
    setLoading(false);
  };

  // =========================
  // 🔄 APPLY DATE FILTER (client-side)
  // =========================
  useEffect(() => {
    if (!trades.length) {
      setFilteredTrades([]);
      return;
    }

    let result = [...trades];

    // Apply date range filter
    if (dateRange) {
      result = result.filter((trade) => {
        const tradeDate = new Date(trade.close_time || trade.open_time);
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        return tradeDate >= fromDate && tradeDate <= toDate;
      });
    }

    setFilteredTrades(result);
  }, [trades, dateRange]);
  // =========================
  // 🔄 INIT LOAD
  // =========================
  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    loadTrades();
  }, [selectedAccountId]);

  // =========================
  // ⚠️ LOADING SAFETY FIX
  // =========================
  if (loading) {
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
  // 📊 ACCOUNT FIX (IMPORTANT)
  // =========================
  const selectedAccount =
    accounts.find((a) => a.id === selectedAccountId) ?? accounts[0];

  const balance = selectedAccount?.start_balance;
  const isValidBalance = typeof balance === "number" && balance > 0;

  // =========================
  // 📊 DASHBOARD DATA (Existing)
  // =========================
  const { chartData } = buildDashboardData(
    filteredTrades,
    isValidBalance ? balance : 5000,
  );
  // =========================
  // 🆕 ADVANCED ANALYTICS DATA
  // =========================
  const tradingDayData = getTradingDayPerformance(filteredTrades);
  const mostTradedData = getMostTradedInstruments(filteredTrades);
  const dailySummary = getDailySummary(filteredTrades);
  const keyMetrics = getKeyMetrics(filteredTrades);
  const longShortData = getLongShortAnalysis(filteredTrades);
  const durationData = getPnLByDuration(filteredTrades);
  const profitAnalysisData = getInstrumentProfitAnalysis(filteredTrades);
  const volumeAnalysisData = getInstrumentVolumeAnalysis(filteredTrades);

  // =========================
  // 🎯 RENDER
  // =========================
  return (
    <div className="space-y-6 p-1">
      <h1 className="text-2xl font-bold dark:text-white">Хяналтын самбар</h1>

      {/* =========================
      🏦 ACCOUNT SELECTOR
  ========================= */}
      <div className="mb-4 space-y-3">
        {/* Account Selector - Mobile Friendly */}
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
              {acc.status !== "active" && ` (${acc.status})`}
              {acc.status === "active" && ` - $${acc.balance.toLocaleString()}`}
            </option>
          ))}
        </select>
        {/* Date Range Filter */}
        <DateRangeFilter onRangeChange={setDateRange} trades={trades} />
        {/* Trade count info */}
        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          📊 Нийт {trades.length} {trades.length !== 1 ? "арилжаа" : "арилжаа"}
          {selectedAccountId && (
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {" "}
              {selectedAccount?.name} -ээс
            </span>
          )}
          {dateRange && (
            <span className="font-medium text-green-600 dark:text-green-400">
              {" "}
              {new Date(dateRange.from).toLocaleDateString()} -{" "}
              {new Date(dateRange.to).toLocaleDateString()} хооронд
            </span>
          )}
        </div>
      </div>

      {/* =========================
      📊 EXISTING DASHBOARD COMPONENTS
  ========================= */}
      <DashboardStats
        trades={filteredTrades}
        balance={isValidBalance ? balance : 5000}
      />
      <EquityCurveChart data={chartData} />

      <EquityDrawdownChart
        trades={filteredTrades}
        balance={isValidBalance ? balance : 5000}
      />

      {/* =========================
      🆕 NEW METRICS CARDS
  ========================= */}
      <KeyMetricsCards
        numberOfDays={keyMetrics.numberOfDays}
        totalLotsUsed={keyMetrics.totalLotsUsed}
        biggestWin={keyMetrics.biggestWin}
        biggestLoss={keyMetrics.biggestLoss}
      />

      {/* =========================
      🆕 TRADING DAY PERFORMANCE
  ========================= */}
      <TradingDayPerformance data={tradingDayData} />

      {/* =========================
      🆕 TWO COLUMN LAYOUT
  ========================= */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MostTradedInstruments data={mostTradedData} />
        <LongShortAnalysis data={longShortData} />
      </div>

      {/* =========================
      🆕 DAILY SUMMARY CALENDAR
  ========================= */}
      <DailySummaryCalendar data={dailySummary} />

      {/* =========================
      🆕 TRADE DURATION ANALYSIS
  ========================= */}
      <TradeDurationPnL data={durationData} />

      {/* =========================
      🆕 INSTRUMENT ANALYSIS
  ========================= */}
      <div className="grid gap-6 lg:grid-cols-2">
        <InstrumentProfitAnalysis data={profitAnalysisData} />
        <InstrumentVolumeAnalysis data={volumeAnalysisData} />
      </div>
      {/* =========================
      🆕 FUTURE SIMULATIONS
  ========================= */}
      <StreakRiskTool trades={filteredTrades} />
      <MonteCarloEquityChart trades={filteredTrades} />
      <RiskOfRuinCalculator
        trades={filteredTrades}
        initialBalance={isValidBalance ? balance : 5000}
        riskPerTrade={1} // 1% risk
      />

      {/* =========================
      📊 EXISTING COMPONENTS
  ========================= */}
      <RiskPanel data={filteredTrades} />

      {/* =========================
      🚨 EMPTY STATE
  ========================= */}
      {trades.length === 0 && (
        <div className="mt-12 rounded-lg border-2 border-dashed p-12 text-center dark:border-gray-700">
          <div className="mb-2 text-4xl">📭</div>
          <h3 className="text-lg font-semibold dark:text-white">
            Арилжаа олдсонгүй.
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {selectedAccountId
              ? "Энэ дансанд бүртгэлтэй арилжаа олдсонгүй."
              : "Анализ харахын тулд арилжаа нэмж эхлээрэй"}
          </p>
        </div>
      )}
    </div>
  );
}
