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
};

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-2xl">🏦</div>
          <div className="text-gray-500">Loading accounts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Дансууд</h1>
          <p className="text-sm text-gray-500">Арилжааны данснуудыг удирдах</p>
        </div>

        <button
          onClick={() => router.push("/accounts/new")}
          className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
        >
          <span className="text-lg">+</span>
          <span>Данс үүсгэх</span>
        </button>
      </div>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
          <div className="mb-2 text-5xl">🏦</div>
          <h3 className="text-lg font-semibold">Одоогоор данс байхгүй.</h3>
          <p className="mb-4 text-gray-500">
            Анхны арилжааны дансаа үүсгэнэ үү?
          </p>
          <button
            onClick={() => router.push("/accounts/new")}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            + Данс үүсгэх
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="group relative rounded-lg border bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-gray-900"
            >
              {/* Delete button (top right) */}
              {deleteConfirm === account.id ? (
                <div className="absolute right-3 top-3 flex gap-2">
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
                <button
                  onClick={() => setDeleteConfirm(account.id)}
                  className="absolute right-3 top-3 rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-red-100 hover:text-red-600 group-hover:opacity-100"
                  title="Delete account"
                >
                  🗑️
                </button>
              )}

              {/* Edit link */}
              <Link
                href={`/accounts/${account.id}`}
                className="absolute left-3 top-3 rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-blue-100 hover:text-blue-600 group-hover:opacity-100"
                title="Edit account"
              >
                ✏️
              </Link>

              {/* Account Icon */}
              <div className="mt-5 mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-2xl dark:bg-blue-950">
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
              <h3 className="mb-1 text-lg font-semibold">{account.name}</h3>

              {/* Broker */}
              <p className="text-sm text-gray-500">{account.broker}</p>

              {/* Mode Badge */}
              <div className="my-2">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getModeColor(
                    account.mode,
                  )}`}
                >
                  {account.mode.toUpperCase()}
                </span>
              </div>
              {/* Status */}
              <div className="my-2">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    account.status === "active"
                      ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                      : "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300"
                  }`}
                >
                  {account.status.toUpperCase()}
                </span>
              </div>

              {/* Balance */}
              <div className="mt-3 border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Баланс</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatBalance(account.balance)}
                  </span>
                </div>
              </div>

              {/* Created Date */}
              <div className="mt-2 text-xs text-gray-400">
                Үүсгэсэн: {new Date(account.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Total Balance Summary */}
      {accounts.length > 0 && (
        <div className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
          <div className="flex flex-wrap items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Нийт баланс (Бүх данс)</p>
              <p className="text-2xl font-bold">
                {formatBalance(
                  accounts.reduce((sum, acc) => sum + acc.balance, 0),
                )}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-90">Бүх данс</p>
              <p className="text-2xl font-bold text-center">
                {accounts.length}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-90">Идэвхтэй данс</p>
              <p className="text-2xl font-bold text-center">
                {accounts.filter((acc) => acc.status === "active").length}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-90">Архивласан данс</p>
              <p className="text-2xl font-bold text-center ">
                {accounts.filter((acc) => acc.status === "achieved").length}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-90">Хаагдсан данс</p>
              <p className="text-2xl font-bold text-center ">
                {accounts.filter((acc) => acc.status === "closed").length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
