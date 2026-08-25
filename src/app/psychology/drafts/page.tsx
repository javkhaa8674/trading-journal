// src/app/psychology/drafts/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import Link from "next/link";

type Draft = {
  id: string;
  created_at: string;
  updated_at: string;
  calmness_level: number | null;
  anxiety_level: number | null;
  fear_level: number | null;
  greed_level: number | null;
  frustration_level: number | null;
  confidence_level: number | null;
  focus_level: number | null;
  patience_level: number | null;
  decision_clarity_level: number | null;
  decision_pressure_level: number | null;
  rushed_decision: boolean | null;
  fomo: boolean | null;
  emotional_carryover: boolean | null;
  symbol?: string;
  lot_size?: number | null;
  entry_price?: number | null;
  entry_date?: string;
  entry_time?: string;
  has_checklist?: boolean;
  checklist_count?: number;
  total_checklist_items?: number;
  has_trade_info?: boolean;
};

type DraftTradeInfo = {
  draft_id: string;
  symbol?: string | null;
  lot_size?: number | null;
  entry_price?: number | null;
  entry_date?: string | null;
  entry_time?: string | null;
};

// ✅ Extended trade type with psychology and checklist info
type TradeWithDetails = {
  id: string;
  symbol: string;
  type: string;
  entry_price: number | null;
  open_time: string;
  profit: number | null;
  lot_size: number | null;
  has_psychology: boolean;
  has_checklist: boolean;
  psychology_count: number;
  checklist_count: number;
};

