// src/app/accounts/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import Link from "next/link";
import { Account } from "@/types/accounts";
import { Broker } from "@/types/broker";

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
          .select(
            "id, name, logo_url, leverage, website, is_default, user_id, created_at, updated_at",
          )
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

        // Хуучин өгөгдөлд шинэ талбарууд байхгүй бол default утга оноох
        const startBal =
          accountData.start_balance || accountData.initial_balance || 0;
        const currentBal = accountData.initial_balance || startBal;
        const drawdownPercent = accountData.max_drawdown_percent || 10;

        setFormData({
          ...accountData,
          start_balance: startBal,
          initial_balance: currentBal,
          target_balance: accountData.target_balance || startBal * 1.1,
          max_loss_limit:
            accountData.max_loss_limit ||
            startBal * (1 - drawdownPercent / 100),
          max_drawdown_percent: drawdownPercent,
        });

        // 3. Дансны broker_id-ээр брокерыг сонгох
        if (accountData.broker_id) {
          const broker = brokersData?.find(
            (b) => b.id === accountData.broker_id,
          );
          setSelectedBroker(broker || null);
        } else if (accountData.broker) {
          const broker = brokersData?.find(
            (b) => b.name.toLowerCase() === accountData.broker?.toLowerCase(),
          );
          if (broker) {
            setSelectedBroker(broker);
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
    return `${brokerName} ${modeText} $${data.start_balance.toLocaleString()} ${timestamp}`;
  };

  const regenerateAccountName = () => {
    if (!formData) return;
    const newName = generateAccountName(formData);
    setFormData({ ...formData, name: newName });
    setRegenerateName(false);
  };

  // ✅ Start balance өөрчлөгдөхөд target болон loss limit-ийг шинэчлэх
  const handleStartBalanceChange = (value: number) => {
    if (!formData) return;
    const drawdownPercent = formData.max_drawdown_percent || 10;
    setFormData({
      ...formData,
      start_balance: value,
      target_balance: value * 1.1,
      max_loss_limit: value * (1 - drawdownPercent / 100),
    });
  };

  // ✅ Одоогийн баланс өөрчлөгдөхөд
  const handleCurrentBalanceChange = (value: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      initial_balance: value,
    });
  };

  // ✅ Drawdown percent өөрчлөгдөхөд
  const handleDrawdownChange = (percent: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      max_drawdown_percent: percent,
      max_loss_limit: (formData.start_balance || 0) * (1 - percent / 100),
    });
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
        start_balance: formData.start_balance,
        initial_balance: formData.initial_balance,
        target_balance: formData.target_balance,
        max_loss_limit: formData.max_loss_limit,
        max_drawdown_percent: formData.max_drawdown_percent,
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

  const currentBroker = brokers.find((b) => b.id === formData.broker_id);

  // ============================================
  // ✅ PROGRESS ТООЦООЛОЛ (CENTERED 0%)
  // ============================================
  const getProgressData = () => {
    const startBalance = formData.start_balance || 0;
    const currentBalance = formData.initial_balance || 0;
    const targetBalance = formData.target_balance || 0;
    const lossLimit = formData.max_loss_limit || 0;

    const targetProfitPercent =
      startBalance > 0
        ? ((targetBalance - startBalance) / startBalance) * 100
        : 0;

    const drawdownPercent =
      startBalance > 0 ? ((lossLimit - startBalance) / startBalance) * 100 : 0;

    const currentProfitPercent =
      startBalance > 0
        ? ((currentBalance - startBalance) / startBalance) * 100
        : 0;

    // 0% үргэлж төвд (50%)
    const startPosition = 50;

    let fillWidth = 0;
    let fillStart = startPosition;
    let isNegative = false;

    if (currentProfitPercent >= 0) {
      fillWidth =
        targetProfitPercent > 0
          ? (currentProfitPercent / targetProfitPercent) * 50
          : 0;
      fillStart = startPosition;
      isNegative = false;
    } else {
      fillWidth =
        Math.abs(drawdownPercent) > 0
          ? (Math.abs(currentProfitPercent) / Math.abs(drawdownPercent)) * 50
          : 0;
      fillStart = startPosition - fillWidth;
      isNegative = true;
    }

    fillWidth = Math.min(Math.max(fillWidth, 0), 50);
    fillStart = Math.min(Math.max(fillStart, 0), 100);

    const distanceToLoss = currentBalance - lossLimit;
    const distanceToLossPercent =
      startBalance > 0
        ? ((currentBalance - lossLimit) / startBalance) * 100
        : 0;

    const profit = currentBalance - startBalance;
    const profitPercent = startBalance > 0 ? (profit / startBalance) * 100 : 0;

    return {
      startBalance,
      currentBalance,
      targetBalance,
      lossLimit,
      targetProfitPercent,
      drawdownPercent,
      currentProfitPercent,
      startPosition,
      fillWidth,
      fillStart,
      isNegative,
      distanceToLoss,
      distanceToLossPercent,
      profit,
      profitPercent,
    };
  };

  const progressData = getProgressData();

  // Format functions
  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatCompact = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

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

        {/* Broker Select */}
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
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between p-2.5 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {currentBroker?.logo_url ? (
                      <Image
                        src={currentBroker.logo_url}
                        alt={currentBroker.name}
                        width={24}
                        height={24}
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
                        ⭐
                      </span>
                    )}
                  </div>
                  <span
                    className={`ml-2 flex-shrink-0 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  >
                    ▾
                  </span>
                </button>

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
                            <Image
                              src={broker.logo_url}
                              alt={broker.name}
                              width={32}
                              height={32}
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

              {currentBroker && (
                <div className="flex items-center gap-3 p-3 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  {currentBroker.logo_url ? (
                    <Image
                      src={currentBroker.logo_url}
                      alt={currentBroker.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
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

        {/* ✅ Financial Section */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            💰 Санхүүгийн мэдээлэл
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start Balance */}
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                📌 Данс эхлэх баланс ($) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.start_balance || 0}
                onChange={(e) =>
                  handleStartBalanceChange(parseFloat(e.target.value) || 0)
                }
                className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Энэ нь <strong>0%</strong> цэг болно (тогтмол)
              </p>
            </div>

            {/* Current Balance */}
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                💵 Одоогийн баланс ($) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.initial_balance || 0}
                onChange={(e) =>
                  handleCurrentBalanceChange(parseFloat(e.target.value) || 0)
                }
                className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Одоогийн байрлал{" "}
                {progressData.currentProfitPercent !== 0 && (
                  <span
                    className={`font-medium ${
                      progressData.currentProfitPercent > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    ({progressData.currentProfitPercent > 0 ? "+" : ""}
                    {progressData.currentProfitPercent.toFixed(2)}%)
                  </span>
                )}
              </p>
            </div>

            {/* Target Balance */}
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                🎯 Зорилтот баланс ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.target_balance || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    target_balance: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
              {progressData.startBalance > 0 && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Энэ нь{" "}
                  <strong>
                    +{progressData.targetProfitPercent.toFixed(1)}%
                  </strong>{" "}
                  (100% progress)
                </p>
              )}
            </div>

            {/* Max Drawdown Percent */}
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                🛑 Алдагдал хязгаар (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={formData.max_drawdown_percent || 10}
                onChange={(e) =>
                  handleDrawdownChange(parseFloat(e.target.value) || 0)
                }
                className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                Энэ нь <strong>-{formData.max_drawdown_percent}%</strong> цэг
                болно
              </p>
            </div>

            {/* Max Loss Limit */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                Алдагдал хязгаар ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.max_loss_limit || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_loss_limit: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                Данс автоматаар хаагдах үлдэгдэл
              </p>
            </div>
          </div>

          {/* ✅ Visual Preview - Progress Bar */}
          {progressData.startBalance > 0 && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                📊 Одоогийн байрлал:
              </p>

              {/* Percent labels */}
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-red-500 font-medium">
                  {progressData.drawdownPercent.toFixed(0)}%
                </span>
                <span className="text-gray-500 font-bold">0%</span>
                <span className="text-green-600 font-medium">
                  +{progressData.targetProfitPercent.toFixed(0)}%
                </span>
              </div>

              {/* Progress bar container */}
              <div className="relative h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                {/* Loss zone background */}
                <div
                  className="absolute inset-y-0 left-0 bg-gray-100 dark:bg-gray-950/50"
                  style={{ width: `${progressData.startPosition}%` }}
                />

                {/* Profit zone background */}
                <div
                  className="absolute inset-y-0 bg-gray-100 dark:bg-gray-950/50"
                  style={{
                    left: `${progressData.startPosition}%`,
                    right: 0,
                  }}
                />

                {/* Progress fill */}
                <div
                  className={`absolute inset-y-0 transition-all duration-500 ${
                    progressData.isNegative ? "bg-red-500" : "bg-green-500"
                  }`}
                  style={{
                    left: `${progressData.fillStart}%`,
                    width: `${progressData.fillWidth}%`,
                  }}
                />

                {/* 0% marker */}
                <div
                  className="absolute inset-y-0 w-0.5 bg-gray-700 dark:bg-white z-20"
                  style={{ left: `${progressData.startPosition}%` }}
                  title={`Эхлэл: ${formatBalance(progressData.startBalance)}`}
                />
              </div>

              {/* ✅ Percentage label - дүүрсэн хэсгийн төвд */}
              <div className="relative h-5 mt-0.5">
                {progressData.fillWidth > 0 && (
                  <div
                    className={`absolute text-[10px] font-bold whitespace-nowrap transition-all duration-500 ${
                      progressData.isNegative
                        ? "text-red-500"
                        : "text-green-600"
                    }`}
                    style={{
                      left: `${progressData.fillStart + progressData.fillWidth / 2}%`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    {progressData.currentProfitPercent >= 0 ? "+" : ""}
                    {progressData.currentProfitPercent.toFixed(1)}%
                  </div>
                )}
              </div>

              {/* Labels under bar */}
              <div className="flex items-center justify-between text-[9px] mt-0.5">
                <span className="text-red-500">
                  🛑 {formatCompact(progressData.lossLimit)}
                </span>
                <span className="text-gray-500">
                  Эхлэл: {formatCompact(progressData.startBalance)}
                </span>
                <span className="text-green-600">
                  🎯 {formatCompact(progressData.targetBalance)}
                </span>
              </div>

              {/* Distance to loss limit */}
              <div className="mt-1.5 flex items-center justify-between text-[10px]">
                <span className="text-gray-500">
                  🔻 Алдагдал хязгаар хүртэл
                </span>
                <span
                  className={`font-medium ${
                    progressData.distanceToLossPercent <= 3
                      ? "text-red-600 dark:text-red-400"
                      : progressData.distanceToLossPercent <= 7
                        ? "text-orange-600 dark:text-orange-400"
                        : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {"-"}
                  {formatBalance(progressData.distanceToLoss)} (
                  {progressData.distanceToLossPercent.toFixed(1)}%)
                </span>
              </div>

              {/* Profit/Loss */}
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {progressData.profit >= 0 ? "Ашиг" : "Алдагдал"}
                </span>
                <span
                  className={`font-semibold ${
                    progressData.profit >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {progressData.profit >= 0 ? "+" : ""}
                  {formatBalance(progressData.profit)}
                  <span className="ml-1 text-[10px] opacity-80">
                    ({progressData.profitPercent >= 0 ? "+" : ""}
                    {progressData.profitPercent.toFixed(2)}%)
                  </span>
                </span>
              </div>

              {/* Badges */}
              {progressData.currentProfitPercent >=
                progressData.targetProfitPercent && (
                <div className="mt-1 flex items-center justify-center">
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-950 dark:text-green-300">
                    ✅ Зорилтод хүрсэн
                  </span>
                </div>
              )}

              {progressData.isNegative && (
                <div className="mt-1 flex items-center justify-center">
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950 dark:text-red-300">
                    📉 Алдагдалд байна
                  </span>
                </div>
              )}

              {progressData.distanceToLossPercent <= 3 &&
                progressData.distanceToLoss > 0 && (
                  <div className="mt-1 flex items-center justify-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950 dark:text-red-300 animate-pulse">
                      ⚠️ Алдагдал хязгаарт ойрхон
                    </span>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">
            Төлөв
          </label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as "active" | "achieved" | "closed",
              })
            }
            className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="active">🟢 Active</option>
            <option value="achieved">🟡 Achieved</option>
            <option value="closed">🔴 Closed</option>
          </select>
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
