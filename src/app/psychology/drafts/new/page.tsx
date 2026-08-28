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

type ActiveSection = "tradeInfo" | "setup" | "psychology";

export default function NewDraftPage() {
  const router = useRouter();

  // ============================================================
  // PAGE STATE
  // ============================================================

  const [saving, setSaving] = useState(false);

  const [psychologyData, setPsychologyData] = useState<any>(null);
  const [checklistData, setChecklistData] = useState<any[]>([]);

  const [activeSection, setActiveSection] = useState<ActiveSection>("setup");

  // Draft
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftLoading, setDraftLoading] = useState(true);

  // Strategy profiles
  const [profiles, setProfiles] = useState<StrategyProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );
  const [profilesLoaded, setProfilesLoaded] = useState(false);

  // ============================================================
  // LOAD STRATEGY PROFILES
  //
  // Энэ useEffect нь AUTO-SAVE биш.
  // Page нээгдэх үед strategy profiles-ийг нэг удаа ачаална.
  // ============================================================

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        const user = await getCurrentUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // --------------------------------------------------------
        // Load strategy profiles
        // --------------------------------------------------------

        if (!profilesLoaded) {
          const { data: profilesData, error: profilesError } = await supabase
            .from("strategy_profiles")
            .select("id, name, is_active")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true });

          if (profilesError) {
            console.error("Error loading profiles:", profilesError);
          } else if (isMounted) {
            const loadedProfiles = profilesData || [];

            setProfiles(loadedProfiles);

            // Active profile байвал түүнийг сонгоно.
            // Active байхгүй бол эхний profile-ийг сонгоно.
            if (loadedProfiles.length > 0) {
              const activeProfile = loadedProfiles.find(
                (profile) => profile.is_active,
              );

              setSelectedProfileId(activeProfile?.id || loadedProfiles[0].id);
            }

            setProfilesLoaded(true);
          }
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        if (isMounted) {
          setDraftLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [router, profilesLoaded]);

  // ============================================================
  // CHECKLIST CHANGE
  //
  // ChecklistSection:
  //
  // 1. Draft үүссэн үед:
  //    { type: "draft_created", draftId }
  //
  // 2. Checklist data өөрчлөгдөх үед:
  //    array
  // ============================================================

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

  // ============================================================
  // PSYCHOLOGY CHANGE
  //
  // Psychology component-ийн local data-г parent-д хадгална.
  // ============================================================

  const handlePsychologyChange = (data: any) => {
    setPsychologyData(data);
  };

  // ============================================================
  // TRADE INFO SAVE
  //
  // DraftTradeInfo өөрөө DB-д хадгална.
  // Parent дээр tradeInfoData хадгалах шаардлагагүй.
  //
  // Save амжилттай болсны дараа Psychology tab руу орно.
  // ============================================================

  const handleTradeInfoSave = () => {
    setActiveSection("psychology");
  };

  // ============================================================
  // CHECKLIST SAVE
  //
  // ChecklistSection өөрөө save хийсний дараа
  // Trade Info tab руу орно.
  // ============================================================

  const handleChecklistSave = () => {
    setActiveSection("tradeInfo");
  };

  // ============================================================
  // PSYCHOLOGY SAVE
  //
  // Psychology-ийн save амжилттай болсны дараа
  // drafts list рүү буцна.
  // ============================================================

  const handlePsychologySave = async () => {
    if (saving) return;

    setSaving(true);

    try {
      const user = await getCurrentUser();

      if (!user) {
        throw new Error("Хэрэглэгч олдсонгүй");
      }

      if (!draftId) {
        throw new Error("Draft ID олдсонгүй");
      }

      if (!psychologyData) {
        throw new Error("Сэтгэл зүйн мэдээлэл оруулна уу");
      }

      // --------------------------------------------------------
      // Update psychology
      // --------------------------------------------------------

      const { error } = await supabase
        .from("draft_psychology")
        .update({
          ...psychologyData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", draftId)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      // --------------------------------------------------------
      // Save success
      // --------------------------------------------------------

      router.push("/psychology/drafts");
    } catch (error) {
      console.error("Error saving psychology:", error);

      alert(error instanceof Error ? error.message : "Хадгалахад алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

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

  // ============================================================
  // TABS
  // ============================================================

  const tabs: {
    id: ActiveSection;
    label: string;
  }[] = [
    {
      id: "setup",
      label: "✅ Нөхцөл баталгаажуулалт",
    },
    {
      id: "tradeInfo",
      label: "📊 Trade Info",
    },
    {
      id: "psychology",
      label: "🧠 Сэтгэл зүй",
    },
  ];

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push("/psychology/drafts")}
            className="mb-2 text-sm text-gray-500 hover:text-gray-700"
          >
            ← Тэмдэглэл рүү буцах
          </button>

          <h1 className="text-2xl font-bold">🧠 Шинэ тэмдэглэл</h1>

          <p className="text-sm text-gray-500">
            Арилжаатай холбоотой сэтгэл зүйн мэдээлэл
          </p>
        </div>
      </div>

      {/* ======================================================
          DRAFT STATUS
      ====================================================== */}

      {draftId && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
          <p className="text-sm text-green-700 dark:text-green-400">
            ✅ Draft үүсгэгдлээ. Одоо мэдээллээ оруулж болно.
          </p>
        </div>
      )}

      {!draftId && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            ⏳ Draft үүсгэж байна... Эхлээд стратегиа сонгоно уу.
          </p>
        </div>
      )}

      {/* ======================================================
          NO STRATEGY PROFILE
      ====================================================== */}

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

      {/* ======================================================
          TABS
      ====================================================== */}

      <div className="mb-6 flex gap-2 border-b pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSection(tab.id)}
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

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div className="space-y-6">
        {/* ====================================================
            SETUP / CHECKLIST
        ==================================================== */}

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

        {/* ====================================================
            TRADE INFO
        ==================================================== */}

        {activeSection === "tradeInfo" && (
          <div className="rounded-lg border p-4 dark:border-gray-800">
            <DraftTradeInfo
              draftId={draftId || ""}
              onNextTab={handleTradeInfoSave}
            />
          </div>
        )}

        {/* ====================================================
            PSYCHOLOGY
        ==================================================== */}

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
