// src/app/psychology/page.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTrades } from "@/lib/hooks/useTrades";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import {
  calculateSetupAnalytics,
  calculatePsychologyAnalytics,
  calculateBehaviorAnalytics,
  calculateCrossAnalytics,
  generateInsights,
} from "@/lib/analytics/index";

// ============================================================
// ТӨРЛҮҮД
// ============================================================

type Account = {
  id: string;
  name: string;
  status: string;
  balance: number;
};

type StrategyProfile = {
  id: string;
  name: string;
  is_active: boolean;
};

type AccountStatus = "active" | "achieved" | "closed";

// ============================================================
// 🆕 R-MULTIPLE HELPER (Component-ийн түвшинд)
// ============================================================

function getRMultiple(trade: any): number {
  if (!trade.profit) return 0;

  if (trade.entry_price && trade.stop_loss && trade.lot_size) {
    const pipSize = trade.symbol === "XAUUSD" ? 0.01 : 0.0001;
    const riskInPips = Math.abs(trade.entry_price - trade.stop_loss) / pipSize;
    const riskInMoney = riskInPips * trade.lot_size * 10;
    if (riskInMoney > 0) {
      return parseFloat((trade.profit / riskInMoney).toFixed(2));
    }
  }

  return 0;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function PsychologyAnalyticsPage() {
  const router = useRouter();
  const { trades, loading: tradesLoading } = useTrades();

  // Account state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccount, setActiveAccount] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AccountStatus>("active");

  // Strategy state
  const [strategies, setStrategies] = useState<StrategyProfile[]>([]);
  const [activeStrategy, setActiveStrategy] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [psychologyData, setPsychologyData] = useState<any[]>([]);
  const [behaviorData, setBehaviorData] = useState<any[]>([]);
  const [postTradeData, setPostTradeData] = useState<any[]>([]);
  const [setupData, setSetupData] = useState<any[]>([]);

  // ============================================================
  // LOAD ACCOUNTS
  // ============================================================

  useEffect(() => {
    async function loadAccounts() {
      const user = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("accounts")
        .select("id, name, balance, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading accounts:", error);
        return;
      }

      setAccounts(data || []);

      // Default: null (All Accounts)
      setLoading(false);
    }

    loadAccounts();
  }, [router]);

  // ============================================================
  // LOAD STRATEGIES
  // ============================================================

  useEffect(() => {
    async function loadStrategies() {
      const user = await getCurrentUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("strategy_profiles")
        .select("id, name, is_active")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading strategies:", error);
        return;
      }

      setStrategies(data || []);

      // Default: null (All Strategies)
    }

    loadStrategies();
  }, []);

  // ============================================================
  // LOAD PSYCHOLOGY DATA
  // ============================================================

  useEffect(() => {
    async function loadPsychologyData() {
      if (tradesLoading) return;

      try {
        const user = await getCurrentUser();
        if (!user) return;

        let accountTrades = trades;
        if (activeAccount) {
          accountTrades = trades.filter((t) => t.account_id === activeAccount);
        }

        if (activeStrategy) {
          accountTrades = accountTrades.filter(
            (t) => t.strategy_profile_id === activeStrategy,
          );
        }

        const tradeIds = accountTrades.map((t) => t.id);

        if (tradeIds.length === 0) {
          setPsychologyData([]);
          setBehaviorData([]);
          setPostTradeData([]);
          setSetupData([]);
          return;
        }

        const { data: psych } = await supabase
          .from("trade_psychology")
          .select("*")
          .in("trade_id", tradeIds)
          .eq("user_id", user.id);

        const { data: behav } = await supabase
          .from("trade_behavior")
          .select("*")
          .in("trade_id", tradeIds)
          .eq("user_id", user.id);

        const { data: post } = await supabase
          .from("post_trade_review")
          .select("*")
          .in("trade_id", tradeIds)
          .eq("user_id", user.id);

        const { data: setup } = await supabase
          .from("trade_checklist_responses")
          .select("*")
          .in("trade_id", tradeIds)
          .eq("user_id", user.id);

        setPsychologyData(psych || []);
        setBehaviorData(behav || []);
        setPostTradeData(post || []);
        setSetupData(setup || []);
      } catch (error) {
        console.error("Error loading psychology data:", error);
      }
    }

    loadPsychologyData();
  }, [activeAccount, activeStrategy, trades, tradesLoading]);

  // ============================================================
  // FILTERED TRADES
  // ============================================================

  const filteredTrades = useMemo(() => {
    let result = activeAccount
      ? trades.filter((t) => t.account_id === activeAccount)
      : trades;

    if (activeStrategy) {
      result = result.filter((t) => t.strategy_profile_id === activeStrategy);
    }
    return result;
  }, [trades, activeAccount, activeStrategy]);

  // ============================================================
  // STRATEGY COMPARISON
  // ============================================================

  const strategyComparison = useMemo(() => {
    if (activeStrategy) return [];

    const sourceTrades = activeAccount
      ? trades.filter((t) => t.account_id === activeAccount)
      : trades;

    const strategyMap: Record<string, any> = {};

    strategies.forEach((s) => {
      strategyMap[s.id] = {
        id: s.id,
        name: s.name,
        trades: [],
        totalPnl: 0,
        winCount: 0,
        totalR: 0,
      };
    });

    sourceTrades.forEach((t) => {
      if (t.strategy_profile_id && strategyMap[t.strategy_profile_id]) {
        strategyMap[t.strategy_profile_id].trades.push(t);
        strategyMap[t.strategy_profile_id].totalPnl += t.profit || 0;
        if ((t.profit || 0) > 0) {
          strategyMap[t.strategy_profile_id].winCount += 1;
        }
        // 🆕 r_multiple биш getRMultiple ашиглах
        strategyMap[t.strategy_profile_id].totalR += getRMultiple(t);
      }
    });

    return Object.values(strategyMap)
      .map((s) => {
        const count = s.trades.length;
        return {
          ...s,
          count,
          winRate: count > 0 ? ((s.winCount / count) * 100).toFixed(1) : "0",
          avgR: count > 0 ? (s.totalR / count).toFixed(2) : "0",
        };
      })
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [trades, activeAccount, activeStrategy, strategies]);

  // ============================================================
  // ANALYTICS
  // ============================================================

  const analytics = useMemo(
    () => ({
      setup: calculateSetupAnalytics(filteredTrades, setupData),
      psychology: calculatePsychologyAnalytics(filteredTrades, psychologyData),
      behavior: calculateBehaviorAnalytics(filteredTrades, behaviorData),
      cross: calculateCrossAnalytics(
        filteredTrades,
        psychologyData,
        behaviorData,
        setupData,
      ),
      insights: generateInsights(
        filteredTrades,
        psychologyData,
        behaviorData,
        setupData,
        postTradeData,
      ),
    }),
    [filteredTrades, psychologyData, behaviorData, postTradeData, setupData],
  );

  // ============================================================
  // FILTER
  // ============================================================

  const filteredAccounts = accounts.filter((a) => a.status === activeTab);
  const activeAccounts = accounts.filter((a) => a.status === "active");
  const achievedAccounts = accounts.filter((a) => a.status === "achieved");
  const closedAccounts = accounts.filter((a) => a.status === "closed");

  // ============================================================
  // LOADING
  // ============================================================

  if (loading || tradesLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-2xl">📊</div>
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6 px-4 py-8 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            🧠 Арилжааны сэтгэл зүйн дүн шинжилгээ
          </h1>
          <p className="text-sm text-gray-500">Psychology Analytics</p>
        </div>
      </div>

      {/* ACCOUNT TABS */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-4 sm:gap-8">
          {[
            { key: "active", label: "Active", count: activeAccounts.length },
            {
              key: "achieved",
              label: "Achieved",
              count: achievedAccounts.length,
            },
            { key: "closed", label: "Closed", count: closedAccounts.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as AccountStatus)}
              className={`border-b-2 py-2 px-1 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">🏦 Account:</label>
          <select
            value={activeAccount || "all"}
            onChange={(e) =>
              setActiveAccount(e.target.value === "all" ? null : e.target.value)
            }
            className="rounded-lg border px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="all">📋 All Accounts</option>
            {filteredAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} (${acc.balance.toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        {strategies.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">🎯 Strategy:</label>
            <select
              value={activeStrategy || "all"}
              onChange={(e) =>
                setActiveStrategy(
                  e.target.value === "all" ? null : e.target.value,
                )
              }
              className="rounded-lg border px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <option value="all">📋 All Strategies</option>
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.is_active ? "✓" : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* FILTER LABEL */}
      {filteredTrades.length > 0 && (
        <p className="text-sm text-gray-500">
          {activeAccount
            ? `📁 ${accounts.find((a) => a.id === activeAccount)?.name}`
            : "📋 All Accounts"}
          {activeStrategy
            ? ` · 🎯 ${strategies.find((s) => s.id === activeStrategy)?.name}`
            : " · 📋 All Strategies"}
          {` · ${filteredTrades.length} trades`}
        </p>
      )}

      {/* NO DATA */}
      {filteredTrades.length === 0 && (
        <div className="rounded-xl border-2 border-dashed p-12 text-center dark:border-gray-700">
          <div className="mb-2 text-4xl">📭</div>
          <h3 className="text-lg font-semibold">Арилжаа байхгүй</h3>
          <p className="text-sm text-gray-500">
            {activeStrategy
              ? `"${strategies.find((s) => s.id === activeStrategy)?.name}" стратегид`
              : activeAccount
                ? `"${accounts.find((a) => a.id === activeAccount)?.name}" дансанд`
                : "Бүх дансанд"}{" "}
            бүртгэгдсэн арилжаа байхгүй байна.
          </p>
        </div>
      )}

      {/* ANALYTICS */}
      {filteredTrades.length > 0 && (
        <>
          <SummaryStats trades={filteredTrades} />

          {!activeStrategy && strategyComparison.length > 1 && (
            <StrategyComparison data={strategyComparison} />
          )}

          <SetupAnalytics data={analytics.setup} />
          <PsychologyAnalytics data={analytics.psychology} />
          <BehaviorAnalytics data={analytics.behavior} />
          <CrossAnalysis data={analytics.cross} />
          <InsightsPanel insights={analytics.insights} />
        </>
      )}
    </div>
  );
}

// ============================================================
// UI COMPONENTS
// ============================================================

function SummaryStats({ trades }: { trades: any[] }) {
  const totalTrades = trades.length;

  // ✅ R-Multiple-г profit-оос тооцоолох
  function getRMultiple(trade: any): number {
    if (!trade.profit) return 0;

    if (trade.entry_price && trade.stop_loss && trade.lot_size) {
      const pipSize = trade.symbol === "XAUUSD" ? 0.01 : 0.0001;
      const riskInPips =
        Math.abs(trade.entry_price - trade.stop_loss) / pipSize;
      const riskInMoney = riskInPips * trade.lot_size * 10;
      if (riskInMoney > 0) {
        return parseFloat((trade.profit / riskInMoney).toFixed(2));
      }
    }

    return 0;
  }

  const totalR = trades.reduce((sum, t) => sum + getRMultiple(t), 0);
  const avgR = totalTrades > 0 ? (totalR / totalTrades).toFixed(2) : "0.00";

  const totalPnl = trades.reduce((sum, t) => sum + (t.profit || 0), 0);
  const winRate =
    totalTrades > 0
      ? (
          (trades.filter((t) => (t.profit || 0) > 0).length / totalTrades) *
          100
        ).toFixed(0)
      : "0";

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard label="Нийт Trade" value={totalTrades} icon="📊" />
      <StatCard
        label="Win Rate"
        value={`${winRate}%`}
        icon="📈"
        color={parseFloat(winRate) >= 50 ? "text-green-600" : "text-red-600"}
      />
      <StatCard
        label="Avg R"
        value={avgR}
        icon="📉"
        color={parseFloat(avgR) >= 0 ? "text-green-600" : "text-red-600"}
      />
      <StatCard
        label="Нийт P&L"
        value={`${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`}
        icon="💰"
        color={totalPnl >= 0 ? "text-green-600" : "text-red-600"}
      />
    </div>
  );
}

function StatCard({ label, value, icon, color = "" }: any) {
  return (
    <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2 text-gray-500">
        <span>{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <div className={`mt-1 text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function StrategyComparison({ data }: { data: any[] }) {
  if (data.length === 0) return null;

  return (
    <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-lg font-semibold">📊 Strategy Comparison</h2>
      <p className="text-sm text-gray-500 mb-4">
        Стратеги тус бүрийн гүйцэтгэлийн харьцуулалт
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="text-left py-2 px-3 font-medium text-gray-500">
                Strategy
              </th>
              <th className="text-center py-2 px-3 font-medium text-gray-500">
                Trades
              </th>
              <th className="text-center py-2 px-3 font-medium text-gray-500">
                Win Rate
              </th>
              <th className="text-center py-2 px-3 font-medium text-gray-500">
                Avg R
              </th>
              <th className="text-right py-2 px-3 font-medium text-gray-500">
                Total P&L
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((s) => (
              <tr
                key={s.id}
                className="border-b dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td className="py-2 px-3 font-medium">{s.name}</td>
                <td className="text-center py-2 px-3">{s.count}</td>
                <td
                  className={`text-center py-2 px-3 font-medium ${parseFloat(s.winRate) >= 50 ? "text-green-600" : "text-red-600"}`}
                >
                  {s.winRate}%
                </td>
                <td
                  className={`text-center py-2 px-3 font-medium ${parseFloat(s.avgR) >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {s.avgR}
                </td>
                <td
                  className={`text-right py-2 px-3 font-medium ${s.totalPnl >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {s.totalPnl >= 0 ? "+" : ""}${s.totalPnl.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// ANALYTICS COMPONENTS
// ============================================================

function SetupAnalytics({ data }: { data: any }) {
  if (!data?.distribution?.length) {
    return (
      <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">1️⃣ Setup → Result</h2>
        <p className="text-sm text-gray-500">
          Хангалттай мэдээлэл байхгүй байна.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-lg font-semibold">1️⃣ Setup → Result</h2>
      <p className="text-sm text-gray-500 mb-4">
        Setup score-оор бүлэглэсэн гүйцэтгэл
      </p>

      <div className="space-y-3">
        {data.distribution.map((item: any) => (
          <div key={item.range} className="flex items-center gap-4">
            <span className="w-16 text-sm font-medium">{item.range}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${parseFloat(item.winRate) >= 50 ? "bg-green-500" : "bg-red-500"}`}
                    style={{ width: `${item.winRate}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">
                  {item.winRate}%
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{item.count} trades</span>
                <span>Avg R: {item.avgR}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.keyInsight && (
        <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            💡 {data.keyInsight}
          </p>
          {data.recommendation && (
            <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
              📌 {data.recommendation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PsychologyAnalytics({ data }: { data: any }) {
  if (!data?.fomoAnalysis) {
    return (
      <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">2️⃣ Psychology → Result</h2>
        <p className="text-sm text-gray-500">
          Хангалттай мэдээлэл байхгүй байна.
        </p>
      </div>
    );
  }

  const { fomo, noFomo } = data.fomoAnalysis;

  return (
    <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-lg font-semibold">2️⃣ Psychology → Result</h2>
      <p className="text-sm text-gray-500 mb-4">Сэтгэл зүйн төлөвийн нөлөө</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-3 dark:border-gray-700">
          <h3 className="text-sm font-medium mb-2">🧠 FOMO Analysis</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">FOMO-той</span>
              <span className="text-sm font-medium text-red-600">
                {fomo.count} trades · {fomo.winRate}% · {fomo.avgR}R
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">FOMO-гүй</span>
              <span className="text-sm font-medium text-green-600">
                {noFomo.count} trades · {noFomo.winRate}% · {noFomo.avgR}R
              </span>
            </div>
          </div>
        </div>

        {data.calmnessImpact?.length > 0 && (
          <div className="rounded-lg border p-3 dark:border-gray-700">
            <h3 className="text-sm font-medium mb-2">😌 Calmness Impact</h3>
            <div className="space-y-1">
              {data.calmnessImpact.slice(0, 3).map((item: any) => (
                <div key={item.level} className="flex justify-between text-sm">
                  <span className="text-gray-500">Level {item.level}</span>
                  <span
                    className={`font-medium ${parseFloat(item.winRate) >= 50 ? "text-green-600" : "text-red-600"}`}
                  >
                    {item.winRate}% ({item.count})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-lg bg-purple-50 p-3 dark:bg-purple-950/30">
        <p className="text-sm text-purple-700 dark:text-purple-400">
          💡 {data.keyInsight}
        </p>
        {data.recommendation && (
          <p className="text-sm text-purple-600 dark:text-purple-300 mt-1">
            📌 {data.recommendation}
          </p>
        )}
      </div>
    </div>
  );
}

function BehaviorAnalytics({ data }: { data: any }) {
  if (!data?.planAdherence?.length) {
    return (
      <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">3️⃣ Behavior → Result</h2>
        <p className="text-sm text-gray-500">
          Хангалттай мэдээлэл байхгүй байна.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-lg font-semibold">3️⃣ Behavior → Result</h2>
      <p className="text-sm text-gray-500 mb-4">Зан төлөвийн нөлөө</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-3 dark:border-gray-700">
          <h3 className="text-sm font-medium mb-2">📋 Plan Adherence</h3>
          <div className="space-y-2">
            {data.planAdherence.map((item: any) => (
              <div key={item.key} className="flex justify-between text-sm">
                <span className="text-gray-500">{item.key}</span>
                <span
                  className={`font-medium ${parseFloat(item.winRate) >= 50 ? "text-green-600" : "text-red-600"}`}
                >
                  {item.winRate}% · {item.avgR}R ({item.count})
                </span>
              </div>
            ))}
          </div>
        </div>

        {data.earlyExitAnalysis?.length > 0 && (
          <div className="rounded-lg border p-3 dark:border-gray-700">
            <h3 className="text-sm font-medium mb-2">🚪 Early Exit</h3>
            <div className="space-y-2">
              {data.earlyExitAnalysis.map((item: any) => (
                <div key={item.key} className="flex justify-between text-sm">
                  <span className="text-gray-500">{item.key}</span>
                  <span
                    className={`font-medium ${parseFloat(item.winRate) >= 50 ? "text-green-600" : "text-red-600"}`}
                  >
                    {item.winRate}% · {item.avgR}R ({item.count})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-lg bg-orange-50 p-3 dark:bg-orange-950/30">
        <p className="text-sm text-orange-700 dark:text-orange-400">
          💡 {data.keyInsight}
        </p>
        {data.recommendation && (
          <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
            📌 {data.recommendation}
          </p>
        )}
      </div>
    </div>
  );
}

function CrossAnalysis({ data }: { data: any }) {
  if (!data?.winningFormula || data.winningFormula.includes("Хангалттай")) {
    return (
      <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">4️⃣ Cross Analysis</h2>
        <p className="text-sm text-gray-500">
          Хангалттай мэдээлэл байхгүй байна.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-lg font-semibold">4️⃣ Cross Analysis</h2>
      <p className="text-sm text-gray-500 mb-4">Амжилт ба алдагдалын томьёо</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20">
          <h3 className="text-sm font-medium text-green-700 dark:text-green-400">
            🏆 Амжилтын томьёо
          </h3>
          <p className="text-sm mt-2 text-green-800 dark:text-green-300">
            {data.winningFormula}
          </p>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
          <h3 className="text-sm font-medium text-red-700 dark:text-red-400">
            💀 Алдагдалын томьёо
          </h3>
          <p className="text-sm mt-2 text-red-800 dark:text-red-300">
            {data.losingFormula}
          </p>
        </div>
      </div>
    </div>
  );
}

function InsightsPanel({ insights }: { insights: any }) {
  if (!insights?.problems?.length) {
    return (
      <div className="rounded-lg border bg-gradient-to-r from-purple-50 to-blue-50 p-4 dark:from-purple-950/20 dark:to-blue-950/20 dark:border-purple-800/30">
        <h2 className="text-lg font-semibold">5️⃣ Insights & Recommendations</h2>
        <p className="text-sm text-gray-500">
          Хангалттай мэдээлэл байхгүй байна.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-gradient-to-r from-purple-50 to-blue-50 p-4 dark:from-purple-950/20 dark:to-blue-950/20 dark:border-purple-800/30">
      <h2 className="text-lg font-semibold">5️⃣ Insights & Recommendations</h2>

      <div className="mt-3 space-y-3">
        <div className="rounded-lg bg-white/50 p-3 dark:bg-black/20">
          <p className="text-sm font-medium">📊 {insights.summary}</p>
        </div>

        {insights.problems.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-red-600 dark:text-red-400">
              🔴 Илэрсэн асуудлууд
            </h3>
            <ul className="mt-1 space-y-1">
              {insights.problems.map((problem: string, index: number) => (
                <li
                  key={index}
                  className="text-sm text-red-700 dark:text-red-300 list-disc list-inside"
                >
                  {problem}
                </li>
              ))}
            </ul>
          </div>
        )}

        {insights.recommendations.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-green-600 dark:text-green-400">
              🟢 Зөвлөмжүүд
            </h3>
            <ul className="mt-1 space-y-1">
              {insights.recommendations.map((rec: string, index: number) => (
                <li
                  key={index}
                  className="text-sm text-green-700 dark:text-green-300 list-disc list-inside"
                >
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
