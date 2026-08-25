// src/components/trades/ChecklistSection.tsx

"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { useTrades } from "@/lib/hooks/useTrades";
import type {
  ChecklistItem,
  ChecklistResponse,
  StrategyProfile,
} from "@/types/trade";

type Props = {
  tradeId: string;
  mode?: "view" | "create" | "edit";
  initialData?: any;
  initialStrategyProfileId?: string | null;
  onChange?: (data: any) => void;
  onSave?: (data: any) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  onComplete?: (isComplete: boolean) => void;
  onNextTab?: () => void;
  isDraft?: boolean;
};

const GROUPS: { id: string; label: string }[] = [
  { id: "market_context", label: "📊 Зах зээлийн нөхцөл байдал" },
  { id: "setup_validation", label: "✅ Арилжааны нөхцөл баталгаажуулалт" },
  { id: "entry_confirmation", label: "🔍 Оролтын цэгийн баталгаажуулалт — M5" },
  { id: "risk_reward", label: "⚖️ Ашиг/алдагдлын харьцаа" },
  { id: "trade_permission", label: "🔴 Арилжааны зөвшөөрөл" },
];

export default function ChecklistSection({
  tradeId,
  initialStrategyProfileId,
  mode = "view",
  onSave,
  onCancel,
  onDelete,
  onChange,
  onComplete,
  onNextTab,
  isDraft = false,
  initialData,
}: Props) {
  const { updateTradeStrategy } = useTrades();
  const hasCreatedDraft = useRef(false);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [responses, setResponses] = useState<Record<string, ChecklistResponse>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profiles, setProfiles] = useState<StrategyProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    initialStrategyProfileId || null,
  );
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [updatingStrategy, setUpdatingStrategy] = useState(false);

  // ============================================================
  // DRAFT AUTOMATICALLY CREATE
  // ============================================================

  const ensureDraft = async () => {
    // ✅ tradeId байгаа бол шинээр үүсгэхгүй
    if (tradeId && tradeId !== "draft" && tradeId !== "") {
      return tradeId;
    }

    const user = await getCurrentUser();
    if (!user) throw new Error("Хэрэглэгч олдсонгүй");

    const { data, error } = await supabase
      .from("draft_psychology")
      .insert({ user_id: user.id })
      .select("id")
      .single();

    if (error) throw error;

    if (onChange) {
      onChange({
        type: "draft_created",
        draftId: data.id,
      });
    }

    return data.id;
  };

  // ✅ ЗӨВХӨН НЭГ Л УДАА draft үүсгэх
  useEffect(() => {
    if (isDraft && selectedProfileId && !tradeId && !hasCreatedDraft.current) {
      hasCreatedDraft.current = true;
      ensureDraft();
    }
  }, [selectedProfileId, isDraft, tradeId]);

  // ============================================================
  // SETUP COMPLETE
  // ============================================================

  const isSetupComplete = useMemo(() => {
    if (items.length === 0) return false;

    const requiredItems = items.filter(
      (item) => item.critical || item.required,
    );

    if (requiredItems.length === 0) return true;

    const allRequiredAnswered = requiredItems.every((item) => {
      const response = responses[item.id];
      return response && response.response_status !== null;
    });

    return allRequiredAnswered;
  }, [items, responses]);

  const requiredItems = items.filter((item) => item.critical || item.required);
  const answeredRequired = requiredItems.filter((item) => {
    const response = responses[item.id];
    return response && response.response_status !== null;
  });

  const progress =
    requiredItems.length > 0
      ? Math.round((answeredRequired.length / requiredItems.length) * 100)
      : 100;

  useEffect(() => {
    if (onComplete) {
      onComplete(isSetupComplete);
    }
  }, [isSetupComplete, onComplete]);

  // ============================================================
  // LOAD PROFILES
  // ============================================================

  useEffect(() => {
    async function loadProfiles() {
      setProfilesLoading(true);
      const user = await getCurrentUser();
      if (!user) {
        setProfilesLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("strategy_profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading profiles:", error);
        setProfilesLoading(false);
        return;
      }

      setProfiles(data || []);

      if (!selectedProfileId && data && data.length > 0) {
        const active = data.find((p) => p.is_active);
        setSelectedProfileId(active?.id || data[0].id);
      }

      setProfilesLoading(false);
    }

    loadProfiles();
  }, []);

  // ============================================================
  // INITIAL DATA
  // ============================================================

  useEffect(() => {
    if (isDraft && initialData && Array.isArray(initialData)) {
      const responseMap: Record<string, ChecklistResponse> = {};
      initialData.forEach((item: any) => {
        responseMap[item.checklist_item_id] = {
          id: item.id || `draft-${item.checklist_item_id}`,
          checklist_item_id: item.checklist_item_id,
          response_status: item.response_status,
          value: item.value ?? null,
          rating: item.rating ?? null,
          text_value: item.text_value ?? null,
          trade_id: "draft",
          user_id: "",
          created_at: "",
          updated_at: "",
        };
      });
      setResponses(responseMap);
    }
  }, [isDraft, initialData]);

  // ============================================================
  // LOAD CHECKLIST
  // ============================================================

  useEffect(() => {
    async function loadChecklist() {
      if (isDraft) {
        // draft mode - tradeId шаардлагагүй
      } else if (!tradeId || tradeId === "draft" || tradeId === "") {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const user = await getCurrentUser();
      if (!user) {
        setError("Хэрэглэгч олдсонгүй.");
        setLoading(false);
        return;
      }

      let query = supabase
        .from("trade_checklist_items")
        .select("*")
        .eq("user_id", user.id);

      const profileId = selectedProfileId || initialStrategyProfileId;

      if (profileId) {
        query = query.eq("strategy_profile_id", profileId);
      } else {
        query = query.is("strategy_profile_id", null);
      }

      const { data: itemsData, error: itemsError } = await query.order(
        "order_index",
        { ascending: true },
      );

      if (itemsError) {
        setError(itemsError.message);
        setLoading(false);
        return;
      }

      setItems(itemsData || []);

      if (isDraft) {
        setLoading(false);
        return;
      }

      if (itemsData && itemsData.length > 0) {
        const { data: responsesData, error: responsesError } = await supabase
          .from("trade_checklist_responses")
          .select("*")
          .eq("trade_id", tradeId)
          .eq("user_id", user.id);

        if (responsesError) {
          setError(responsesError.message);
          setLoading(false);
          return;
        }

        const responseMap: Record<string, ChecklistResponse> = {};
        responsesData?.forEach((r) => {
          responseMap[r.checklist_item_id] = r;
        });
        setResponses(responseMap);
      }

      setLoading(false);
    }

    loadChecklist();
  }, [tradeId, selectedProfileId, isDraft, initialStrategyProfileId]);

  // ============================================================
  // UPDATE TRADE STRATEGY
  // ============================================================

  useEffect(() => {
    async function updateTradeStrategyProfile() {
      if (isDraft) return;
      if (!selectedProfileId) return;
      if (selectedProfileId === initialStrategyProfileId) return;
      if (profilesLoading) return;

      setUpdatingStrategy(true);
      setError(null);

      try {
        const result = await updateTradeStrategy(tradeId, selectedProfileId);

        if (result.error) {
          console.error("Error updating trade strategy:", result.error);
          setError("Стратеги шинэчлэхэд алдаа гарлаа: " + result.error);
        } else {
          setSaved(true);
        }
      } catch (err) {
        setError("Стратеги шинэчлэхэд алдаа гарлаа: " + String(err));
      } finally {
        setUpdatingStrategy(false);
      }
    }

    if (
      !isDraft &&
      selectedProfileId &&
      selectedProfileId !== initialStrategyProfileId
    ) {
      updateTradeStrategyProfile();
    }
  }, [
    selectedProfileId,
    tradeId,
    initialStrategyProfileId,
    profilesLoading,
    isDraft,
  ]);

  // ============================================================
  // UPDATE RESPONSE
  // ============================================================

  async function updateResponse(
    itemId: string,
    status: "met" | "partially_met" | "not_met" | "not_applicable" | null,
  ) {
    setSaved(false);
    setError(null);

    const user = await getCurrentUser();
    if (!user) {
      setError("Хэрэглэгч олдсонгүй.");
      return;
    }

    // ============================================================
    // DRAFT MODE
    // ============================================================

    if (isDraft) {
      if (!tradeId || tradeId === "draft" || tradeId === "") {
        setError("Draft ID байхгүй байна. Эхлээд стратегиа сонгоно уу.");
        return;
      }

      const existing = responses[itemId];

      if (existing && existing.response_status === status) {
        if (existing.id && !existing.id.startsWith("draft-")) {
          await supabase
            .from("draft_checklist_responses")
            .delete()
            .eq("id", existing.id)
            .eq("draft_id", tradeId)
            .eq("user_id", user.id);
        }

        const newResponses = { ...responses };
        delete newResponses[itemId];
        setResponses(newResponses);
        setSaved(true);

        if (onChange) {
          onChange(Object.values(newResponses));
        }
        return;
      }

      const payload = {
        draft_id: tradeId,
        user_id: user.id,
        checklist_item_id: itemId,
        response_status: status,
        updated_at: new Date().toISOString(),
      };

      if (existing && existing.id && !existing.id.startsWith("draft-")) {
        const { error } = await supabase
          .from("draft_checklist_responses")
          .update(payload)
          .eq("id", existing.id)
          .eq("draft_id", tradeId)
          .eq("user_id", user.id);

        if (!error) {
          const updatedResponses = {
            ...responses,
            [itemId]: { ...existing, response_status: status },
          };
          setResponses(updatedResponses);
          setSaved(true);

          if (onChange) {
            onChange(Object.values(updatedResponses));
          }
        } else {
          setError(error.message);
        }
      } else {
        const { data, error } = await supabase
          .from("draft_checklist_responses")
          .insert({ ...payload, created_at: new Date().toISOString() })
          .select()
          .single();

        if (!error && data) {
          const updatedResponses = {
            ...responses,
            [itemId]: data,
          };
          setResponses(updatedResponses);
          setSaved(true);

          if (onChange) {
            onChange(Object.values(updatedResponses));
          }
        } else {
          setError(error?.message || "Хадгалахад алдаа гарлаа");
        }
      }
      return;
    }

    // ============================================================
    // REAL TRADE MODE
    // ============================================================

    const existing = responses[itemId];

    if (existing && existing.response_status === status) {
      const { error } = await supabase
        .from("trade_checklist_responses")
        .delete()
        .eq("id", existing.id);

      if (!error) {
        const newResponses = { ...responses };
        delete newResponses[itemId];
        setResponses(newResponses);
        setSaved(true);

        if (onChange) {
          onChange(Object.values(newResponses));
        }
      }
      return;
    }

    const payload = {
      user_id: user.id,
      trade_id: tradeId,
      checklist_item_id: itemId,
      response_status: status,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await supabase
        .from("trade_checklist_responses")
        .update(payload)
        .eq("id", existing.id);

      if (!error) {
        const updatedResponses = {
          ...responses,
          [itemId]: { ...existing, response_status: status },
        };
        setResponses(updatedResponses);
        setSaved(true);

        if (onChange) {
          onChange(Object.values(updatedResponses));
        }
      }
    } else {
      const { data, error } = await supabase
        .from("trade_checklist_responses")
        .insert({ ...payload, created_at: new Date().toISOString() })
        .select()
        .single();

      if (!error && data) {
        const updatedResponses = {
          ...responses,
          [itemId]: data,
        };
        setResponses(updatedResponses);
        setSaved(true);

        if (onChange) {
          onChange(Object.values(updatedResponses));
        }
      }
    }
  }

  // ============================================================
  // SAVE ALL
  // ============================================================

  async function saveAll() {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("Хэрэглэгч олдсонгүй.");
      }

      if (isDraft) {
        const responseArray = Object.values(responses).map((r) => ({
          checklist_item_id: r.checklist_item_id,
          response_status: r.response_status,
        }));

        if (onChange) {
          onChange(responseArray);
        }
        if (onSave) {
          onSave(responseArray);
        }
        setSaved(true);

        // ✅ Дараагийн tab руу шилжих
        if (onNextTab) {
          setTimeout(() => onNextTab(), 300);
        }
        return;
      }

      setSaved(true);
      if (onSave) {
        onSave(Object.values(responses));
      }
      if (onNextTab) {
        setTimeout(() => onNextTab(), 300);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Нөхцөл баталгаажуулалт хадгалахад алдаа гарлаа.",
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // CRITICAL ITEMS
  // ============================================================

  const criticalItems = items.filter((item) => item.critical);
  const allCriticalMet = criticalItems.every((item) => {
    const response = responses[item.id];
    return response?.response_status === "met";
  });

  const allRequiredMet = requiredItems.every((item) => {
    const response = responses[item.id];
    return response?.response_status === "met";
  });

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  // ============================================================
  // LOADING
  // ============================================================

  if (loading || profilesLoading) {
    return (
      <section className="rounded-xl border bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-500">Ачааллаж байна...</p>
      </section>
    );
  }

  // ============================================================
  // VIEW MODE
  // ============================================================

  if (mode === "view") {
    const groupedItems: Record<string, ChecklistItem[]> = {};
    items.forEach((item) => {
      if (!groupedItems[item.group_name]) {
        groupedItems[item.group_name] = [];
      }
      groupedItems[item.group_name].push(item);
    });

    const hasResponses = Object.keys(responses).length > 0;

    return (
      <div className="space-y-4">
        <div className="rounded-lg border p-3 dark:border-gray-700">
          <span className="text-sm text-gray-500">Стратеги:</span>
          <span className="ml-2 text-sm font-medium">
            {selectedProfile?.name}
          </span>
        </div>

        {GROUPS.map((group) => {
          const groupItems = items.filter(
            (item) => item.group_name === group.id,
          );
          if (groupItems.length === 0) return null;

          return (
            <div key={group.id}>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">
                {group.label}
              </h3>
              <div className="space-y-2">
                {groupItems.map((item) => {
                  const response = responses[item.id];
                  const status = response?.response_status;

                  const statusLabels: Record<string, string> = {
                    met: "✅ Тийм",
                    partially_met: "⚡ Хэсэг",
                    not_met: "❌ Үгүй",
                    not_applicable: "➖ N/A",
                  };

                  const statusColors: Record<string, string> = {
                    met: "text-green-600 dark:text-green-400",
                    partially_met: "text-yellow-600 dark:text-yellow-400",
                    not_met: "text-red-600 dark:text-red-400",
                    not_applicable: "text-gray-400",
                  };

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between rounded-lg border p-3 dark:border-gray-700 ${
                        item.critical
                          ? "border-red-200 dark:border-red-800"
                          : ""
                      }`}
                    >
                      <span className="text-sm">
                        {item.title}
                        {item.critical && (
                          <span className="ml-2 text-xs text-red-500 font-medium">
                            (Маш чухал)
                          </span>
                        )}
                      </span>
                      <span
                        className={`text-sm font-medium ${status ? statusColors[status] : "text-gray-400"}`}
                      >
                        {status ? statusLabels[status] : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {!hasResponses && (
          <p className="text-sm text-gray-400 text-center py-4">
            ⬜ Нөхцөл баталгаажуулалт бүртгэгдээгүй байна
          </p>
        )}

        {criticalItems.length > 0 && hasResponses && (
          <div
            className={`rounded-lg p-4 ${
              allCriticalMet
                ? "bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800"
                : "bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`font-bold ${allCriticalMet ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}
              >
                {allCriticalMet
                  ? "✅ Бүх маш чухал шалгуур хангагдсан"
                  : "❌ Маш чухал шалгуур хангагдаагүй"}
              </span>
              <span
                className={`text-xl font-bold ${allCriticalMet ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              >
                {allCriticalMet ? "✅ АРИЛЖАА" : "❌ АРИЛЖАА БАЙХГҮЙ"}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // CREATE/EDIT MODE
  // ============================================================

  return (
    <section className="rounded-xl border bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b p-5 dark:border-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">
              ✅ Арилжааны нөхцөл баталгаажуулалт
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Арилжаа хийхээс өмнөх нөхцөлийн шалгуурууд
            </p>
          </div>
          {criticalItems.length > 0 && (
            <span className="text-sm text-red-500 font-medium">
              {criticalItems.length} маш чухал
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Strategy Profile Selector */}
        <div className="rounded-lg border p-4 dark:border-gray-700">
          <label className="block text-sm font-medium mb-2">
            🎯 Стратеги сонгох
            {!isDraft && updatingStrategy && (
              <span className="ml-2 text-xs text-gray-400">
                Хадгалж байна...
              </span>
            )}
          </label>

          {isDraft && (
            <p className="text-xs text-blue-500 mb-2">
              ℹ️ Сонгосон стратегийн шалгууруудыг харуулна
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => {
                  setSelectedProfileId(profile.id);
                }}
                className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                  selectedProfileId === profile.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400"
                    : "border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                }`}
              >
                {profile.name}
                {profile.is_active && (
                  <span className="ml-2 text-xs text-green-500">✓</span>
                )}
              </button>
            ))}
          </div>

          {selectedProfile && (
            <p className="mt-2 text-xs text-gray-500">
              Сонгосон стратеги:{" "}
              <span className="font-medium">{selectedProfile.name}</span>
              {!isDraft && selectedProfile.is_active && (
                <span className="ml-2 text-green-500">✓ Идэвхтэй</span>
              )}
              {isDraft && (
                <span className="ml-2 text-blue-500">(шалгуур харуулах)</span>
              )}
            </p>
          )}
          {!selectedProfile && (
            <p className="mt-2 text-xs text-gray-500">
              {isDraft ? "Ерөнхий шалгуур харуулах" : "Ерөнхий шалгуур"}
            </p>
          )}
        </div>

        {items.length === 0 ? (
          <div className="rounded-lg border p-4 dark:border-gray-700">
            <p className="text-sm text-gray-500">
              {selectedProfile && `"${selectedProfile.name}" стратегид`} шалгуур
              байхгүй байна.
            </p>
          </div>
        ) : (
          <>
            {GROUPS.map((group) => {
              const groupItems = items.filter(
                (item) => item.group_name === group.id,
              );
              if (groupItems.length === 0) return null;

              return (
                <div key={group.id}>
                  <h3 className="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">
                    {group.label}
                    <span className="ml-2 text-xs text-gray-400">
                      ({groupItems.length})
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {groupItems.map((item) => {
                      const response = responses[item.id];
                      const isMet = response?.response_status === "met";
                      const isPartial =
                        response?.response_status === "partially_met";
                      const isNotMet = response?.response_status === "not_met";
                      const isNA =
                        response?.response_status === "not_applicable";

                      return (
                        <div
                          key={item.id}
                          className={`flex flex-wrap items-center gap-3 rounded-lg border p-3 ${
                            item.critical
                              ? "border-red-200 dark:border-red-800"
                              : "dark:border-gray-700"
                          }`}
                        >
                          <span className="flex-1 text-sm min-w-[150px]">
                            {item.title}
                            {item.critical && (
                              <span className="ml-2 text-xs text-red-500 font-medium">
                                (Маш чухал)
                              </span>
                            )}
                            {item.required && !item.critical && (
                              <span className="ml-2 text-xs text-blue-500">
                                (Шаардлагатай)
                              </span>
                            )}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            <button
                              className={`px-2 py-1 text-xs rounded ${
                                isMet
                                  ? "bg-green-500 text-white"
                                  : "border hover:bg-gray-100 dark:hover:bg-gray-700"
                              }`}
                              onClick={() =>
                                updateResponse(item.id, isMet ? null : "met")
                              }
                            >
                              ✅ Тийм
                            </button>
                            <button
                              className={`px-2 py-1 text-xs rounded ${
                                isPartial
                                  ? "bg-yellow-500 text-white"
                                  : "border hover:bg-gray-100 dark:hover:bg-gray-700"
                              }`}
                              onClick={() =>
                                updateResponse(
                                  item.id,
                                  isPartial ? null : "partially_met",
                                )
                              }
                            >
                              ⚡ Хэсэг
                            </button>
                            <button
                              className={`px-2 py-1 text-xs rounded ${
                                isNotMet
                                  ? "bg-red-500 text-white"
                                  : "border hover:bg-gray-100 dark:hover:bg-gray-700"
                              }`}
                              onClick={() =>
                                updateResponse(
                                  item.id,
                                  isNotMet ? null : "not_met",
                                )
                              }
                            >
                              ❌ Үгүй
                            </button>
                            <button
                              className={`px-2 py-1 text-xs rounded ${
                                isNA
                                  ? "bg-gray-500 text-white"
                                  : "border hover:bg-gray-100 dark:hover:bg-gray-700"
                              }`}
                              onClick={() =>
                                updateResponse(
                                  item.id,
                                  isNA ? null : "not_applicable",
                                )
                              }
                            >
                              ➖ N/A
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="mt-4 border-t pt-4 dark:border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">
                  Шаардлагатай шалгуур: {answeredRequired.length}/
                  {requiredItems.length}
                </span>
                <span
                  className={`text-sm font-medium ${progress === 100 ? "text-green-500" : "text-gray-500"}`}
                >
                  {progress}%
                </span>
              </div>

              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-2 rounded-full transition-all ${
                    progress === 100 ? "bg-green-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {isSetupComplete ? (
                <div className="mt-3 rounded-lg bg-green-50 p-3 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    ✅ Бүх шаардлагатай шалгуур хариулагдсан
                  </p>
                </div>
              ) : (
                <div className="mt-3 rounded-lg bg-yellow-50 p-3 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    ⚠️ {requiredItems.length - answeredRequired.length}{" "}
                    шаардлагатай шалгуур хариулагдаагүй байна
                  </p>
                </div>
              )}
            </div>

            {criticalItems.length > 0 && (
              <div
                className={`mt-6 rounded-lg p-4 ${
                  allCriticalMet
                    ? "bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800"
                    : "bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4
                      className={`font-bold ${
                        allCriticalMet
                          ? "text-green-700 dark:text-green-400"
                          : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      {allCriticalMet
                        ? "✅ Бүх маш чухал шалгуур хангагдсан"
                        : "❌ Маш чухал шалгуур хангагдаагүй"}
                    </h4>
                    {!allCriticalMet && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Хангагдаагүй:{" "}
                        {criticalItems
                          .filter((item) => {
                            const response = responses[item.id];
                            return response?.response_status !== "met";
                          })
                          .map((item) => item.title)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                  <div
                    className={`text-xl font-bold ${
                      allCriticalMet
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {allCriticalMet ? "✅ АРИЛЖАА" : "❌ АРИЛЖАА БАЙХГҮЙ"}
                  </div>
                </div>
              </div>
            )}

            {criticalItems.length === 0 && allRequiredMet && (
              <div className="mt-6 rounded-lg bg-green-50 p-4 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
                <p className="text-green-700 dark:text-green-400 font-medium">
                  ✅ Бүх шаардлагатай шалгуур хангагдсан
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-between border-t p-5 dark:border-gray-800">
        <div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {saved && !error && (
            <p className="text-sm text-green-500">
              ✅ Нөхцөл баталгаажуулалт хадгалагдлаа.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={saveAll}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Хадгалж байна..." : "💾 Хадгалах"}
        </button>
      </div>
    </section>
  );
}
