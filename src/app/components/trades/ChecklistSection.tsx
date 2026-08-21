"use client";

import { useEffect, useState } from "react";
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
  initialStrategyProfileId?: string | null;
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
}: Props) {
  const { updateTradeStrategy } = useTrades();

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [responses, setResponses] = useState<Record<string, ChecklistResponse>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Strategy Profile state
  const [profiles, setProfiles] = useState<StrategyProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    initialStrategyProfileId || null,
  );
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [updatingStrategy, setUpdatingStrategy] = useState(false);

  // Load strategy profiles
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

      // If no profile selected, try to select active one
      if (!selectedProfileId && data && data.length > 0) {
        const active = data.find((p) => p.is_active);
        if (active) {
          setSelectedProfileId(active.id);
        } else {
          setSelectedProfileId(data[0].id);
        }
      }

      setProfilesLoading(false);
    }

    loadProfiles();
  }, []);

  // Load checklist items when profile changes
  useEffect(() => {
    async function loadChecklist() {
      setLoading(true);
      setError(null);

      const user = await getCurrentUser();
      if (!user) {
        setError("Хэрэглэгч олдсонгүй.");
        setLoading(false);
        return;
      }

      // Load checklist items - filter by selected strategy_profile_id
      let query = supabase
        .from("trade_checklist_items")
        .select("*")
        .eq("user_id", user.id);

      if (selectedProfileId) {
        query = query.eq("strategy_profile_id", selectedProfileId);
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

      // Load responses for this trade
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
  }, [tradeId, selectedProfileId]);

  // Update trade's strategy_profile_id when profile changes
  useEffect(() => {
    async function updateTradeStrategyProfile() {
      // Хэрэв profile сонгогдоогүй бол return
      if (!selectedProfileId) return;

      // Хэрэв аль хэдийн ижил profile байвал return
      if (selectedProfileId === initialStrategyProfileId) return;

      // Хэрэв profiles ачаалалгүй байвал return
      if (profilesLoading) return;

      setUpdatingStrategy(true);
      setError(null);

      try {
        console.log("🔄 Updating trade strategy to:", selectedProfileId);

        const result = await updateTradeStrategy(tradeId, selectedProfileId);

        console.log("📦 Update result:", result);

        if (result.error) {
          console.error("❌ Error updating trade strategy:", result.error);
          setError("Стратеги шинэчлэхэд алдаа гарлаа: " + result.error);
        } else {
          console.log("✅ Trade strategy updated successfully:", result.data);
          setSaved(true);
        }
      } catch (err) {
        console.error("💥 Unexpected error:", err);
        setError("Стратеги шинэчлэхэд алдаа гарлаа: " + String(err));
      } finally {
        setUpdatingStrategy(false);
      }
    }

    if (selectedProfileId && selectedProfileId !== initialStrategyProfileId) {
      updateTradeStrategyProfile();
    }
  }, [selectedProfileId, tradeId, initialStrategyProfileId, profilesLoading]);

  async function updateResponse(
    itemId: string,
    status: "met" | "partially_met" | "not_met" | "not_applicable" | null,
  ) {
    setSaved(false);
    setError(null);

    const user = await getCurrentUser();
    if (!user) return;

    const existing = responses[itemId];

    // If same status, toggle off (delete)
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
      // Update existing
      const { error } = await supabase
        .from("trade_checklist_responses")
        .update(payload)
        .eq("id", existing.id);

      if (!error) {
        setResponses({
          ...responses,
          [itemId]: { ...existing, response_status: status },
        });
        setSaved(true);
      }
    } else {
      // Insert new
      const { data, error } = await supabase
        .from("trade_checklist_responses")
        .insert({ ...payload, created_at: new Date().toISOString() })
        .select()
        .single();

      if (!error && data) {
        setResponses({
          ...responses,
          [itemId]: data,
        });
        setSaved(true);
      }
    }
  }

  // Critical items check
  const criticalItems = items.filter((item) => item.critical);
  const allCriticalMet = criticalItems.every((item) => {
    const response = responses[item.id];
    return response?.response_status === "met";
  });

  const requiredItems = items.filter((item) => item.required && !item.critical);
  const allRequiredMet = requiredItems.every((item) => {
    const response = responses[item.id];
    return response?.response_status === "met";
  });

  // Get selected profile name
  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  if (loading || profilesLoading) {
    return (
      <section className="rounded-xl border bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-500">
          Арилжааны нөхцөл баталгаажуулалт ачааллаж байна...
        </p>
      </section>
    );
  }

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
            {updatingStrategy && (
              <span className="ml-2 text-xs text-gray-400">
                Хадгалж байна...
              </span>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            {profiles.length === 0 ? (
              <p className="text-sm text-gray-500">
                Стратегийн профайл байхгүй байна.{" "}
                <a
                  href="/trading-plan"
                  className="text-blue-500 hover:underline"
                >
                  Төлөвлөгөө хуудас
                </a>
                -д очиж үүсгэнэ үү.
              </p>
            ) : (
              <>
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => setSelectedProfileId(profile.id)}
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
                <button
                  onClick={() => setSelectedProfileId(null)}
                  className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                    selectedProfileId === null
                      ? "border-gray-500 bg-gray-100 dark:bg-gray-700 dark:border-gray-400"
                      : "border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                  }`}
                >
                  📋 Ерөнхий
                </button>
              </>
            )}
          </div>
          {selectedProfile && (
            <p className="mt-2 text-xs text-gray-500">
              Сонгосон стратеги:{" "}
              <span className="font-medium">{selectedProfile.name}</span>
              {selectedProfile.is_active && (
                <span className="ml-2 text-green-500">✓ Идэвхтэй</span>
              )}
            </p>
          )}
          {!selectedProfile && (
            <p className="mt-2 text-xs text-gray-500">Ерөнхий шалгуур</p>
          )}
        </div>

        {items.length === 0 ? (
          <div className="rounded-lg border p-4 dark:border-gray-700">
            <p className="text-sm text-gray-500">
              {selectedProfile
                ? `"${selectedProfile.name}" стратегид`
                : "Ерөнхий"}{" "}
              шалгуур байхгүй байна.
            </p>
          </div>
        ) : (
          <>
            {/* Grouped Items */}
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

            {/* TRADE / NO TRADE Decision */}
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

            {saved && !error && (
              <p className="text-sm text-green-500">✅ Хадгалагдлаа.</p>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </>
        )}
      </div>
    </section>
  );
}
