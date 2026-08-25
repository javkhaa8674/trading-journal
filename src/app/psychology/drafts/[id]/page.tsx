// src/app/psychology/drafts/[id]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import TradePsychology from "@/app/components/trades/TradePsychology";
import ChecklistSection from "@/app/components/trades/ChecklistSection";
import DraftTradeInfo from "@/app/components/trades/DraftTradeInfo";

type StrategyProfile = {
  id: string;
  name: string;
  is_active: boolean;
};

export default function EditDraftPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [psychologyData, setPsychologyData] = useState<any>(null);
  const [checklistData, setChecklistData] = useState<any[]>([]);
  const [tradeInfoData, setTradeInfoData] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<
    "tradeInfo" | "setup" | "psychology"
  >("tradeInfo");

  const [profiles, setProfiles] = useState<StrategyProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );
  const [profilesLoading, setProfilesLoading] = useState(true);

  // ============================================================
  // LOAD PROFILES
  // ============================================================

  useEffect(() => {
    async function loadProfiles() {
      const user = await getCurrentUser();
      if (!user) {
        setProfilesLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("strategy_profiles")
        .select("id, name, is_active")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading profiles:", error);
        setProfilesLoading(false);
        return;
      }

      setProfiles(data || []);
      if (data && data.length > 0) {
        const active = data.find((p) => p.is_active);
        setSelectedProfileId(active?.id || data[0].id);
      }
      setProfilesLoading(false);
    }

    loadProfiles();
  }, []);

  // ============================================================
  // LOAD DRAFT DATA
  // ============================================================

  useEffect(() => {
    async function loadDraft() {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // 1. Load draft psychology
      const { data: psych, error: psychError } = await supabase
        .from("draft_psychology")
        .select("*")
        .eq("id", draftId)
        .eq("user_id", user.id)
        .single();

      if (psychError) {
        console.error("Error loading draft:", psychError);
        setLoading(false);
        return;
      }

      setPsychologyData(psych);

      // 2. Load draft trade info
      const { data: tradeInfo, error: tradeError } = await supabase
        .from("draft_trade_info")
        .select("*")
        .eq("draft_id", draftId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (tradeError) {
        console.error("Error loading trade info:", tradeError);
      }

      if (tradeInfo) {
        setTradeInfoData({
          symbol: tradeInfo.symbol || "",
          lot_size: tradeInfo.lot_size || null,
          entry_price: tradeInfo.entry_price || null,
          entry_date:
            tradeInfo.entry_date || new Date().toISOString().split("T")[0],
        });
      } else {
        setTradeInfoData({
          symbol: "",
          lot_size: null,
          entry_price: null,
          entry_date: new Date().toISOString().split("T")[0],
        });
      }

      // 3. Load draft checklist
      const { data: checklist } = await supabase
        .from("draft_checklist_responses")
        .select("*")
        .eq("draft_id", draftId)
        .eq("user_id", user.id);

      setChecklistData(checklist || []);
      setLoading(false);
    }

    loadDraft();
  }, [draftId, router]);

  // ============================================================
  // HANDLE CHANGES
  // ============================================================

  const handlePsychologyChange = (data: any) => {
    setPsychologyData(data);
  };

  const handleChecklistChange = (data: any) => {
    if (Array.isArray(data)) {
      setChecklistData(data);
    }
  };

  const handleTradeInfoChange = (data: any) => {
    setTradeInfoData(data);
  };

  // ============================================================
  // TRADE INFO SAVE - Setup tab руу шилжих
  // ============================================================

  const handleTradeInfoSave = () => {
    setActiveSection("setup");
  };

  // ============================================================
  // CHECKLIST SAVE - Psychology tab руу шилжих
  // ============================================================

  const handleChecklistSave = () => {
    setActiveSection("psychology");
  };

  // ============================================================
  // UPDATE DRAFT
  // ============================================================

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error("Хэрэглэгч олдсонгүй");

      // 1. Update draft trade info
      if (tradeInfoData) {
        const { error } = await supabase.from("draft_trade_info").upsert(
          {
            draft_id: draftId,
            user_id: user.id,
            symbol: tradeInfoData.symbol,
            lot_size: tradeInfoData.lot_size,
            entry_price: tradeInfoData.entry_price,
            entry_date: tradeInfoData.entry_date,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "draft_id" },
        );

        if (error) throw error;
      }

      // 2. Update draft psychology
      if (psychologyData) {
        const { error } = await supabase
          .from("draft_psychology")
          .update({
            ...psychologyData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", draftId)
          .eq("user_id", user.id);

        if (error) throw error;
      }

      // 3. Update draft checklist
      await supabase
        .from("draft_checklist_responses")
        .delete()
        .eq("draft_id", draftId)
        .eq("user_id", user.id);

      if (checklistData && checklistData.length > 0) {
        const { error } = await supabase
          .from("draft_checklist_responses")
          .insert(
            checklistData.map((item: any) => ({
              draft_id: draftId,
              user_id: user.id,
              checklist_item_id: item.checklist_item_id,
              response_status: item.response_status,
            })),
          );

        if (error) throw error;
      }

      router.push("/psychology/drafts");
    } catch (error) {
      console.error("Error updating draft:", error);
      alert("Хадгалахад алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE DRAFT
  // ============================================================

  const handleDelete = async () => {
    if (!confirm("Энэ draft-ыг устгах уу?")) return;

    setDeleting(true);
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

      router.push("/psychology/drafts");
    } catch (error) {
      console.error("Error deleting draft:", error);
      alert("Устгахад алдаа гарлаа");
    } finally {
      setDeleting(false);
    }
  };

  // ============================================================
  // PSYCHOLOGY SAVE (for onSave prop)
  // ============================================================

  const handlePsychologySave = async () => {
    setSaving(true);
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error("Хэрэглэгч олдсонгүй");

      if (psychologyData) {
        const { error } = await supabase
          .from("draft_psychology")
          .update({
            ...psychologyData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", draftId)
          .eq("user_id", user.id);

        if (error) throw error;
      }

      router.push("/psychology/drafts");
    } catch (error) {
      console.error("Error saving psychology:", error);
      alert("Хадгалахад алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  if (loading || profilesLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-gray-500">Ачааллаж байна...</div>
      </div>
    );
  }

  const tabs = [
    { id: "tradeInfo", label: "📊 Trade Info" },
    { id: "setup", label: "✅ Нөхцөл баталгаажуулалт" },
    { id: "psychology", label: "🧠 Сэтгэл зүй" },
  ];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/psychology/drafts")}
          className="mb-2 text-sm text-gray-500 hover:text-gray-700"
        >
          ← Draft-ууд руу буцах
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">✏️ Draft засах</h1>
            <p className="text-sm text-gray-500">
              {psychologyData?.created_at
                ? new Date(psychologyData.created_at).toLocaleDateString()
                : ""}{" "}
              үед үүсгэсэн
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "Устгаж байна..." : "🗑️ Устгах"}
            </button>
            <button
              onClick={handleUpdate}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Хадгалж байна..." : "💾 Хадгалах"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() =>
              setActiveSection(tab.id as "tradeInfo" | "setup" | "psychology")
            }
            className={`rounded-lg px-4 py-2 text-sm ${
              activeSection === tab.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeSection === "tradeInfo" && (
          <div className="rounded-lg border p-4 dark:border-gray-800">
            <DraftTradeInfo
              draftId={draftId || undefined}
              initialData={tradeInfoData}
              onChange={handleTradeInfoChange}
              onNextTab={handleTradeInfoSave}
            />
          </div>
        )}

        {activeSection === "setup" && (
          <div className="rounded-lg border p-4 dark:border-gray-800">
            <ChecklistSection
              tradeId={draftId}
              mode="edit"
              isDraft={true}
              initialStrategyProfileId={selectedProfileId}
              initialData={checklistData}
              onChange={handleChecklistChange}
              onNextTab={handleChecklistSave}
            />
          </div>
        )}

        {activeSection === "psychology" && (
          <div className="rounded-lg border p-4 dark:border-gray-800">
            <TradePsychology
              tradeId={draftId}
              mode="edit"
              isDraft={true}
              initialData={psychologyData}
              onChange={handlePsychologyChange}
              onSave={handlePsychologySave}
            />
          </div>
        )}
      </div>
    </div>
  );
}
