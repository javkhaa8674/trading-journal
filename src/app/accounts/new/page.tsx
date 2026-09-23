// src/app/accounts/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import Link from "next/link";
import { AccountFormData } from "@/types/accounts";
import { Broker } from "@/types/broker";

export default function CreateAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [brokersLoading, setBrokersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [formData, setFormData] = useState<AccountFormData>({
    name: "",
    broker: "",
    broker_name: "",
    broker_id: null,
    mode: "live",
    start_balance: 10000,
    initial_balance: 10000,
    target_balance: 11000,
    max_loss_limit: 9000,
    max_drawdown_percent: 10,
    status: "active",
    last_trade_date: null,
  });

  // Брокеруудыг татах
  useEffect(() => {
    const fetchBrokers = async () => {
      try {
        setBrokersLoading(true);
        const user = await getCurrentUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("brokers")
          .select("id, name, logo_url, leverage, website, is_default")
          .eq("user_id", user.id)
          .order("is_default", { ascending: false })
          .order("name", { ascending: true });

        if (error) throw error;
        setBrokers(data || []);

        const defaultBroker = data?.find((b) => b.is_default);
        if (defaultBroker) {
          setFormData((prev) => ({
            ...prev,
            broker_id: defaultBroker.id,
            broker: defaultBroker.name,
            broker_name: defaultBroker.name,
          }));
        }
      } catch (err) {
        console.error("Error fetching brokers:", err);
      } finally {
        setBrokersLoading(false);
      }
    };

    fetchBrokers();
  }, [router]);

  // Generate account name
  const generateAccountName = () => {
    const timestamp = new Date().toLocaleString();
    const modeText = formData.mode;
    const brokerName = formData.broker_name || "Брокергүй";
    return `${brokerName} ${modeText} $${formData.start_balance.toLocaleString()} ${timestamp}`;
  };

  // ✅ Start balance өөрчлөгдөхөд target болон loss limit-ийг шинэчлэх
  const handleStartBalanceChange = (value: number) => {
    const drawdownPercent = formData.max_drawdown_percent || 10;
    setFormData({
      ...formData,
      start_balance: value,
      initial_balance: value,
      target_balance: value * 1.1,
      max_loss_limit: value * (1 - drawdownPercent / 100),
    });
  };

  // ✅ Одоогийн баланс өөрчлөгдөхөд
  const handleCurrentBalanceChange = (value: number) => {
    setFormData({
      ...formData,
      initial_balance: value,
    });
  };

  // ✅ Drawdown percent өөрчлөгдөхөд
  const handleDrawdownChange = (percent: number) => {
    setFormData({
      ...formData,
      max_drawdown_percent: percent,
      max_loss_limit: formData.start_balance * (1 - percent / 100),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const user = await getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const selectedBroker = brokers.find((b) => b.id === formData.broker_id);
    const brokerName =
      selectedBroker?.name || formData.broker_name || "Брокергүй";

    const accountName = generateAccountName();

    const { error: insertError } = await supabase.from("accounts").insert({
      name: accountName,
      broker: brokerName,
      broker_id: formData.broker_id || null,
      mode: formData.mode,
      start_balance: formData.start_balance,
      initial_balance: formData.initial_balance,
      target_balance: formData.target_balance,
      max_loss_limit: formData.max_loss_limit,
      max_drawdown_percent: formData.max_drawdown_percent,
      status: formData.status,
      user_id: user.id,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
    } else {
      router.push("/accounts");
    }
  };

  const previewName = formData.broker_name ? generateAccountName() : "";
  const selectedBroker = brokers.find((b) => b.id === formData.broker_id);

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
      <h1 className="mb-6 text-2xl font-bold dark:text-white">
        📊 Шинэ данс үүсгэх
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Broker Select */}
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">
            Брокер сонгох *
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
              {/* Custom Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between p-2.5 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {selectedBroker?.logo_url ? (
                      <img
                        src={selectedBroker.logo_url}
                        alt={selectedBroker.name}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-lg flex-shrink-0">🏦</span>
                    )}
                    <span className="text-sm truncate">
                      {selectedBroker?.name || "Брокер сонгох"}
                    </span>
                    {selectedBroker?.leverage && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded flex-shrink-0">
                        {selectedBroker.leverage}
                      </span>
                    )}
                    {selectedBroker?.is_default && (
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
                          onClick={() => {
                            setFormData({
                              ...formData,
                              broker_id: broker.id,
                              broker: broker.name,
                              broker_name: broker.name,
                            });
                            setIsDropdownOpen(false);
                          }}
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

              {/* Selected broker info */}
              {selectedBroker && (
                <div className="flex items-center gap-3 p-3 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  {selectedBroker.logo_url ? (
                    <img
                      src={selectedBroker.logo_url}
                      alt={selectedBroker.name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                      {selectedBroker.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {selectedBroker.name}
                      </span>
                      {selectedBroker.is_default && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded flex-shrink-0">
                          ⭐ Default
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {selectedBroker.leverage && (
                        <span>Хөшүүрэг: {selectedBroker.leverage}</span>
                      )}
                      {selectedBroker.website && (
                        <a
                          href={selectedBroker.website}
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
                value={formData.start_balance}
                onChange={(e) =>
                  handleStartBalanceChange(parseFloat(e.target.value) || 0)
                }
                className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="10000"
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
                value={formData.initial_balance}
                onChange={(e) =>
                  handleCurrentBalanceChange(parseFloat(e.target.value) || 0)
                }
                className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="10000"
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
                value={formData.target_balance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    target_balance: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
              {formData.start_balance > 0 && (
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
                value={formData.max_drawdown_percent}
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
                value={formData.max_loss_limit}
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
          {formData.start_balance > 0 && (
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

        {/* Preview Account Name */}
        {previewName && (
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30 dark:border dark:border-blue-800/50">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Дансны нэр харагдах байдал:
            </p>
            <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
              {previewName}
            </p>
          </div>
        )}

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
            Цуцлах
          </button>
          <button
            type="submit"
            disabled={loading || !formData.broker_id || brokersLoading}
            className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Үүсгэж байна..." : "💾 Данс үүсгэх"}
          </button>
        </div>
      </form>
    </div>
  );
}
