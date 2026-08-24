"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { RichTextEditor } from "@/app/components/ui/RichTextEditor";
import type {
  ChecklistItem,
  ChecklistGroup,
  StrategyProfile,
} from "@/types/trade";

// ============================================================
// DEFAULT CONTENT
// ============================================================

const defaultContents = {
  strategy: `<div style="margin-bottom: 1rem;">
  <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
    <h4 style="color: #1E3A8A; font-weight: 600; margin: 0 0 0.5rem 0;">
      Алхам 1: Зах зээлийн бүтэц ба чиглэл (Market Structure &amp; Trend)
    </h4>
    <ul style="margin: 0.5rem 0 0 1.5rem; padding-left: 0; list-style-type: disc;">
      <li style="margin: 0.25rem 0; color: #374151;">Өдөр тутмын (Daily, D1) болон 4 цагийн (4H, H4) графикаас зах зээлийн бүтэц ба чиглэлийг тодорхойлно.</li>
      <li style="margin: 0.25rem 0; color: #374151;">Чиглэлтэйгээ нийцсэн (in line with trend) арилжааг илүү өндөр магадлалтай гэж үзнэ.</li>
    </ul>
  </div>
  <div style="background-color: #F5F3FF; border-left: 4px solid #8B5CF6; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
    <h4 style="color: #4C1D95; font-weight: 600; margin: 0 0 0.5rem 0;">
      Алхам 2: Сонирхолтой бүс (Points of Interest, POI)
    </h4>
    <ul style="margin: 0.5rem 0 0 1.5rem; padding-left: 0; list-style-type: disc;">
      <li style="margin: 0.25rem 0; color: #374151;">Одоогийн тренд дотор imbalanced supply/demand бүсийг хайж, үнэ татах боломжтой бүсийг тодорхойлно.</li>
      <li style="margin: 0.25rem 0; color: #374151;">Өмнөх ёроолуудаас liquidity sweep хийх боломжтой бүсийг ч анхаарна.</li>
    </ul>
  </div>
  <div style="background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
    <h4 style="color: #065F46; font-weight: 600; margin: 0 0 0.5rem 0;">
      Алхам 3: Оруулах цэг (Entry Setup, M5)
    </h4>
    <ul style="margin: 0.5rem 0 0 1.5rem; padding-left: 0; list-style-type: disc;">
      <li style="margin: 0.25rem 0; color: #374151;">Үнэ POI-д хүрсний дараа M5 график дээр шилжиж, зах зээлийн бүтцийг тодорхойлно.</li>
      <li style="margin: 0.25rem 0; color: #374151;">CHoCH (Change of Character)-г хүлээнэ.</li>
    </ul>
  </div>
  <div style="background-color: #FFF7ED; border-left: 4px solid #F97316; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
    <h4 style="color: #9A3412; font-weight: 600; margin: 0 0 0.5rem 0;">
      Алхам 4: SL &amp; TP (Stop Loss &amp; Take Profit)
    </h4>
    <ul style="margin: 0.5rem 0 0 1.5rem; padding-left: 0; list-style-type: disc;">
      <li style="margin: 0.25rem 0; color: #374151;">SL: CHoCH-ийн өмнөх high/low-оос хэдэн pip-ийн зайтай байрлуулна.</li>
      <li style="margin: 0.25rem 0; color: #374151;">TP: mechanical 1:3 R:R эсвэл liquidity zones.</li>
    </ul>
  </div>
</div>`,
  risk_management: `<div style="margin-bottom: 1rem;">
  <div style="background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
    <h4 style="color: #065F46; font-weight: 600; margin: 0 0 0.5rem 0;">
      💰 Live дансууд (Live Accounts)
    </h4>
    <ul style="margin: 0.5rem 0 0 1.5rem; padding-left: 0; list-style-type: disc;">
      <li style="margin: 0.25rem 0; color: #374151;">1% эрсдэл нэг арилжаанд</li>
      <li style="margin: 0.25rem 0; color: #374151;">Сэтгэл хөдлөлөөс үл хамааран consistent risk</li>
      <li style="margin: 0.25rem 0; color: #374151;">No breakeven, no partials – SL эсвэл TP хүртэл барих</li>
    </ul>
  </div>
  <div style="background-color: #FEFCE8; border-left: 4px solid #EAB308; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
    <h4 style="color: #854D0E; font-weight: 600; margin: 0 0 0.5rem 0;">
      🏆 Funded дансууд
    </h4>
    <ul style="margin: 0.5rem 0 0 1.5rem; padding-left: 0; list-style-type: disc;">
      <li style="margin: 0.25rem 0; color: #374151;">1-р шат: 2% эрсдэл</li>
      <li style="margin: 0.25rem 0; color: #374151;">2-р шат: 1% эрсдэл</li>
      <li style="margin: 0.25rem 0; color: #374151;">Live funded: 1% эрсдэл</li>
    </ul>
  </div>
</div>`,
  key_processes: `<div style="margin-bottom: 1rem;">
  <div style="background-color: #F5F3FF; border-left: 4px solid #8B5CF6; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
    <h4 style="color: #4C1D95; font-weight: 600; margin: 0 0 0.5rem 0;">
      📓 Арилжааны дэвтэр (Trade Journaling)
    </h4>
    <ul style="margin: 0.5rem 0 0 1.5rem; padding-left: 0; list-style-type: disc;">
      <li style="margin: 0.25rem 0; color: #374151;">Бүх арилжааг Trading Journal -д тэмдэглэнэ.</li>
      <li style="margin: 0.25rem 0; color: #374151;">Өдөр бүр: Price action recap, valid setups, psychology notes</li>
    </ul>
  </div>
  <div style="background-color: #EEF2FF; border-left: 4px solid #6366F1; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
    <h4 style="color: #3730A3; font-weight: 600; margin: 0 0 0.5rem 0;">
      📊 Долоо хоног/Сар/Улирлын ASR
    </h4>
    <ul style="margin: 0.5rem 0 0 1.5rem; padding-left: 0; list-style-type: disc;">
      <li style="margin: 0.25rem 0; color: #374151;">Өөрийн зохиосон загвар ашиглах</li>
      <li style="margin: 0.25rem 0; color: #374151;">Өмнөх хугацааг backtest хийх</li>
    </ul>
  </div>
</div>`,
};

