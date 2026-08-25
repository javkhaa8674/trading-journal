// src/app/trades/[id]/review/edit/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useTrades } from "@/lib/hooks/useTrades";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import TradePsychology from "@/app/components/trades/TradePsychology";
import TradeBehavior from "@/app/components/trades/TradeBehavior";
import PostTradeReview from "@/app/components/trades/PostTradeReview";
import ChecklistSection from "@/app/components/trades/ChecklistSection";

export default function EditTradeReviewPage() {
  const params = useParams();
  const tradeId = params.id as string;
  const router = useRouter();

  const { getTrade, loading: tradesLoading } = useTrades();
  const [trade, setTrade] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    psychology: null as any,
    behavior: null as any,
    postTrade: null as any,
    setup: null as any,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "setup" | "psychology" | "behavior" | "postTrade"
  >("setup");

  // 🆕 Дараагийн tab руу шилжих функц
  const goToNextTab = () => {
    const sections: ("setup" | "psychology" | "behavior" | "postTrade")[] = [
      "setup",
      "psychology",
      "behavior",
      "postTrade",
    ];
    const currentIndex = sections.indexOf(activeSection);

    if (currentIndex < sections.length - 1) {
      // Дараагийн tab руу шилжих
      setActiveSection(sections[currentIndex + 1]);
    } else {
      // 🆕 Сүүлийн tab (postTrade) бол review хуудас руу буцах
      router.push(`/trades`);
    }
  };

  // 🆕 Стратегийн нэрийг хадгалах state
  const [strategyName, setStrategyName] = useState<string>("—");

  // 🔄 Бүх өгөгдлийг татах
  useEffect(() => {
    async function loadAllData() {
      setLoading(true);
      try {
        const user = await getCurrentUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const result = await getTrade(tradeId);

        if (result.error || !result.data) {
          console.error("Trade not found:", result.error);
          setLoading(false);
          return;
        }

        setTrade(result.data);

        // 🆕 Стратегийн нэрийг татах
        if (result.data.strategy_profile_id) {
          const { data: profileData } = await supabase
            .from("strategy_profiles")
            .select("name")
            .eq("id", result.data.strategy_profile_id)
            .eq("user_id", user.id)
            .maybeSingle();

          setStrategyName(profileData?.name || "—");
        } else {
          setStrategyName("—");
        }

        // Psychology
        const { data: psych } = await supabase
          .from("trade_psychology")
          .select("*")
          .eq("trade_id", tradeId)
          .eq("user_id", user.id)
          .maybeSingle();

        // Behavior
        const { data: behav } = await supabase
          .from("trade_behavior")
          .select("*")
          .eq("trade_id", tradeId)
          .eq("user_id", user.id)
          .maybeSingle();

        // Post-Trade
        const { data: post } = await supabase
          .from("post_trade_review")
          .select("*")
          .eq("trade_id", tradeId)
          .eq("user_id", user.id)
          .maybeSingle();

        // Setup
        const { data: setup } = await supabase
          .from("trade_checklist_responses")
          .select("*")
          .eq("trade_id", tradeId)
          .eq("user_id", user.id);

        setFormData({
          psychology: psych || null,
          behavior: behav || null,
          postTrade: post || null,
          setup: setup || null,
        });
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAllData();
  }, [tradeId, getTrade]);

  // 🗑️ Бүгдийг устгах
  const handleDeleteAll = async () => {
    if (!confirm("Бүх сэтгэл зүйн мэдээллийг устгах уу?")) return;

    setIsDeleting(true);
    try {
      const user = await getCurrentUser();
      if (!user) return;

      await supabase
        .from("trade_psychology")
        .delete()
        .eq("trade_id", tradeId)
        .eq("user_id", user.id);

      await supabase
        .from("trade_behavior")
        .delete()
        .eq("trade_id", tradeId)
        .eq("user_id", user.id);

      await supabase
        .from("post_trade_review")
        .delete()
        .eq("trade_id", tradeId)
        .eq("user_id", user.id);

      await supabase
        .from("trade_checklist_responses")
        .delete()
        .eq("trade_id", tradeId)
        .eq("user_id", user.id);

      router.push(`/trades/${tradeId}/review`);
    } catch (error) {
      console.error("Error deleting all:", error);
      alert("Устгахад алдаа гарлаа");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading || tradesLoading) {
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
          <p className="text-red-600 dark:text-red-400">
            ❌ Арилжаа олдсонгүй. (ID: {tradeId})
          </p>
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
    { id: "setup", label: "✅ Нөхцөл баталгаажуулалт" },
    { id: "psychology", label: "🧠 Сэтгэл зүй" },
    { id: "behavior", label: "⚡ Зан төлөв" },
    { id: "postTrade", label: "📝 Дүгнэлт" },
  ];

  const hasPsychology = !!formData.psychology;
  const hasBehavior = !!formData.behavior;
  const hasPostTrade = !!formData.postTrade;
  const hasSetup = !!(formData.setup && formData.setup.length > 0);
  const hasAnyData = hasPsychology || hasBehavior || hasPostTrade || hasSetup;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push(`/trades/${tradeId}/review`)}
          className="mb-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ← Review руу буцах
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              ✏️ Дүн шинжилгээг засах — {trade.symbol}
            </h1>
            <p className="text-sm text-gray-500">
              Trade #{tradeId} • {trade.type === "buy" ? "BUY" : "SELL"} •{" "}
              {new Date(trade.open_time || "").toLocaleDateString()}
            </p>
          </div>
          {/* 🆕 Зөвхөн Устгах товч л үлдэнэ */}
          {hasAnyData && (
            <button
              onClick={handleDeleteAll}
              disabled={isDeleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isDeleting ? "Устгаж байна..." : "🗑️ Устгах"}
            </button>
          )}
        </div>
      </div>

      {/* Trade Info */}
      <div className="mb-6 rounded-xl border bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-sm font-semibold text-gray-500">
          📊 Худалдааны мэдээлэл
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
            <p className="text-sm font-medium">{trade.entry_price ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Хаалт</p>
            <p className="text-sm font-medium">{trade.exit_price ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">SL</p>
            <p className="text-sm font-medium">{trade.stop_loss ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">TP</p>
            <p className="text-sm font-medium">{trade.take_profit ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Ашиг</p>
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
            <p className="text-xs text-gray-500">Стратеги</p>
            <p className="text-sm font-medium">
              {strategyName} {/* 🆕 ID биш НЭР харуулах */}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b pb-4 dark:border-gray-800">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() =>
              setActiveSection(
                s.id as "setup" | "psychology" | "behavior" | "postTrade",
              )
            }
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
        {activeSection === "setup" && (
          <ChecklistSection
            tradeId={tradeId}
            mode="edit"
            initialData={formData.setup}
            initialStrategyProfileId={trade.strategy_profile_id}
            onChange={(data) =>
              setFormData((prev) => ({ ...prev, setup: data }))
            }
            onNextTab={goToNextTab}
            isDraft={false}
          />
        )}

        {activeSection === "psychology" && (
          <TradePsychology
            tradeId={tradeId}
            mode="edit"
            initialData={formData.psychology}
            onChange={(data) =>
              setFormData((prev) => ({ ...prev, psychology: data }))
            }
            onNextTab={goToNextTab}
            isDraft={false}
          />
        )}

        {activeSection === "behavior" && (
          <TradeBehavior
            tradeId={tradeId}
            mode="edit"
            initialData={formData.behavior}
            onChange={(data) =>
              setFormData((prev) => ({ ...prev, behavior: data }))
            }
            onNextTab={goToNextTab}
          />
        )}

        {activeSection === "postTrade" && (
          <PostTradeReview
            tradeId={tradeId}
            mode="edit"
            initialData={formData.postTrade}
            onChange={(data) =>
              setFormData((prev) => ({ ...prev, postTrade: data }))
            }
            onNextTab={goToNextTab}
          />
        )}
      </div>
    </div>
  );
}