export default function DraftsPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Link trade modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [selectedDraftData, setSelectedDraftData] = useState<Draft | null>(
    null,
  );
  const [trades, setTrades] = useState<TradeWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [linking, setLinking] = useState(false);

  // ============================================================
  // LOAD DRAFTS
  // ============================================================

  useEffect(() => {
    async function loadDrafts() {
      const user = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: psychData, error: psychError } = await supabase
        .from("draft_psychology")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (psychError) {
        console.error("Error loading drafts:", psychError);
        setLoading(false);
        return;
      }

      const draftIds = (psychData || []).map((d) => d.id);

      // Load trade info
      const tradeInfoMap: Record<string, DraftTradeInfo> = {};
      if (draftIds.length > 0) {
        const { data: tradeInfoData } = await supabase
          .from("draft_trade_info")
          .select("*")
          .in("draft_id", draftIds)
          .eq("user_id", user.id);

        tradeInfoData?.forEach((item) => {
          tradeInfoMap[item.draft_id] = item;
        });
      }

      // Load checklist
      const { data: checklistData } = await supabase
        .from("draft_checklist_responses")
        .select("draft_id")
        .eq("user_id", user.id);

      const checklistMap: Record<string, boolean> = {};
      const checklistCountMap: Record<string, number> = {};
      checklistData?.forEach((item) => {
        checklistMap[item.draft_id] = true;
        checklistCountMap[item.draft_id] =
          (checklistCountMap[item.draft_id] || 0) + 1;
      });

      const totalItems = 14;

      const draftsWithData = (psychData || []).map((draft) => {
        const tradeInfo = tradeInfoMap[draft.id];
        const hasTradeInfo = !!(
          tradeInfo?.symbol ||
          tradeInfo?.lot_size ||
          tradeInfo?.entry_price ||
          tradeInfo?.entry_date
        );

        return {
          ...draft,
          symbol: tradeInfo?.symbol || "",
          lot_size: tradeInfo?.lot_size || null,
          entry_price: tradeInfo?.entry_price || null,
          entry_date: tradeInfo?.entry_date || null,
          entry_time: tradeInfo?.entry_time || null,
          has_trade_info: hasTradeInfo,
          has_checklist: !!checklistMap[draft.id],
          checklist_count: checklistCountMap[draft.id] || 0,
          total_checklist_items: totalItems,
        };
      });

      setDrafts(draftsWithData);
      setLoading(false);
    }

    loadDrafts();
  }, [router]);

  // ============================================================
  // LOAD TRADES FOR LINKING (check psychology AND checklist)
  // ============================================================

  const loadTrades = async () => {
    const user = await getCurrentUser();
    if (!user) return;

    try {
      // 1. Get all trades
      let query = supabase
        .from("trades")
        .select("id, symbol, type, entry_price, open_time, profit, lot_size")
        .eq("user_id", user.id)
        .order("open_time", { ascending: false });

      if (searchQuery) {
        query = query.ilike("symbol", `%${searchQuery}%`);
      }

      const { data: tradesData, error: tradesError } = await query;
      if (tradesError) throw tradesError;

      if (!tradesData || tradesData.length === 0) {
        setTrades([]);
        return;
      }

      const tradeIds = tradesData.map((t) => t.id);

      // 2. Check which trades have psychology data
      const { data: psychologyData } = await supabase
        .from("trade_psychology")
        .select("trade_id")
        .in("trade_id", tradeIds)
        .eq("user_id", user.id);

      const psychologyMap: Record<string, boolean> = {};
      const psychologyCountMap: Record<string, number> = {};
      psychologyData?.forEach((item) => {
        psychologyMap[item.trade_id] = true;
        psychologyCountMap[item.trade_id] =
          (psychologyCountMap[item.trade_id] || 0) + 1;
      });

      // 3. Check which trades have checklist data
      const { data: checklistData } = await supabase
        .from("trade_checklist_responses")
        .select("trade_id")
        .in("trade_id", tradeIds)
        .eq("user_id", user.id);

      const checklistMap: Record<string, boolean> = {};
      const checklistCountMap: Record<string, number> = {};
      checklistData?.forEach((item) => {
        checklistMap[item.trade_id] = true;
        checklistCountMap[item.trade_id] =
          (checklistCountMap[item.trade_id] || 0) + 1;
      });

      // 4. Merge data and filter
      const tradesWithDetails: TradeWithDetails[] = tradesData
        .map((trade) => ({
          id: trade.id,
          symbol: trade.symbol,
          type: trade.type,
          entry_price: trade.entry_price,
          open_time: trade.open_time,
          profit: trade.profit,
          lot_size: trade.lot_size,
          has_psychology: !!psychologyMap[trade.id],
          has_checklist: !!checklistMap[trade.id],
          psychology_count: psychologyCountMap[trade.id] || 0,
          checklist_count: checklistCountMap[trade.id] || 0,
        }))
        // ✅ Filter: Only show trades that DON'T have psychology AND DON'T have checklist
        .filter((trade) => !trade.has_psychology && !trade.has_checklist);

      setTrades(tradesWithDetails);
    } catch (error) {
      console.error("Error loading trades:", error);
      setTrades([]);
    }
  };

  // ============================================================
  // DELETE DRAFT
  // ============================================================

  const deleteDraft = async (draftId: string) => {
    if (!confirm("Энэ draft-ыг устгах уу?")) return;

    setDeleting(draftId);
    try {
      const user = await getCurrentUser();
      if (!user) return;

      await supabase
        .from("draft_trade_info")
        .delete()
        .eq("draft_id", draftId)
        .eq("user_id", user.id);

      await supabase
        .from("draft_checklist_responses")
        .delete()
        .eq("draft_id", draftId)
        .eq("user_id", user.id);

      const { error } = await supabase
        .from("draft_psychology")
        .delete()
        .eq("id", draftId)
        .eq("user_id", user.id);

      if (error) throw error;
      setDrafts(drafts.filter((d) => d.id !== draftId));
    } catch (error) {
      console.error("Error deleting draft:", error);
      alert("Устгахад алдаа гарлаа");
    } finally {
      setDeleting(null);
    }
  };

  // ============================================================
  // LINK DRAFT TO TRADE
  // ============================================================

  const openLinkModal = async (draftId: string) => {
    const draft = drafts.find((d) => d.id === draftId);
    setSelectedDraftId(draftId);
    setSelectedDraftData(draft || null);
    setSearchQuery("");
    await loadTrades();
    setShowLinkModal(true);
  };

  const linkToTrade = async (draftId: string, tradeId: string) => {
    setLinking(true);
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error("Хэрэглэгч олдсонгүй");

      // Get draft psychology
      const { data: draft, error: draftError } = await supabase
        .from("draft_psychology")
        .select("*")
        .eq("id", draftId)
        .eq("user_id", user.id)
        .single();

      if (draftError) throw draftError;

      // Get draft trade info
      const { data: tradeInfo } = await supabase
        .from("draft_trade_info")
        .select("*")
        .eq("draft_id", draftId)
        .eq("user_id", user.id)
        .maybeSingle();

      // Insert into trade_psychology
      const { error: psychError } = await supabase
        .from("trade_psychology")
        .insert({
          trade_id: tradeId,
          user_id: user.id,
          calmness_level: draft.calmness_level,
          anxiety_level: draft.anxiety_level,
          fear_level: draft.fear_level,
          greed_level: draft.greed_level,
          frustration_level: draft.frustration_level,
          confidence_level: draft.confidence_level,
          focus_level: draft.focus_level,
          patience_level: draft.patience_level,
          decision_clarity_level: draft.decision_clarity_level,
          decision_pressure_level: draft.decision_pressure_level,
          rushed_decision: draft.rushed_decision,
          fomo: draft.fomo,
          emotional_carryover: draft.emotional_carryover,
        });

      if (psychError) throw psychError;

      // Get and insert checklist responses
      const { data: checklist, error: checklistError } = await supabase
        .from("draft_checklist_responses")
        .select("*")
        .eq("draft_id", draftId)
        .eq("user_id", user.id);

      if (checklistError) throw checklistError;

      if (checklist && checklist.length > 0) {
        const { error: insertError } = await supabase
          .from("trade_checklist_responses")
          .insert(
            checklist.map((item) => ({
              trade_id: tradeId,
              user_id: user.id,
              checklist_item_id: item.checklist_item_id,
              response_status: item.response_status,
            })),
          );

        if (insertError) throw insertError;
      }

      // Update trade with trade info
      if (tradeInfo) {
        const { error: updateError } = await supabase
          .from("trades")
          .update({
            symbol: tradeInfo.symbol,
            lot_size: tradeInfo.lot_size,
            entry_price: tradeInfo.entry_price,
            open_time:
              tradeInfo.entry_date && tradeInfo.entry_time
                ? new Date(
                    `${tradeInfo.entry_date}T${tradeInfo.entry_time}`,
                  ).toISOString()
                : tradeInfo.entry_date
                  ? new Date(tradeInfo.entry_date).toISOString()
                  : undefined,
          })
          .eq("id", tradeId)
          .eq("user_id", user.id);

        if (updateError) throw updateError;
      }

      // Delete draft
      await supabase
        .from("draft_trade_info")
        .delete()
        .eq("draft_id", draftId)
        .eq("user_id", user.id);

      await supabase
        .from("draft_psychology")
        .delete()
        .eq("id", draftId)
        .eq("user_id", user.id);

      await supabase
        .from("draft_checklist_responses")
        .delete()
        .eq("draft_id", draftId)
        .eq("user_id", user.id);

      setDrafts(drafts.filter((d) => d.id !== draftId));
      setShowLinkModal(false);
      setSelectedDraftId(null);
      setSelectedDraftData(null);

      router.push(`/trades/${tradeId}/review/edit`);
    } catch (error) {
      console.error("Error linking draft:", error);
      alert(
        "Холбоход алдаа гарлаа: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setLinking(false);
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const hasTradeInfoData = (draft: Draft): boolean => {
    return !!(
      draft.symbol ||
      draft.lot_size ||
      draft.entry_price ||
      draft.entry_date
    );
  };

  const getDraftProgress = (draft: Draft) => {
    const psychFields = [
      draft.calmness_level,
      draft.anxiety_level,
      draft.fear_level,
      draft.greed_level,
      draft.frustration_level,
      draft.confidence_level,
      draft.focus_level,
      draft.patience_level,
      draft.decision_clarity_level,
      draft.decision_pressure_level,
      draft.rushed_decision,
      draft.fomo,
      draft.emotional_carryover,
    ];

    const psychCompleted = psychFields.filter(
      (f) => f !== null && f !== undefined,
    ).length;
    const psychTotal = psychFields.length;

    const checklistTotal = draft.total_checklist_items || 14;
    const checklistCompleted = draft.checklist_count || 0;

    const tradeFields = [
      draft.symbol,
      draft.lot_size,
      draft.entry_price,
      draft.entry_date,
    ];
    const tradeCompleted = tradeFields.filter((f) => f && f !== "").length;
    const tradeTotal = tradeFields.length;

    const tradePercentage = (tradeCompleted / tradeTotal) * 100;
    const psychPercentage = (psychCompleted / psychTotal) * 100;
    const checklistPercentage =
      checklistTotal > 0 ? (checklistCompleted / checklistTotal) * 100 : 0;

    const overallPercentage = Math.round(
      tradePercentage * 0.2 + psychPercentage * 0.5 + checklistPercentage * 0.3,
    );

    let label, color, labelColor;
    if (overallPercentage === 100) {
      label = "✅ Бүрэн";
      color = "bg-green-500";
      labelColor = "text-green-600 dark:text-green-400";
    } else if (overallPercentage >= 75) {
      label = `⏳ ${overallPercentage}%`;
      color = "bg-green-500";
      labelColor = "text-green-600 dark:text-green-400";
    } else if (overallPercentage >= 50) {
      label = `⏳ ${overallPercentage}%`;
      color = "bg-yellow-500";
      labelColor = "text-yellow-600 dark:text-yellow-400";
    } else if (overallPercentage > 0) {
      label = `⏳ ${overallPercentage}%`;
      color = "bg-orange-500";
      labelColor = "text-orange-600 dark:text-orange-400";
    } else {
      label = "⬜ 0%";
      color = "bg-gray-300";
      labelColor = "text-gray-400";
    }

    return { percentage: overallPercentage, label, color, labelColor };
  };

  const getBadges = (draft: Draft) => {
    const badges = [];
    if (hasTradeInfoData(draft)) {
      badges.push({
        label: "📊 Trade Info",
        color:
          "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      });
    }
    if (draft.has_checklist) {
      badges.push({
        label: "✅ Нөхцөл баталгаажуулалт",
        color:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      });
    }
    const hasPsychData =
      draft.calmness_level !== null ||
      draft.anxiety_level !== null ||
      draft.fomo !== null ||
      draft.confidence_level !== null;
    if (hasPsychData) {
      badges.push({
        label: "🧠 Сэтгэл зүй",
        color:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      });
    }
    return badges;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-gray-500">Ачааллаж байна...</div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/trades")}
          className="mb-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ← Бүх арилжаа руу буцах
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              🧠 Түр хадгалсан сэтгэл зүйн тэмдэглэл
            </h1>
            <p className="text-sm text-gray-500">
              Арилжаа хаагдахаас өмнөх сэтгэл зүйн тэмдэглэл ({drafts.length})
            </p>
          </div>
          <button
            onClick={() => router.push("/psychology/drafts/new")}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            ➕ Шинэ тэмдэглэл
          </button>
        </div>
      </div>

      {/* Empty State */}
      {drafts.length === 0 && (
        <div className="rounded-xl border-2 border-dashed p-12 text-center dark:border-gray-700">
          <div className="mb-2 text-4xl">📭</div>
          <h3 className="text-lg font-semibold">Тэмдэглэл байхгүй</h3>
          <p className="text-sm text-gray-500">
            Түр хадгалсан сэтгэл зүйн мэдээлэл байхгүй байна.
          </p>
          <button
            onClick={() => router.push("/psychology/drafts/new")}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            ➕ Шинэ тэмдэглэл үүсгэх
          </button>
        </div>
      )}

      {/* Drafts List */}
      {drafts.length > 0 && (
        <div className="space-y-4">
          {drafts.map((draft) => {
            const badges = getBadges(draft);
            const progress = getDraftProgress(draft);
            const hasAnyData = badges.length > 0;

            return (
              <div
                key={draft.id}
                className="rounded-xl border bg-white p-5 dark:border-gray-800 dark:bg-gray-900 transition-shadow hover:shadow-lg"
              >
                <div className="flex flex-col gap-4">
                  {/* Top Row: Date + Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg">🧠</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {formatDate(draft.created_at)}
                      </span>
                      {badges.map((badge, idx) => (
                        <span
                          key={idx}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium ${progress.labelColor}`}
                      >
                        {progress.label}
                      </span>
                      <div className="w-24 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${progress.color}`}
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Details Row */}
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    {draft.symbol && (
                      <span className="font-medium text-gray-900 dark:text-white">
                        {draft.symbol}
                      </span>
                    )}
                    {draft.lot_size && (
                      <span className="text-gray-600 dark:text-gray-400">
                        Lot: {draft.lot_size}
                      </span>
                    )}
                    {draft.entry_price && (
                      <span className="text-gray-600 dark:text-gray-400">
                        Entry: {draft.entry_price}
                      </span>
                    )}
                    {draft.entry_date && (
                      <span className="text-gray-600 dark:text-gray-400">
                        Date: {new Date(draft.entry_date).toLocaleDateString()}
                      </span>
                    )}
                    {draft.calmness_level !== null && (
                      <span className="text-gray-600 dark:text-gray-400">
                        Calmness: {draft.calmness_level}/5
                      </span>
                    )}
                    {draft.anxiety_level !== null && (
                      <span className="text-gray-600 dark:text-gray-400">
                        Anxiety: {draft.anxiety_level}/5
                      </span>
                    )}
                    {draft.confidence_level !== null && (
                      <span className="text-gray-600 dark:text-gray-400">
                        Confidence: {draft.confidence_level}/5
                      </span>
                    )}
                    {draft.fomo === true && (
                      <span className="text-red-500 font-medium">⚠️ FOMO</span>
                    )}
                    {!hasAnyData && (
                      <span className="text-gray-400 italic">Хоосон draft</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-3 dark:border-gray-800">
                    <button
                      onClick={() => openLinkModal(draft.id)}
                      className="rounded-lg bg-purple-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-600"
                    >
                      🔗 Холбох
                    </button>
                    <Link
                      href={`/psychology/drafts/${draft.id}`}
                      className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      ✏️ Засах
                    </Link>
                    <button
                      onClick={() => deleteDraft(draft.id)}
                      disabled={deleting === draft.id}
                      className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                    >
                      {deleting === draft.id ? "Устгаж байна..." : "🗑️ Устгах"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl bg-white p-6 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                🔗 Draft-тай холбох trade сонгох
              </h2>
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setSelectedDraftId(null);
                  setSelectedDraftData(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            {/* Draft Info Preview */}
            {selectedDraftData && hasTradeInfoData(selectedDraftData) && (
              <div className="mb-4 rounded-lg bg-purple-50 p-4 border border-purple-200 dark:bg-purple-950/20 dark:border-purple-800">
                <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-2">
                  📋 Холбох draft-ын мэдээлэл:
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {selectedDraftData.symbol && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Хослол:
                      </span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {selectedDraftData.symbol}
                      </span>
                    </div>
                  )}
                  {selectedDraftData.lot_size && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Lot size:
                      </span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {selectedDraftData.lot_size}
                      </span>
                    </div>
                  )}
                  {selectedDraftData.entry_price && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Entry price:
                      </span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {selectedDraftData.entry_price}
                      </span>
                    </div>
                  )}
                  {selectedDraftData.entry_date && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Entry date:
                      </span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {new Date(
                          selectedDraftData.entry_date,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {selectedDraftData.entry_time && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Entry time:
                      </span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {selectedDraftData.entry_time}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info: Filtered trades message */}
            <div className="mb-4 rounded-lg bg-blue-50 p-3 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                ℹ️ Зөвхөн сэтгэл зүйн болон нөхцөл баталгаажуулалтын мэдээлэлгүй
                trade-уудыг харуулж байна.
                {trades.length === 0 &&
                  " Холбох боломжтой trade байхгүй байна."}
              </p>
            </div>

            {/* Search */}
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                placeholder="🔍 Trade хайх (symbol)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadTrades()}
                className="flex-1 rounded-lg border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              />
              <button
                onClick={loadTrades}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                🔍 Хайх
              </button>
            </div>

            {/* Trades List */}
            <div className="space-y-2">
              {trades.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <p className="text-lg">📭 Холбох боломжтой trade байхгүй</p>
                  <p className="mt-1 text-sm text-gray-400">
                    Бүх trade-ууд аль хэдийн сэтгэл зүйн эсвэл нөхцөл
                    баталгаажуулалтын мэдээлэлтэй байна.
                  </p>
                  <p className="text-sm text-gray-400">
                    Шинэ trade үүсгээд дараа нь холбоно уу.
                  </p>
                </div>
              ) : (
                trades.map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    <div>
                      <div className="font-medium">
                        {trade.symbol} - {trade.type.toUpperCase()}
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm text-gray-500">
                        {trade.entry_price && (
                          <span>Entry: {trade.entry_price}</span>
                        )}
                        {trade.lot_size && <span>Lot: {trade.lot_size}</span>}
                        {trade.open_time && (
                          <span className="col-span-2">
                            Date:{" "}
                            {new Date(trade.open_time).toLocaleDateString()}
                          </span>
                        )}
                        {trade.profit !== null &&
                          trade.profit !== undefined && (
                            <span
                              className={`col-span-2 font-medium ${trade.profit >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              P&L: ${trade.profit}
                            </span>
                          )}
                        {trade.has_psychology && (
                          <span className="col-span-2 text-xs text-green-600">
                            ✅ Psychology бөглөгдсөн
                          </span>
                        )}
                        {trade.has_checklist && (
                          <span className="col-span-2 text-xs text-blue-600">
                            ✅ Checklist бөглөгдсөн
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (selectedDraftId) {
                          linkToTrade(selectedDraftId, trade.id);
                        }
                      }}
                      disabled={linking}
                      className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
                    >
                      {linking ? "Холбож байна..." : "🤝 Холбох"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
