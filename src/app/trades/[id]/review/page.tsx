// src/app/trades/[id]/review/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTrades } from "@/lib/hooks/useTrades";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import TradePsychology from "@/app/components/trades/TradePsychology";
import TradeBehavior from "@/app/components/trades/TradeBehavior";
import PostTradeReview from "@/app/components/trades/PostTradeReview";
import ChecklistSection from "@/app/components/trades/ChecklistSection";

export default function TradeReviewPage() {
  const params = useParams();
  const router = useRouter();
  const tradeId = params.id as string;

  const { trades, loading } = useTrades();
  const trade = trades.find((t) => t.id === tradeId);
  const [activeSection, setActiveSection] = useState<string>("overview");

  // 🆕 Стратегийн нэрийг хадгалах state
  const [strategyName, setStrategyName] = useState<string>("—");

  // 🆕 Стратегийн нэрийг татах
  useEffect(() => {
    async function loadStrategyName() {
      if (!trade?.strategy_profile_id) {
        setStrategyName("—");
        return;
      }

      const user = await getCurrentUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("strategy_profiles")
        .select("name")
        .eq("id", trade.strategy_profile_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading strategy name:", error);
        setStrategyName("—");
        return;
      }

      setStrategyName(data?.name || "—");
    }

    loadStrategyName();
  }, [trade?.strategy_profile_id]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-600 dark:text-red-400">Арилжаа олдсонгүй.</p>
          <button
            onClick={() => router.push("/trades")}
            className="mt-4 rounded-lg bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            ← Бүх Trade руу буцах
          </button>
        </div>
      </div>
    );
  }

  const sections = [
    { id: "overview", label: "📊 Ерөнхий мэдээлэл" },
    { id: "setup", label: "✅ Нөхцөл баталгаажуулалт" },
    { id: "psychology", label: "🧠 Сэтгэл зүй" },
    { id: "behavior", label: "⚡ Зан төлөв" },
    { id: "review", label: "📝 Дүгнэлт" },
  ];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push("/trades")}
              className="mb-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ← Бүх Trade
            </button>
            <h1 className="text-2xl font-bold">
              Trade #{trade.symbol} — Дүн шинжилгээ{" "}
              <span className="text-sm font-normal text-gray-500">
                (Review)
              </span>
            </h1>
            <p className="text-sm text-gray-500">
              {trade.type === "sell" ? "Sell" : "Buy"} •{" "}
              {new Date(trade.open_time || "").toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/trades/${tradeId}/review/edit`)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
            >
              ✏️ Засах
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b pb-4 dark:border-gray-800">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`rounded-lg px-4 py-2 text-sm transition-colors ${
              activeSection === s.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeSection === "overview" && (
          <section className="rounded-xl border bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b p-5 dark:border-gray-800">
              <h2 className="text-lg font-semibold">📊 Худалдааны мэдээлэл</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
              <div>
                <p className="text-xs text-gray-500">Хослол</p>
                <p className="text-sm font-medium">{trade.symbol}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Чиглэл</p>
                <p
                  className={`text-sm font-medium ${
                    trade.type === "buy" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {trade.type === "buy" ? "BUY" : "SELL"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Нээлт</p>
                <p className="text-sm font-medium">
                  {trade.entry_price ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">SL</p>
                <p className="text-sm font-medium">{trade.stop_loss ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">TP</p>
                <p className="text-sm font-medium">
                  {trade.take_profit ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Хаалт</p>
                <p className="text-sm font-medium">{trade.exit_price ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">P&L</p>
                <p
                  className={`text-sm font-medium ${
                    trade.profit && trade.profit > 0
                      ? "text-green-600"
                      : trade.profit && trade.profit < 0
                        ? "text-red-600"
                        : ""
                  }`}
                >
                  {trade.profit ?? "—"}$
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Багц хэмжээ</p>
                <p className="text-sm font-medium">{trade.lot_size ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Стратеги</p>
                <p className="text-sm font-medium">
                  {strategyName} {/* 🆕 ID биш НЭР харуулах */}
                </p>
              </div>
            </div>
          </section>
        )}

        {activeSection === "setup" && (
          <section className="rounded-xl border bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b p-5 dark:border-gray-800">
              <h2 className="text-lg font-semibold">
                ✅ Нөхцөл баталгаажуулалт
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (Setup Validation)
                </span>
              </h2>
            </div>
            <div className="p-5">
              <ChecklistSection
                tradeId={tradeId}
                initialStrategyProfileId={trade.strategy_profile_id}
                mode="view"
              />
            </div>
          </section>
        )}

        {activeSection === "psychology" && (
          <section className="rounded-xl border bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b p-5 dark:border-gray-800">
              <h2 className="text-lg font-semibold">
                🧠 Сэтгэл зүйн төлөв
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (Pre-Trade Psychology)
                </span>
              </h2>
            </div>
            <div className="p-5">
              <TradePsychology tradeId={tradeId} mode="view" />
            </div>
          </section>
        )}

        {activeSection === "behavior" && (
          <section className="rounded-xl border bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b p-5 dark:border-gray-800">
              <h2 className="text-lg font-semibold">
                ⚡ Зан төлөв
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (Trade Behavior)
                </span>
              </h2>
            </div>
            <div className="p-5">
              <TradeBehavior tradeId={tradeId} mode="view" />
            </div>
          </section>
        )}

        {activeSection === "review" && (
          <section className="rounded-xl border bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b p-5 dark:border-gray-800">
              <h2 className="text-lg font-semibold">
                📝 Дүгнэлт
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (Post-Trade Review)
                </span>
              </h2>
            </div>
            <div className="p-5">
              <PostTradeReview tradeId={tradeId} mode="view" />
            </div>
          </section>
        )}
      </div>

      {/* Back to top */}
      <div className="mt-8 text-center">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          ↑ Дээш
        </button>
      </div>
    </div>
  );
}
