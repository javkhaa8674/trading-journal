// src/app/accounts/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import Link from "next/link";

type Broker = {
  id: string;
  name: string;
  logo_url?: string | null;
  leverage?: string | null;
  website?: string | null;
  is_default?: boolean;
};

type Account = {
  id: string;
  name: string;
  broker: string;
  broker_id?: string | null;
  mode: string;
  balance: number;
  status: string;
  start_balance?: number;
};

export default function EditAccountPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [brokersLoading, setBrokersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Account | null>(null);
  const [regenerateName, setRegenerateName] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        // 1. Брокеруудыг татах
        const { data: brokersData, error: brokersError } = await supabase
          .from("brokers")
          .select("id, name, logo_url, leverage, website, is_default")
          .eq("user_id", user.id)
          .order("is_default", { ascending: false })
          .order("name", { ascending: true });

        if (brokersError) throw brokersError;
        setBrokers(brokersData || []);

        // 2. Дансны мэдээллийг татах
        const { data: accountData, error: accountError } = await supabase
          .from("accounts")
          .select("*")
          .eq("id", accountId)
          .eq("user_id", user.id)
          .single();

        if (accountError) throw accountError;

        setFormData(accountData);

        // 3. ✅ Дансны broker_id-ээр брокерыг сонгох
        if (accountData.broker_id) {
          const broker = brokersData?.find(
            (b) => b.id === accountData.broker_id,
          );
          setSelectedBroker(broker || null);
        } else if (accountData.broker) {
          // broker_id байхгүй бол нэрээр хайх
          const broker = brokersData?.find(
            (b) => b.name.toLowerCase() === accountData.broker?.toLowerCase(),
          );
          if (broker) {
            setSelectedBroker(broker);
            // broker_id-г шинэчлэх
            setFormData((prev) =>
              prev ? { ...prev, broker_id: broker.id } : null,
            );
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Алдаа гарлаа");
      } finally {
        setLoading(false);
        setBrokersLoading(false);
      }
    };

    loadData();
  }, [accountId, router]);

  // Generate account name
  const generateAccountName = (data: Account) => {
    const timestamp = new Date().toLocaleString();
    const modeText = data.mode;
    const brokerName = selectedBroker?.name || data.broker || "Брокергүй";
    return `${brokerName} ${modeText} $${data.balance.toLocaleString()} ${timestamp}`;
  };

  // Regenerate account name
  const regenerateAccountName = () => {
    if (!formData) return;
    const newName = generateAccountName(formData);
    setFormData({ ...formData, name: newName });
    setRegenerateName(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setSaving(true);
    setError(null);

    const user = await getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // Сонгосон брокерын мэдээлэл
    const selectedBrokerData = brokers.find((b) => b.id === formData.broker_id);
    const brokerName =
      selectedBrokerData?.name || formData.broker || "Брокергүй";

    const { error: updateError } = await supabase
      .from("accounts")
      .update({
        name: formData.name,
        broker: brokerName,
        broker_id: formData.broker_id || null,
        mode: formData.mode,
        balance: formData.balance,
        status: formData.status,
      })
      .eq("id", accountId)
      .eq("user_id", user.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      router.push("/accounts");
    }
  };

  // Handle broker change
  const handleBrokerChange = (brokerId: string) => {
    const broker = brokers.find((b) => b.id === brokerId);
    setSelectedBroker(broker || null);
    setFormData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        broker_id: brokerId,
        broker: broker?.name || "",
      };
    });
    setIsDropdownOpen(false);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-2xl">⏳</div>
          <div className="text-gray-500 dark:text-gray-400">
            Ачааллаж байна...
          </div>
        </div>
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg bg-red-50 p-6 text-center dark:bg-red-950/50">
          <div className="mb-2 text-4xl">😕</div>
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
            Алдаа гарлаа
          </h2>
          <p className="text-red-600 dark:text-red-400">
            {error || "Account not found"}
          </p>
          <button
            onClick={() => router.push("/accounts")}
            className="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 transition-colors"
          >
            Данс руу буцах
          </button>
        </div>
      </div>
    );
  }

  // ✅ Сонгогдсон брокер (дансны broker_id-ээр)
  const currentBroker = brokers.find((b) => b.id === formData.broker_id);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">✏️ Данс засах</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Account Name */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">
              Дансны нэр
            </label>
            <button
              type="button"
              onClick={() => setRegenerateName(true)}
              className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              🔄 Дахин үүсгэх
            </button>
          </div>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Формат: Брокер + Төрөл + Баланс + Огноо
          </p>
        </div>

        {/* Regenerate Confirmation */}
        {regenerateName && (
          <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-950/30 dark:border dark:border-yellow-800/50">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              Одоогийн утгууд дээр үндэслэн аккаунтын нэрийг дахин үүсгэх үү?
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={regenerateAccountName}
                className="rounded bg-yellow-500 px-3 py-1 text-xs text-white hover:bg-yellow-600"
              >
                Тийм, дахин үүсгэ
              </button>
              <button
                type="button"
                onClick={() => setRegenerateName(false)}
                className="rounded border px-3 py-1 text-xs hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Цуцлах
              </button>
            </div>
          </div>
        )}

        {/* Broker Select - Custom Dropdown with Logo */}
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">
            Брокер *
          </label>

          {brokersLoading ? (
            <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mt-1"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* ✅ Custom Dropdown - Сонгогдсон брокероо харуулна */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between p-2.5 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {currentBroker?.logo_url ? (
                      <img
                        src={currentBroker.logo_url}
                        alt={currentBroker.name}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-lg flex-shrink-0">🏦</span>
                    )}
                    <span className="text-sm truncate">
                      {currentBroker?.name || "Брокер сонгох"}
                    </span>
                    {currentBroker?.leverage && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded flex-shrink-0">
                        {currentBroker.leverage}
                      </span>
                    )}
                    {currentBroker?.is_default && (
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded flex-shrink-0">
                        ⭐ Default
                      </span>
                    )}
                  </div>
                  <span
                    className={`ml-2 flex-shrink-0 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                  >
                    ▾
                  </span>
                </button>

                {/* Dropdown List - Зөвхөн дарвал нээгдэнэ */}
                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {brokers.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        <span className="text-3xl block mb-2">🏢</span>
                        <p className="text-sm">Брокер бүртгэгдээгүй байна</p>
                      </div>
                    ) : (
                      brokers.map((broker) => (
                        <button
                          key={broker.id}
                          type="button"
                          onClick={() => handleBrokerChange(broker.id)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            broker.id === formData.broker_id
                              ? "bg-blue-50 dark:bg-blue-900/20"
                              : ""
                          }`}
                        >
                          {broker.logo_url ? (
                            <img
                              src={broker.logo_url}
                              alt={broker.name}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-200 dark:border-gray-600"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm flex-shrink-0">
                              {broker.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">
                                {broker.name}
                              </span>
                              {broker.is_default && (
                                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded flex-shrink-0">
                                  ⭐
                                </span>
                              )}
                            </div>
                            {broker.leverage && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                Хөшүүрэг: {broker.leverage}
                              </div>
                            )}
                          </div>
                          {broker.id === formData.broker_id && (
                            <span className="text-blue-500 flex-shrink-0">
                              ✓
                            </span>
                          )}
                        </button>
                      ))
                    )}

                    {/* Add new broker link */}
                    <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                      <Link
                        href="/brokers/new"
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <span>➕</span> Шинэ брокер нэмэх
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* ✅ Selected broker info - Сонгогдсон брокерын дэлгэрэнгүй */}
              {currentBroker && (
                <div className="flex items-center gap-3 p-3 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  {currentBroker.logo_url ? (
                    <img
                      src={currentBroker.logo_url}
                      alt={currentBroker.name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                      {currentBroker.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {currentBroker.name}
                      </span>
                      {currentBroker.is_default && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded flex-shrink-0">
                          ⭐ Default
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {currentBroker.leverage && (
                        <span>Хөшүүрэг: {currentBroker.leverage}</span>
                      )}
                      {currentBroker.website && (
                        <a
                          href={currentBroker.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          🔗 Вэбсайт
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mode */}
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">
            Төрөл *
          </label>
          <select
            value={formData.mode}
            onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
            className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="demo">💻 Demo</option>
            <option value="live">💰 Live</option>
            <option value="backtest">📊 Backtest</option>
            <option value="challengeStep1">🚀 Challenge Step 1</option>
            <option value="challengeStep2">🚀 Challenge Step 2</option>
            <option value="highStakeStep1">🏔️ HighStake Step 1</option>
            <option value="highStakeStep2">🏔️ HighStake Step 2</option>
            <option value="bootcampStep1">🏕️ Bootcamp Step 1</option>
            <option value="bootcampStep2">🏕️ Bootcamp Step 2</option>
            <option value="bootcampStep3">🏕️ Bootcamp Step 3</option>
            <option value="funded">🏆 Funded</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">
            Төлөв
          </label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="active">🟢 Active</option>
            <option value="achieved">🟡 Achieved</option>
            <option value="closed">🔴 Closed</option>
          </select>
        </div>

        {/* Balance */}
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">
            Баланс ($) *
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.balance}
            onChange={(e) =>
              setFormData({
                ...formData,
                balance: parseFloat(e.target.value) || 0,
              })
            }
            className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            required
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
            ❌ Алдаа: {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push("/accounts")}
            className="rounded-lg border px-4 py-2 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            ❌ Цуцлах
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "⏳ Хадгалж байна..." : "💾 Хадгалах"}
          </button>
        </div>
      </form>
    </div>
  );
}
