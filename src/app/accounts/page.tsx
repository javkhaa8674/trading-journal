// src/app/accounts/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AccountWithBroker } from "@/types/accounts";

const getDaysInactive = (date?: string | null) => {
  if (!date) return null;
  const last = new Date(date);
  const now = new Date();
  return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
};

const getRemainingDays = (daysInactive: number | null) => {
  if (daysInactive === null) return 30;
  return Math.max(30 - daysInactive, 0);
};

const getRiskLevel = (remaining: number) => {
  if (remaining <= 5) return "critical";
  if (remaining <= 10) return "danger";
  if (remaining <= 20) return "warning";
  return "safe";
};

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountWithBroker[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "achieved" | "closed">(
    "active",
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          router.replace("/login");
          return;
        }

        setUser(userData.user);

        const { data: brokersData } = await supabase
          .from("brokers")
          .select("id, name, logo_url, leverage")
          .eq("user_id", userData.user.id);

        const { data: accountsData } = await supabase
          .from("accounts")
          .select("*")
          .eq("user_id", userData.user.id)
          .order("created_at", { ascending: false });

        const accountsWithLogo = (accountsData || []).map((account) => {
          const broker = brokersData?.find(
            (b) =>
              b.id === account.broker_id ||
              b.name.toLowerCase() === account.broker?.toLowerCase(),
          );

          const startBal =
            account.start_balance || account.initial_balance || 0;
          const currentBal = account.initial_balance || startBal;
          const drawdownPercent = account.max_drawdown_percent || 10;

          return {
            ...account,
            start_balance: startBal,
            initial_balance: currentBal,
            target_balance: account.target_balance || startBal * 1.1,
            max_loss_limit:
              account.max_loss_limit || startBal * (1 - drawdownPercent / 100),
            max_drawdown_percent: drawdownPercent,
            broker_logo: broker?.logo_url || null,
            broker_leverage: broker?.leverage || null,
          };
        });

        setAccounts(accountsWithLogo);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const deleteAccount = async (accountId: string) => {
    const { error } = await supabase
      .from("accounts")
      .delete()
      .eq("id", accountId)
      .eq("user_id", user?.id);

    if (error) {
      console.error("Delete error:", error);
      alert("Failed to delete account. Please try again.");
    } else {
      setAccounts(accounts.filter((acc) => acc.id !== accountId));
      setDeleteConfirm(null);
    }
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(balance);
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

  const getModeColor = (mode: string) => {
    switch (mode.toLowerCase()) {
      case "live":
        return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
      case "demo":
        return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";
      case "funded":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300";
      case "backtest":
        return "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // ============================================
  // ✅ PROGRESS ТООЦООЛОЛ (CENTERED 0%)
  // ============================================
  // Логик:
  // - 0% = start_balance (ТӨВД)
  // - +X% = target_balance (БАРУУН ТИЙШ ногоон)
  // - -X% = loss_limit (ЗҮҮН ТИЙШ улаан)
  //
  // Bar-ийн нийт хүрээ: loss_limit → target_balance
  // - loss_limit = 0% (bar-ийн зүүн зах)
  // - start_balance = lossZone% (төв)
  // - target_balance = 100% (bar-ийн баруун зах)
  // ============================================

  const getProgressData = (account: AccountWithBroker) => {
    const startBalance = account.start_balance || 0;
    const currentBalance = account.initial_balance || 0;
    const targetBalance = account.target_balance || 0;
    const lossLimit = account.max_loss_limit || 0;

    const totalRange = targetBalance - startBalance;
    const currentPosition = currentBalance - startBalance;

    const percentage =
      totalRange > 0 ? (currentPosition / totalRange) * 100 : 0;

    const profit = currentBalance - startBalance;
    const profitPercent = startBalance > 0 ? (profit / startBalance) * 100 : 0;

    const targetProfitPercent =
      startBalance > 0
        ? ((targetBalance - startBalance) / startBalance) * 100
        : 0;

    const drawdownPercent =
      startBalance > 0 ? ((lossLimit - startBalance) / startBalance) * 100 : 0;

    const distanceToLoss = currentBalance - lossLimit;
    const distanceToLossPercent =
      startBalance > 0
        ? ((currentBalance - lossLimit) / startBalance) * 100
        : 0;

    // ✅ 0% ҮРГЭЛЖ ТӨВД (50%)
    const startPosition = 50;

    // Одоогийн profit %
    const currentProfitPercent =
      startBalance > 0
        ? ((currentBalance - startBalance) / startBalance) * 100
        : 0;

    // ✅ Дүүргэлтийн өргөн (тусдаа масштаб)
    // Loss тал: |drawdownPercent| = 50% талбай
    // Profit тал: targetProfitPercent = 50% талбай

    let fillWidth = 0;
    let fillStart = startPosition;
    let isNegative = false;

    if (currentProfitPercent >= 0) {
      // Нэмэх - баруун тийш ногоон
      fillWidth =
        targetProfitPercent > 0
          ? (currentProfitPercent / targetProfitPercent) * 50
          : 0;
      fillStart = startPosition;
      isNegative = false;
    } else {
      // Хасах - зүүн тийш улаан
      fillWidth =
        Math.abs(drawdownPercent) > 0
          ? (Math.abs(currentProfitPercent) / Math.abs(drawdownPercent)) * 50
          : 0;
      fillStart = startPosition - fillWidth;
      isNegative = true;
    }

    fillWidth = Math.min(Math.max(fillWidth, 0), 50);
    fillStart = Math.min(Math.max(fillStart, 0), 100);

    return {
      startBalance,
      currentBalance,
      targetBalance,
      lossLimit,
      totalRange,
      percentage,
      profit,
      profitPercent,
      targetProfitPercent,
      drawdownPercent,
      distanceToLoss,
      distanceToLossPercent,
      startPosition,
      fillWidth,
      fillStart,
      isNegative,
      currentProfitPercent,
      displayPercent: currentProfitPercent,
    };
  };

  const activeAccounts = accounts.filter((acc) => acc.status === "active");
  const achievedAccounts = accounts.filter((acc) => acc.status === "achieved");
  const closedAccounts = accounts.filter((acc) => acc.status === "closed");

  const renderAccounts = (accountsToRender: AccountWithBroker[]) => {
    if (accountsToRender.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
          <div className="mb-2 text-4xl">📭</div>
          <h3 className="text-base font-semibold">Данс байхгүй</h3>
          <p className="text-sm text-gray-500">
            Энэ хэсэгт данс байхгүй байна.
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {accountsToRender.map((account) => {
          const progressData = getProgressData(account);

          return (
            <div
              key={account.id}
              className={`relative rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-gray-900
              ${
                account.last_trade_date &&
                !["live", "demo", "backtest"].includes(account.mode) &&
                getRemainingDays(getDaysInactive(account.last_trade_date)) <= 5
                  ? "border-red-400"
                  : ""
              }`}
            >
              {/* Action Buttons */}
              {deleteConfirm === account.id ? (
                <div className="absolute right-2 top-2 flex gap-1 sm:gap-2 z-10">
                  <button
                    onClick={() => deleteAccount(account.id)}
                    className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                  >
                    Устгах
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="rounded bg-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-400"
                  >
                    Цуцлах
                  </button>
                </div>
              ) : (
                <div className="absolute right-2 top-2 flex gap-1 sm:gap-2 z-10">
                  <Link
                    href={`/accounts/${account.id}`}
                    className="rounded p-1.5 bg-blue-100 text-blue-600 hover:bg-blue-200 sm:bg-transparent sm:hover:bg-blue-100 transition-colors"
                    title="Edit account"
                  >
                    <svg
                      className="w-4 h-4 sm:w-3.5 sm:h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </Link>
                  <button
                    onClick={() => setDeleteConfirm(account.id)}
                    className="rounded p-1.5 bg-red-100 text-red-600 hover:bg-red-200 sm:bg-transparent sm:hover:bg-red-100 transition-colors"
                    title="Delete account"
                  >
                    <svg
                      className="w-4 h-4 sm:w-3.5 sm:h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              )}

              {/* Account Icon */}
              <div className="mt-8 mb-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0 border-2 border-gray-200 dark:border-gray-600">
                {account.broker_logo ? (
                  <Image
                    src={account.broker_logo}
                    alt={account.broker}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent) {
                        parent.className =
                          "flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-lg sm:text-xl font-bold";
                        parent.textContent =
                          account.broker?.charAt(0).toUpperCase() || "?";
                      }
                    }}
                  />
                ) : (
                  <span className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                    {account.broker?.charAt(0).toUpperCase() || "?"}
                  </span>
                )}
              </div>

              {/* Account Name */}
              <h3 className="mb-1 text-base sm:text-lg font-semibold truncate pr-16">
                {account.name}
              </h3>

              {/* Broker */}
              <div className="flex items-center gap-2">
                {account.broker_logo && (
                  <Image
                    src={account.broker_logo}
                    alt={account.broker}
                    width={16}
                    height={16}
                    className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  {account.broker}
                  {account.broker_leverage && (
                    <span className="ml-1 text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                      {account.broker_leverage}
                    </span>
                  )}
                </p>
              </div>

              {/* Mode and Status Badges */}
              <div className="my-2 flex flex-wrap gap-1.5">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getModeColor(
                    account.mode,
                  )}`}
                >
                  {account.mode.toUpperCase()}
                </span>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    account.status === "active"
                      ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                      : account.status === "achieved"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                        : "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300"
                  }`}
                >
                  {account.status === "active"
                    ? "Active"
                    : account.status === "achieved"
                      ? "Achieved"
                      : "Closed"}
                </span>
              </div>

              {/* ✅ Progress Bar - ТӨВД 0% */}
              <div className="mt-3 border-t pt-3">
                {/* Current Balance */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Одоогийн баланс</span>
                  <span className="text-base sm:text-lg font-bold text-green-600">
                    {formatBalance(progressData.currentBalance)}
                  </span>
                </div>

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

                {/* ✅ Percentage label - дүүрсэн хэсгийн төвд, bar-ийн ГАДНА */}
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
                      {progressData.displayPercent >= 0 ? "+" : ""}
                      {progressData.displayPercent.toFixed(1)}%
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

                {/* Target achieved badge */}
                {progressData.currentProfitPercent >=
                  progressData.targetProfitPercent && (
                  <div className="mt-1 flex items-center justify-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-950 dark:text-green-300">
                      ✅ Зорилтод хүрсэн
                    </span>
                  </div>
                )}

                {/* In loss badge */}
                {progressData.isNegative && (
                  <div className="mt-1 flex items-center justify-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950 dark:text-red-300">
                      📉 Алдагдалд байна
                    </span>
                  </div>
                )}

                {/* Loss limit warning */}
                {progressData.distanceToLossPercent <= 3 &&
                  progressData.distanceToLoss > 0 && (
                    <div className="mt-1 flex items-center justify-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950 dark:text-red-300 animate-pulse">
                        ⚠️ Алдагдал хязгаарт ойрхон
                      </span>
                    </div>
                  )}
              </div>

              {/* Created Date */}
              <div className="mt-2 text-xs text-gray-400">
                Үүсгэсэн: {new Date(account.created_at).toLocaleDateString()}
              </div>

              {account.last_trade_date &&
                !["live", "demo", "backtest"].includes(account.mode) && (
                  <div className="mt-2 text-xs">
                    <div className="text-gray-500">
                      Сүүлд trade:{" "}
                      {new Date(account.last_trade_date).toLocaleDateString()}
                    </div>

                    <div className="mt-1">
                      {(() => {
                        const days = getDaysInactive(account.last_trade_date);
                        const remaining = getRemainingDays(days);
                        const risk = getRiskLevel(remaining);

                        return (
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                              risk === "critical"
                                ? "bg-red-100 text-red-700"
                                : risk === "danger"
                                  ? "bg-orange-100 text-orange-700"
                                  : risk === "warning"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                            }`}
                          >
                            Inactive account rule: {remaining} өдөр үлдсэн
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-2xl">🏦</div>
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Дансууд</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Арилжааны данснуудыг удирдах
          </p>
        </div>

        <button
          onClick={() => router.push("/accounts/new")}
          className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base text-white transition-colors hover:bg-blue-600"
        >
          <span className="text-base sm:text-lg">+</span>
          <span>Данс үүсгэх</span>
        </button>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <nav
          className="-mb-px flex space-x-4 sm:space-x-8 min-w-max"
          aria-label="Tabs"
        >
          <button
            onClick={() => setActiveTab("active")}
            className={`whitespace-nowrap border-b-2 py-2 px-1 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === "active"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Active
            <span className="ml-1.5 sm:ml-2 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {activeAccounts.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("achieved")}
            className={`whitespace-nowrap border-b-2 py-2 px-1 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === "achieved"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Achieved
            <span className="ml-1.5 sm:ml-2 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {achievedAccounts.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("closed")}
            className={`whitespace-nowrap border-b-2 py-2 px-1 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === "closed"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Closed
            <span className="ml-1.5 sm:ml-2 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {closedAccounts.length}
            </span>
          </button>
        </nav>
      </div>

      <div>
        {activeTab === "active" && renderAccounts(activeAccounts)}
        {activeTab === "achieved" && renderAccounts(achievedAccounts)}
        {activeTab === "closed" && renderAccounts(closedAccounts)}
      </div>

      {activeAccounts.length > 0 && (
        <div className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <p className="text-xs opacity-90">Нийт баланс</p>
              <p className="text-base sm:text-2xl font-bold">
                {formatBalance(
                  activeAccounts.reduce(
                    (sum, acc) => sum + (acc.initial_balance || 0),
                    0,
                  ),
                )}
              </p>
            </div>
            <div>
              <p className="text-xs opacity-90">Active</p>
              <p className="text-xl sm:text-2xl font-bold">
                {activeAccounts.length}
              </p>
            </div>
            <div>
              <p className="text-xs opacity-90">Achieved</p>
              <p className="text-xl sm:text-2xl font-bold">
                {achievedAccounts.length}
              </p>
            </div>
            <div>
              <p className="text-xs opacity-90">Closed</p>
              <p className="text-xl sm:text-2xl font-bold">
                {closedAccounts.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
