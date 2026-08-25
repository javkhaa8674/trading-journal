// src/app/psychology/drafts/new/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function NewDraftPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [psychologyData, setPsychologyData] = useState<any>(null);
  const [checklistData, setChecklistData] = useState<any[]>([]);
  const [tradeInfoData, setTradeInfoData] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<
    "tradeInfo" | "setup" | "psychology"
  >("tradeInfo");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftLoading, setDraftLoading] = useState(true);

  const [profiles, setProfiles] = useState<StrategyProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );
  const [profilesLoaded, setProfilesLoaded] = useState(false);

  // Load profiles only
  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      const user = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }

      if (!profilesLoaded) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("strategy_profiles")
          .select("id, name, is_active")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (profilesError) {
          console.error("Error loading profiles:", profilesError);
        } else {
          setProfiles(profilesData || []);
          if (profilesData && profilesData.length > 0) {
            const active = profilesData.find((p) => p.is_active);
            setSelectedProfileId(active?.id || profilesData[0].id);
          }
          setProfilesLoaded(true);
        }
      }

      if (isMounted) {
        setDraftLoading(false);
      }
    }

    initialize();

    return () => {
      isMounted = false;
    };
  }, [router, profilesLoaded]);

  const handleChecklistChange = (data: any) => {
    if (
      data &&
      typeof data === "object" &&
      data.type === "draft_created" &&
      data.draftId
    ) {
      setDraftId(data.draftId);
      return;
    }

    if (Array.isArray(data)) {
      setChecklistData(data);
    }
  };

  const handlePsychologyChange = (data: any) => {
    setPsychologyData(data);
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
  // PSYCHOLOGY SAVE - /psychology/drafts руу шилжих
  // ============================================================

  const handlePsychologySave = async () => {
    setSaving(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("Хэрэглэгч олдсонгүй");
      }

      if (psychologyData && draftId) {
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

  // ============================================================
  // SAVE ALL
  // ============================================================

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("Хэрэглэгч олдсонгүй");
      }

      // 1. Save trade info
      if (tradeInfoData && draftId) {
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

      if (psychologyData && draftId) {
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

      if (checklistData && checklistData.length > 0 && draftId) {
        await supabase
          .from("draft_checklist_responses")
          .delete()
          .eq("draft_id", draftId)
          .eq("user_id", user.id);

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
      console.error("Error saving draft:", error);
      alert("Хадгалахад алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  if (draftLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-2xl">🧠</div>
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push("/psychology/drafts")}
            className="mb-2 text-sm text-gray-500 hover:text-gray-700"
          >
            ← Тэмдэглэл рүү буцах
          </button>
          <h1 className="text-2xl font-bold">🧠 Шинэ тэмдэглэл</h1>
          <p className="text-sm text-gray-500">
            Арилжаатай холбоогүй сэтгэл зүйн мэдээлэл
          </p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Хадгалж байна..." : "💾 Бүгдийг хадгалах"}
        </button>
      </div>

      {/* Draft status */}
      {draftId && (
        <div className="mb-6 rounded-lg bg-green-50 p-3 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-400">
            ✅ Draft үүсгэгдлээ. Одоо мэдээллээ оруулж болно.
          </p>
        </div>
      )}

      {!draftId && (
        <div className="mb-6 rounded-lg bg-yellow-50 p-3 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            ⏳ Draft үүсгэж байна... Эхлээд стратегиа сонгоно уу.
          </p>
        </div>
      )}

      {profiles.length === 0 && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/20">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            ⚠️ Стратегийн профайл байхгүй байна.{" "}
            <a href="/trading-plan" className="text-blue-500 hover:underline">
              Төлөвлөгөө хуудас
            </a>
            -д очиж үүсгэнэ үү.
          </p>
        </div>
      )}

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
              onChange={handleTradeInfoChange}
              onNextTab={handleTradeInfoSave}
            />
          </div>
        )}

        {activeSection === "setup" && (
          <div className="rounded-lg border p-4 dark:border-gray-800">
            <ChecklistSection
              tradeId={draftId || ""}
              mode="create"
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
              tradeId={draftId || ""}
              mode="create"
              isDraft={true}
              onChange={handlePsychologyChange}
              onSave={handlePsychologySave}
            />
          </div>
        )}
      </div>
    </div>
  );
}
