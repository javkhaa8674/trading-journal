"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Account = {
  id: string;
  name: string;
  broker: string;
  mode: string;
  balance: number;
  status: string;
  created_at: string;
  last_trade_date?: string | null;
};

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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "achieved" | "closed">(
    "active",
  );

  useEffect(() => {
    const loadData = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.replace("/login");
        return;
      }

      setUser(userData.user);

      const { data } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      setAccounts(data || []);
      setLoading(false);
    };

    loadData();
  }, [router]);

  // Delete account
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

  // Format balance
  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(balance);
  };

  // Get mode badge color
  const getModeColor = (mode: string) => {
    switch (mode.toLowerCase()) {
      case "live":
        return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
      case "demo":
        return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // Filter accounts by status
  const activeAccounts = accounts.filter((acc) => acc.status === "active");
  const achievedAccounts = accounts.filter((acc) => acc.status === "achieved");
  const closedAccounts = accounts.filter((acc) => acc.status === "closed");

  // Render account cards
  const renderAccounts = (accountsToRender: Account[]) => {
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
        {accountsToRender.map((account) => (
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
            {/* Action Buttons Container */}
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
                {/* Edit Button - Always visible on mobile, visible on hover on desktop */}
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

                {/* Delete Button - Always visible on mobile, visible on hover on desktop */}
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
            <div className="mt-8 mb-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-blue-100 text-xl sm:text-2xl dark:bg-blue-950">
              {account.mode === "live"
                ? "💰"
                : account.mode === "backtest"
                  ? "📊"
                  : account.mode === "funded"
                    ? "🏆"
                    : account.mode === "challengeStep1"
                      ? "🚀"
                      : account.mode === "challengeStep2"
                        ? "🚀"
                        : "💻"}
            </div>

            {/* Account Name */}
            <h3 className="mb-1 text-base sm:text-lg font-semibold truncate pr-16">
              {account.name}
            </h3>

            {/* Broker */}
            <p className="text-xs sm:text-sm text-gray-500 truncate">
              {account.broker}
            </p>

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

            {/* Balance */}
            <div className="mt-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-500">Баланс</span>
                <span className="text-lg sm:text-xl font-bold text-green-600">
                  {formatBalance(account.balance)}
                </span>
              </div>
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
        ))}
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
      {/* Header */}
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

      {/* Tabs - Horizontal scroll on mobile */}
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

      {/* Content based on active tab */}
      <div>
        {activeTab === "active" && renderAccounts(activeAccounts)}
        {activeTab === "achieved" && renderAccounts(achievedAccounts)}
        {activeTab === "closed" && renderAccounts(closedAccounts)}
      </div>

      {/* Total Balance Summary - Responsive grid */}
      {activeAccounts.length > 0 && (
        <div className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <p className="text-xs opacity-90">Нийт баланс</p>
              <p className="text-base sm:text-2xl font-bold">
                {formatBalance(
                  activeAccounts.reduce((sum, acc) => sum + acc.balance, 0),
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
