"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { Trade } from "@/types/trade";

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

export default function DashboardPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
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

    setTrades(filteredTrades);
    setLoading(false);
  };

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
          <div className="text-gray-500">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  // =========================
  // 📊 ACCOUNT FIX (IMPORTANT)
  // =========================
  const selectedAccount =
    accounts.find((a) => a.id === selectedAccountId) ?? accounts[0];

  const balance = selectedAccount?.balance;
  const isValidBalance = typeof balance === "number" && balance > 0;

  // =========================
  // 📊 DASHBOARD DATA (Existing)
  // =========================
  const { chartData, monthlyData } = buildDashboardData(
    trades,
    isValidBalance ? balance : undefined,
  );

  // =========================
  // 🆕 ADVANCED ANALYTICS DATA
  // =========================
  const tradingDayData = getTradingDayPerformance(trades);
  const mostTradedData = getMostTradedInstruments(trades);
  const dailySummary = getDailySummary(trades);
  const keyMetrics = getKeyMetrics(trades);
  const longShortData = getLongShortAnalysis(trades);
  const durationData = getPnLByDuration(trades);
  const profitAnalysisData = getInstrumentProfitAnalysis(trades);
  const volumeAnalysisData = getInstrumentVolumeAnalysis(trades);

  // =========================
  // 🎯 RENDER
  // =========================
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* =========================
          🏦 ACCOUNT SELECTOR
      ========================= */}
      <div className="mb-4">
        <select
          className="rounded border p-2"
          value={selectedAccountId || ""}
          onChange={(e) => setSelectedAccountId(e.target.value || null)}
        >
          <option value="">All Accounts</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>

        {/* Trade count info */}
        <div className="mt-2 text-sm text-gray-500">
          Showing {trades.length} trades
          {selectedAccountId && ` from ${selectedAccount?.name}`}
        </div>
      </div>

      {/* =========================
          📊 EXISTING DASHBOARD COMPONENTS
      ========================= */}
      <DashboardStats
        trades={trades}
        balance={isValidBalance ? balance : 10000}
      />

      <EquityCurveChart data={chartData} />

      <EquityDrawdownChart
        trades={trades}
        balance={isValidBalance ? balance : 10000}
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
          📊 EXISTING COMPONENTS
      ========================= */}
      <RiskPanel data={trades} />

      {/* =========================
          🚨 EMPTY STATE
      ========================= */}
      {trades.length === 0 && (
        <div className="mt-12 rounded-lg border-2 border-dashed p-12 text-center">
          <div className="mb-2 text-4xl">📭</div>
          <h3 className="text-lg font-semibold">No trades found</h3>
          <p className="text-gray-500">
            {selectedAccountId
              ? "This account has no trades yet"
              : "Start adding trades to see your analytics"}
          </p>
        </div>
      )}
    </div>
  );
}