// ============================================================
// SECTIONS CONFIGURATION
// ============================================================

const sections = [
  {
    id: "strategy",
    title: "📈 1. Стратеги (Strategy)",
    placeholder: "Арилжааны стратегиа оруулна уу...",
    defaultContent: defaultContents.strategy,
  },
  {
    id: "risk_management",
    title: "⚖️ 2. Эрсдэлийн удирдлага (Risk Management)",
    placeholder: "Эрсдэлийн удирдлагын дүрмээ оруулна уу...",
    defaultContent: defaultContents.risk_management,
  },
  {
    id: "key_processes",
    title: "📝 3. Гол процессууд (Key Processes)",
    placeholder: "Гол процессуудаа оруулна уу...",
    defaultContent: defaultContents.key_processes,
  },
];

// ============================================================
// GROUPS CONFIGURATION
// ============================================================

const GROUPS: { id: ChecklistGroup; label: string }[] = [
  {
    id: "market_context",
    label: "📊 1. Зах зээлийн нөхцөл байдал (Market Context)",
  },
  {
    id: "setup_validation",
    label: "✅ 2. Арилжааны нөхцөл баталгаажуулалт (Setup Validation)",
  },
  {
    id: "entry_confirmation",
    label: "🔍 3. Оролтын цэг баталгаажуулалт — M5 (Entry Confirmation)",
  },
  { id: "risk_reward", label: "⚖️ 4. Ашиг алдагдлын харьцаа (Risk & Reward)" },
  {
    id: "trade_permission",
    label: "🔴 5. Арилжааны зөвшөөрөл (Trade Permission)",
  },
];

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function TradingPlanPage() {
  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Trading Plan
  const [planData, setPlanData] = useState({
    strategy: defaultContents.strategy,
    risk_management: defaultContents.risk_management,
    key_processes: defaultContents.key_processes,
  });

  // Strategy Profiles
  const [profiles, setProfiles] = useState<StrategyProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);

  // Checklist
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [checklistLoading, setChecklistLoading] = useState(true);
  const [checklistSaving, setChecklistSaving] = useState(false);
  const [checklistError, setChecklistError] = useState<string | null>(null);
  const [checklistSaved, setChecklistSaved] = useState(false);

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set([]),
  );

  // ============================================================
  // LOAD DATA
  // ============================================================

  // Load trading plan
  useEffect(() => {
    const loadPlan = async () => {
      const user = await getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("trading_plans")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data && !error) {
        setPlanData({
          strategy: data.strategy?.trim()
            ? data.strategy
            : defaultContents.strategy,
          risk_management: data.risk_management?.trim()
            ? data.risk_management
            : defaultContents.risk_management,
          key_processes: data.key_processes?.trim()
            ? data.key_processes
            : defaultContents.key_processes,
        });
      }
      setLoading(false);
    };

    loadPlan();
  }, []);

  // Load strategy profiles
  useEffect(() => {
    const loadProfiles = async () => {
      setProfileLoading(true);
      const user = await getCurrentUser();
      if (!user) {
        setProfileLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("strategy_profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        setProfileLoading(false);
        return;
      }

      setProfiles(data || []);
      if (data && data.length > 0) {
        const active = data.find((p) => p.is_active);
        setSelectedProfileId(active ? active.id : data[0].id);
      }
      setProfileLoading(false);
    };

    loadProfiles();
  }, []);

  // Load checklist for selected profile
  useEffect(() => {
    const loadChecklist = async () => {
      if (!selectedProfileId) {
        setChecklistItems([]);
        setChecklistLoading(false);
        return;
      }

      setChecklistLoading(true);
      const user = await getCurrentUser();
      if (!user) {
        setChecklistLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("trade_checklist_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("strategy_profile_id", selectedProfileId)
        .order("order_index", { ascending: true });

      if (error) {
        setChecklistError(error.message);
        setChecklistLoading(false);
        return;
      }

      setChecklistItems(data || []);
      setChecklistLoading(false);
    };

    loadChecklist();
  }, [selectedProfileId]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Save trading plan
  const handleSave = async () => {
    setSaving(true);
    const user = await getCurrentUser();
    if (!user) {
      alert("Нэвтрэх шаардлагатай.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("trading_plans").upsert(
      {
        user_id: user.id,
        strategy: planData.strategy,
        risk_management: planData.risk_management,
        key_processes: planData.key_processes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) {
      alert("Хадгалахад алдаа: " + error.message);
    } else {
      alert("Төлөвлөгөө хадгалагдлаа!");
      setIsEditing(false);
    }
    setSaving(false);
  };

  // ============================================================
  // STRATEGY PROFILE FUNCTIONS
  // ============================================================

  const addProfile = async () => {
    const user = await getCurrentUser();
    if (!user) return;

    const name = prompt("Шинэ стратегийн нэр:");
    if (!name || name.trim() === "") return;

    setProfileSaving(true);

    const { data, error } = await supabase
      .from("strategy_profiles")
      .insert({
        user_id: user.id,
        name: name.trim(),
        is_active: profiles.length === 0,
      })
      .select()
      .single();

    if (error) {
      alert("Алдаа: " + error.message);
      setProfileSaving(false);
      return;
    }

    setProfiles([...profiles, data]);
    setSelectedProfileId(data.id);
    setProfileSaving(false);
  };

  const deleteProfile = async (id: string) => {
    if (!confirm("Энэ стратегийг устгах уу?")) return;

    const { error } = await supabase
      .from("strategy_profiles")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Алдаа: " + error.message);
      return;
    }

    const updated = profiles.filter((p) => p.id !== id);
    setProfiles(updated);
    if (selectedProfileId === id) {
      setSelectedProfileId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const setActiveProfile = async (id: string) => {
    const user = await getCurrentUser();
    if (!user) return;

    for (const profile of profiles) {
      if (profile.is_active) {
        await supabase
          .from("strategy_profiles")
          .update({ is_active: false })
          .eq("id", profile.id)
          .eq("user_id", user.id);
      }
    }

    const { error } = await supabase
      .from("strategy_profiles")
      .update({ is_active: true })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      alert("Алдаа: " + error.message);
      return;
    }

    setProfiles(profiles.map((p) => ({ ...p, is_active: p.id === id })));
    setSelectedProfileId(id);
  };

  const renameProfile = async (id: string) => {
    const profile = profiles.find((p) => p.id === id);
    if (!profile) return;

    const newName = prompt("Шинэ нэр:", profile.name);
    if (!newName || newName.trim() === "") return;

    const { error } = await supabase
      .from("strategy_profiles")
      .update({ name: newName.trim(), updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      alert("Алдаа: " + error.message);
      return;
    }

    setProfiles(
      profiles.map((p) => (p.id === id ? { ...p, name: newName.trim() } : p)),
    );
  };

  // ============================================================
  // CHECKLIST FUNCTIONS
  // ============================================================

  const addChecklistItem = (groupName: ChecklistGroup) => {
    setChecklistSaved(false);
    setChecklistItems((current) => [
      ...current,
      {
        id: `temp-${Date.now()}`,
        user_id: "",
        group_name: groupName,
        strategy_profile_id: selectedProfileId,
        title: "",
        description: null,
        type: "boolean",
        required: false,
        critical: false,
        order_index: current.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  };

  const updateChecklistItem = (
    index: number,
    key: keyof ChecklistItem,
    value: any,
  ) => {
    setChecklistSaved(false);
    setChecklistItems((current) => {
      const updated = [...current];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const removeChecklistItem = (index: number) => {
    setChecklistSaved(false);
    setChecklistItems((current) => current.filter((_, i) => i !== index));
  };

  const saveChecklist = async () => {
    setChecklistSaving(true);
    setChecklistSaved(false);
    setChecklistError(null);

    const user = await getCurrentUser();
    if (!user) {
      setChecklistError("Хэрэглэгч олдсонгүй.");
      setChecklistSaving(false);
      return;
    }

    if (!selectedProfileId) {
      setChecklistError("Стратеги сонгоогүй байна.");
      setChecklistSaving(false);
      return;
    }

    const validItems = checklistItems.filter(
      (item) => item.title.trim() !== "",
    );

    const existingIds = checklistItems
      .filter((item) => !item.id.startsWith("temp-"))
      .map((item) => item.id);
    const currentIds = validItems
      .filter((item) => !item.id.startsWith("temp-"))
      .map((item) => item.id);

    const idsToDelete = existingIds.filter((id) => !currentIds.includes(id));

    if (idsToDelete.length > 0) {
      const { error } = await supabase
        .from("trade_checklist_items")
        .delete()
        .in("id", idsToDelete)
        .eq("user_id", user.id);

      if (error) {
        setChecklistError(error.message);
        setChecklistSaving(false);
        return;
      }
    }

    for (const item of validItems) {
      const payload = {
        user_id: user.id,
        group_name: item.group_name,
        strategy_profile_id: selectedProfileId,
        title: item.title,
        description: item.description,
        type: item.type,
        required: item.required,
        critical: item.critical,
        order_index: item.order_index,
      };

      if (item.id.startsWith("temp-")) {
        const { error } = await supabase
          .from("trade_checklist_items")
          .insert(payload);
        if (error) {
          setChecklistError(error.message);
          setChecklistSaving(false);
          return;
        }
      } else {
        const { error } = await supabase
          .from("trade_checklist_items")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", item.id)
          .eq("user_id", user.id);

        if (error) {
          setChecklistError(error.message);
          setChecklistSaving(false);
          return;
        }
      }
    }

    const { data, error } = await supabase
      .from("trade_checklist_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("strategy_profile_id", selectedProfileId)
      .order("order_index", { ascending: true });

    if (error) {
      setChecklistError(error.message);
      setChecklistSaving(false);
      return;
    }

    setChecklistItems(data || []);
    setChecklistSaved(true);
    setChecklistSaving(false);
  };

  // ============================================================
  // RENDER
  // ============================================================

  const renderSafeHTML = (html: string | undefined): string => {
    if (
      !html ||
      typeof html !== "string" ||
      html.trim() === "" ||
      html === "<p></p>"
    ) {
      return '<p class="text-gray-400 italic">Агуулга байхгүй байна.</p>';
    }
    return html;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-2xl">📋</div>
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </div>
    );
  }

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">📋 Арилжааны төлөвлөгөө</h1>
          <p className="text-sm text-gray-500">
            Миний хувийн арилжааны стратеги, эрсдэлийн удирдлагын дүрэм, гол
            процессууд
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() =>
              setExpandedSections(
                new Set([
                  "strategy",
                  "risk_management",
                  "key_processes",
                  "profiles",
                  "checklist",
                ]),
              )
            }
            className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-500"
          >
            Бүгдийг задлах
          </button>
          <button
            onClick={() => setExpandedSections(new Set())}
            className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-500"
          >
            Бүгдийг хураах
          </button>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-lg bg-blue-500 px-4 py-1 text-sm text-white hover:bg-blue-600"
            >
              ✏️ Засварлах
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-green-500 px-4 py-1 text-sm text-white hover:bg-green-600 disabled:opacity-50"
              >
                {saving ? "Хадгалж байна..." : "💾 Хадгалах"}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  window.location.reload();
                }}
                className="rounded-lg border px-4 py-1 text-sm hover:bg-gray-500"
              >
                Цуцлах
              </button>
            </>
          )}
        </div>
      </div>

      {/* SECTIONS */}
      <div className="space-y-4">
        {/* 1. Strategy */}
        {sections.map((section) => (
          <div
            key={section.id}
            className="overflow-hidden rounded-lg border bg-white"
          >
            <button
              onClick={() => toggleSection(section.id)}
              className="flex w-full items-center justify-between p-4 text-left font-semibold hover:bg-gray-500"
            >
              <span className="text-lg">{section.title}</span>
              <span className="text-xl">
                {expandedSections.has(section.id) ? "▼" : "▶"}
              </span>
            </button>
            {expandedSections.has(section.id) && (
              <div className="border-t p-4">
                {isEditing ? (
                  <RichTextEditor
                    value={
                      planData[section.id as keyof typeof planData] ||
                      section.defaultContent
                    }
                    onChange={(value) =>
                      setPlanData({ ...planData, [section.id]: value })
                    }
                    placeholder={section.placeholder}
                    className="min-h-[200px]"
                  />
                ) : (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: renderSafeHTML(
                        planData[section.id as keyof typeof planData],
                      ),
                    }}
                  />
                )}
              </div>
            )}
          </div>
        ))}

        {/* 2. Strategy Profiles */}
        <div className="overflow-hidden rounded-lg border bg-white">
          <button
            onClick={() => toggleSection("profiles")}
            className="flex w-full items-center justify-between p-4 text-left font-semibold hover:bg-gray-500"
          >
            <span className="text-lg">
              🎯 4. Стратегийн профайлууд (Strategy Profiles)
            </span>
            <span className="text-xl">
              {expandedSections.has("profiles") ? "▼" : "▶"}
            </span>
          </button>
          {expandedSections.has("profiles") && (
            <div className="border-t p-4">
              <p className="mb-4 text-sm text-gray-500">
                Стратегийн профайл үүсгэж, тус бүрд өөрийн checklist тохируулах
                боломжтой.
              </p>

              {profileLoading ? (
                <p className="text-sm text-gray-500">Ачааллаж байна...</p>
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap gap-3">
                    {profiles.map((profile) => {
                      const isSelected = selectedProfileId === profile.id;
                      return (
                        <button
                          key={profile.id}
                          onClick={() => setSelectedProfileId(profile.id)}
                          className={`
                relative px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200
                ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }
              `}
                        >
                          <span className="flex items-center gap-2">
                            {profile.is_active && (
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                              </span>
                            )}
                            {profile.name}
                            {profile.is_active && (
                              <span className="text-[10px] text-green-600 dark:text-green-400 font-medium bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded">
                                Идэвхтэй
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                    <button
                      onClick={addProfile}
                      disabled={profileSaving}
                      className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 hover:border-blue-500 hover:text-blue-500 disabled:opacity-50"
                    >
                      + Шинэ стратеги
                    </button>
                  </div>

                  {selectedProfileId && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => setActiveProfile(selectedProfileId)}
                        className="rounded-lg bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600"
                      >
                        ✓ Идэвхтэй болгох
                      </button>
                      <button
                        onClick={() => renameProfile(selectedProfileId)}
                        className="rounded-lg bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                      >
                        ✏️ Нэр засах
                      </button>
                      <button
                        onClick={() => deleteProfile(selectedProfileId)}
                        className="rounded-lg bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                      >
                        🗑️ Устгах
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* 3. Checklist */}
        <div className="overflow-hidden rounded-lg border bg-white">
          <button
            onClick={() => toggleSection("checklist")}
            className="flex w-full items-center justify-between p-4 text-left font-semibold hover:bg-gray-500"
          >
            <span className="text-lg">
              📋 5. Арилжааны нөхцөл баталгаажуулалт (Setup Validation
              Checklist)
              {selectedProfile && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  — {selectedProfile.name}
                </span>
              )}
            </span>
            <span className="text-xl">
              {expandedSections.has("checklist") ? "▼" : "▶"}
            </span>
          </button>
          {expandedSections.has("checklist") && (
            <div className="border-t p-4">
              {!selectedProfileId ? (
                <p className="text-sm text-yellow-600">
                  ⚠️ Эхлээд стратегийн профайл сонгоно уу.
                </p>
              ) : checklistLoading ? (
                <p className="text-sm text-gray-500">Ачааллаж байна...</p>
              ) : (
                <>
                  <p className="mb-4 text-sm text-gray-500">
                    <span className="text-red-500 font-medium">Маш чухал</span>{" "}
                    шалгуур хангагдахгүй бол{" "}
                    <span className="text-red-500 font-bold">
                      Арилжаа байхгүй
                    </span>{" "}
                    гэсэн дүгнэлт гарна.
                  </p>

                  {GROUPS.map((group) => {
                    const groupItems = checklistItems.filter(
                      (item) => item.group_name === group.id,
                    );
                    return (
                      <div
                        key={group.id}
                        className="mb-6 rounded-lg border p-4"
                      >
                        <h4 className="mb-3 font-medium text-gray-700">
                          {group.label}
                          <span className="ml-2 text-sm text-gray-400">
                            ({groupItems.length})
                          </span>
                        </h4>
                        <div className="space-y-2">
                          {groupItems.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">
                              Шалгуур алга
                            </p>
                          ) : (
                            groupItems.map((item) => {
                              const globalIndex = checklistItems.indexOf(item);
                              return (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-3 rounded-lg border p-3"
                                >
                                  <div className="flex-1 min-w-0">
                                    <input
                                      type="text"
                                      value={item.title}
                                      onChange={(e) =>
                                        updateChecklistItem(
                                          globalIndex,
                                          "title",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Шалгуурын нэр..."
                                      className="w-full rounded-lg border px-3 py-1.5 text-sm"
                                    />
                                    <input
                                      type="text"
                                      value={item.description || ""}
                                      onChange={(e) =>
                                        updateChecklistItem(
                                          globalIndex,
                                          "description",
                                          e.target.value || null,
                                        )
                                      }
                                      placeholder="Тайлбар..."
                                      className="mt-1 w-full rounded-lg border px-3 py-1.5 text-xs text-gray-500"
                                    />
                                  </div>
                                  <div className="w-24">
                                    <select
                                      value={item.type}
                                      onChange={(e) =>
                                        updateChecklistItem(
                                          globalIndex,
                                          "type",
                                          e.target.value as any,
                                        )
                                      }
                                      className="w-full rounded-lg border px-2 py-1.5 text-sm"
                                    >
                                      <option value="boolean">Boolean</option>
                                      <option value="rating">Rating</option>
                                      <option value="text">Text</option>
                                    </select>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                                      <input
                                        type="checkbox"
                                        checked={item.required}
                                        onChange={(e) =>
                                          updateChecklistItem(
                                            globalIndex,
                                            "required",
                                            e.target.checked,
                                          )
                                        }
                                        className="h-4 w-4 rounded"
                                      />
                                      Шаардлагатай
                                    </label>
                                    <label className="flex items-center gap-1 text-sm text-red-600 whitespace-nowrap">
                                      <input
                                        type="checkbox"
                                        checked={item.critical}
                                        onChange={(e) =>
                                          updateChecklistItem(
                                            globalIndex,
                                            "critical",
                                            e.target.checked,
                                          )
                                        }
                                        className="h-4 w-4 rounded border-red-300 text-red-600"
                                      />
                                      Маш чухал
                                    </label>
                                  </div>
                                  <button
                                    onClick={() =>
                                      removeChecklistItem(globalIndex)
                                    }
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    ✕
                                  </button>
                                </div>
                              );
                            })
                          )}
                          <button
                            onClick={() => addChecklistItem(group.id)}
                            className="mt-2 text-sm text-blue-600 hover:underline"
                          >
                            + Шалгуур нэмэх
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="mt-6 flex flex-wrap items-center justify-between border-t pt-6">
                    <div>
                      {checklistError && (
                        <p className="text-sm text-red-500">{checklistError}</p>
                      )}
                      {checklistSaved && !checklistError && (
                        <p className="text-sm text-green-500">
                          ✅ Шалгуур хадгалагдлаа.
                        </p>
                      )}
                    </div>
                    <button
                      onClick={saveChecklist}
                      disabled={checklistSaving}
                      className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {checklistSaving ? "Хадгалж байна..." : "💾 Хадгалах"}
                    </button>
                  </div>

                  {/* Example */}
                  <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-950/30">
                    <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                      💡 Жишээ шалгуур
                    </h4>
                    <div className="mt-2 grid gap-2 text-sm text-blue-700 dark:text-blue-300">
                      <div className="font-medium text-xs text-blue-500 dark:text-blue-400">
                        Зах зээлийн нөхцөл байдал:
                      </div>
                      <ul className="ml-4 list-disc space-y-1">
                        <li className="dark:text-gray-300">
                          D1 Market Structure тодорхой{" "}
                          <span className="text-xs text-red-500 dark:text-red-400">
                            (Маш чухал)
                          </span>
                        </li>
                        <li className="dark:text-gray-300">
                          HTF bias тодорхой{" "}
                          <span className="text-xs text-red-500 dark:text-red-400">
                            (Маш чухал)
                          </span>
                        </li>
                      </ul>
                      <div className="font-medium text-xs text-blue-500 dark:text-blue-400">
                        Арилжааны нөхцөл баталгаажуулалт:
                      </div>
                      <ul className="ml-4 list-disc space-y-1">
                        <li className="dark:text-gray-300">
                          Setup үүссэн{" "}
                          <span className="text-xs text-red-500 dark:text-red-400">
                            (Маш чухал)
                          </span>
                        </li>
                        <li className="dark:text-gray-300">
                          Liquidity байгаа{" "}
                          <span className="text-xs text-red-500 dark:text-red-400">
                            (Маш чухал)
                          </span>
                        </li>
                      </ul>
                      <div className="font-medium text-xs text-blue-500 dark:text-blue-400">
                        Ашиг алдагдлын харьцаа:
                      </div>
                      <ul className="ml-4 list-disc space-y-1">
                        <li className="dark:text-gray-300">
                          Эрсдэл ≤ 1%{" "}
                          <span className="text-xs text-red-500 dark:text-red-400">
                            (Маш чухал)
                          </span>
                        </li>
                        <li className="dark:text-gray-300">
                          R:R ≥ 1:3{" "}
                          <span className="text-xs text-red-500 dark:text-red-400">
                            (Маш чухал)
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SUMMARY CARD */}
      <div className="rounded-lg border bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🎯</div>
          <div>
            <h3 className="font-semibold">Арилжааны төлөвлөгөөний хураангуй</h3>
            <p className="text-sm opacity-90">
              Стратеги: ICT / Smart Money Concepts | Эрсдэл: 1-2% |
              Ашиг/Алдагдал: ≥ 1:3
              {selectedProfile && ` | Профайл: ${selectedProfile.name}`}
            </p>
          </div>
        </div>
      </div>

      {/* PDF EXPORT */}
      <div className="flex justify-end no-print">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
        >
          🖨️ Хэвлэх / PDF-р хадгалах
        </button>
      </div>
    </div>
  );
}
