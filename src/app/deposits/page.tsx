// app/(app)/deposits/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { DepositMethod } from "@/types/deposit";
import { getStatusColor, getStatusIcon } from "@/lib/utils/statusUtils";

type Account = {
  id: string;
  name: string;
  balance: number;
  status: string;
};

type Deposit = {
  id: string;
  user_id: string;
  account_id: string;
  amount: number;
  method: "bank_transfer" | "crypto" | "credit_card" | "paypal" | "other";
  transaction_id?: string;
  description?: string;
  date: string;
  created_at: string;
};

const depositMethods: DepositMethod[] = [
  {
    id: "bank_transfer",
    name: "Bank Transfer",
    nameMn: "Банкны шилжүүлэг",
    icon: "🏦",
    minAmount: 5,
    maxAmount: 50000,
    processingTime: "1-3 business days",
    processingTimeMn: "1-3 ажлын өдөр",
    fee: 0,
  },
  {
    id: "crypto",
    name: "Cryptocurrency",
    nameMn: "Крипто валют",
    icon: "₿",
    minAmount: 5,
    maxAmount: 100000,
    processingTime: "10-30 minutes",
    processingTimeMn: "10-30 минут",
    fee: 0.5,
  },
  {
    id: "credit_card",
    name: "Credit Card",
    nameMn: "Зээлийн карт",
    icon: "💳",
    minAmount: 5,
    maxAmount: 10000,
    processingTime: "Instant",
    processingTimeMn: "Шуурхай",
    fee: 2.9,
  },
  {
    id: "paypal",
    name: "PayPal",
    nameMn: "PayPal",
    icon: "💙",
    minAmount: 5,
    maxAmount: 10000,
    processingTime: "Instant",
    processingTimeMn: "Шуурхай",
    fee: 3.5,
  },
  {
    id: "other",
    name: "Other",
    nameMn: "Бусад",
    icon: "💵",
    minAmount: 1,
    maxAmount: 5000,
    processingTime: "Varies",
    processingTimeMn: "Хувьсах",
    fee: 0,
  },
];

export default function DepositsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    account_id: "",
    amount: 0,
    method: "bank_transfer" as DepositMethod["id"],
    transaction_id: "",
    description: "",
  });

  // Load accounts and deposits
  useEffect(() => {
    const loadData = async () => {
      const user = await getCurrentUser();
      if (!user) return;

      // Load accounts
      const { data: accountsData } = await supabase
        .from("accounts")
        .select("id, name, balance, status")
        .eq("user_id", user.id);

      setAccounts(accountsData || []);

      // Load deposits
      const { data: depositsData } = await supabase
        .from("deposits")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      setDeposits(depositsData || []);
      setLoading(false);
    };

    loadData();
  }, []);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const user = await getCurrentUser();
    if (!user) {
      setError("Нэвтрэнэ үү / Please login first");
      setSubmitting(false);
      return;
    }

    if (!formData.account_id) {
      setError("Дансаа сонгоно уу / Please select an account");
      setSubmitting(false);
      return;
    }

    if (formData.amount <= 0) {
      setError("Дүн 0-с их байх ёстой / Amount must be greater than 0");
      setSubmitting(false);
      return;
    }

    const selectedMethod = depositMethods.find((m) => m.id === formData.method);
    if (selectedMethod) {
      if (formData.amount < selectedMethod.minAmount) {
        setError(
          `Хамгийн бага дүн: $${selectedMethod.minAmount} / Minimum amount is $${selectedMethod.minAmount}`,
        );
        setSubmitting(false);
        return;
      }
      if (formData.amount > selectedMethod.maxAmount) {
        setError(
          `Хамгийн их дүн: $${selectedMethod.maxAmount} / Maximum amount is $${selectedMethod.maxAmount}`,
        );
        setSubmitting(false);
        return;
      }
    }

    // Insert deposit (status хадгалахгүй, balance шинэчлэхгүй)
    const { error: depositError } = await supabase.from("deposits").insert({
      user_id: user.id,
      account_id: formData.account_id,
      amount: formData.amount,
      method: formData.method,
      transaction_id: formData.transaction_id || null,
      description: formData.description || null,
      date: new Date().toISOString(),
    });

    if (depositError) {
      setError(depositError.message);
      setSubmitting(false);
      return;
    }

    setSuccess(
      `✅ $${formData.amount.toFixed(2)} амжилттай хадгалагдлаа! / Successfully deposited $${formData.amount.toFixed(2)}!`,
    );
    setShowForm(false);
    setFormData({
      account_id: "",
      amount: 0,
      method: "bank_transfer",
      transaction_id: "",
      description: "",
    });

    // Refresh data
    const { data: depositsData } = await supabase
      .from("deposits")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    setDeposits(depositsData || []);

    const { data: accountsData } = await supabase
      .from("accounts")
      .select("id, name, balance, status")
      .eq("user_id", user.id);

    setAccounts(accountsData || []);

    setSubmitting(false);
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return "🏦";
      case "crypto":
        return "₿";
      case "credit_card":
        return "💳";
      case "paypal":
        return "💙";
      default:
        return "💵";
    }
  };

  const getMethodName = (method: string) => {
    const m = depositMethods.find((m) => m.id === method);
    return m ? m.nameMn : "Бусад";
  };

  const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-2xl">🏦</div>
          <div className="text-gray-500 dark:text-gray-400">
            Ачааллаж байна...
          </div>
        </div>
      </div>
    );
  }

  const filteredAccounts = accounts.filter((acc) => acc.status === "active");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">💰 Хадгаламж</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Дансны хадгаламж, санхүүжилтээ удирдах
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          <span className="text-lg">+</span>
          <span>Шинэ хадгаламж</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <span className="text-lg">💰</span>
            <span className="text-sm">Нийт хадгаламж</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
            ${totalDeposits.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <span className="text-lg">📊</span>
            <span className="text-sm">Нийт гүйлгээ</span>
          </div>
          <div className="mt-2 text-2xl font-bold dark:text-white">
            {deposits.length}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <span className="text-lg">🏦</span>
            <span className="text-sm">Идэвхтэй дансууд</span>
          </div>
          <div className="mt-2 text-2xl font-bold dark:text-white">
            {filteredAccounts.length}
          </div>
        </div>
      </div>

      {/* Deposit Form */}
      {showForm && (
        <div className="rounded-lg border bg-white p-6 dark:bg-gray-900 dark:border-gray-800">
          <h2 className="mb-4 text-lg font-semibold dark:text-white">
            📝 Шинэ хадгаламж
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium dark:text-gray-300">
                🏦 Данс сонгох *
              </label>
              <select
                value={formData.account_id}
                onChange={(e) =>
                  setFormData({ ...formData, account_id: e.target.value })
                }
                className="mt-1 w-full rounded-lg border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                required
              >
                <option value="">📋 Данс сонгох</option>
                {filteredAccounts.map((acc) => (
                  <option
                    key={acc.id}
                    value={acc.id}
                    className={getStatusColor(acc.status)}
                  >
                    {getStatusIcon(acc.status)} {acc.name}
                    {acc.status !== "active" && ` (${acc.status})`}
                    {acc.status === "active" &&
                      ` - $${acc.balance.toLocaleString()}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-gray-300">
                💰 Дүн *
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={formData.amount || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: parseFloat(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border p-2 pl-7 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-gray-300">
                💳 Төлбөрийн хэрэгсэл *
              </label>
              <div className="mt-1 grid grid-cols-2 gap-2 md:grid-cols-5">
                {depositMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, method: method.id })
                    }
                    className={`rounded-lg border p-3 text-center transition-all ${
                      formData.method === method.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "hover:border-gray-400 dark:border-gray-700"
                    }`}
                  >
                    <div className="text-2xl">{method.icon}</div>
                    <div className="mt-1 text-xs font-medium">
                      {method.nameMn}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-gray-300">
                🔢 Гүйлгээний ID (Нэмэлт)
              </label>
              <input
                type="text"
                value={formData.transaction_id}
                onChange={(e) =>
                  setFormData({ ...formData, transaction_id: e.target.value })
                }
                className="mt-1 w-full rounded-lg border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="e.g., TXN-123456"
              />
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-gray-300">
                📝 Тайлбар (Нэмэлт)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="mt-1 w-full rounded-lg border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                rows={2}
                placeholder="Нэмэлт мэдээлэл..."
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-950/50 dark:text-green-400">
                ✅ {success}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {submitting ? "Боловсруулж байна..." : "✅ Хадгалах / Deposit"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border px-4 py-2 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                ❌ Цуцлах
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Deposits History Table */}
      <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-800">
        <div className="border-b p-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold dark:text-white">
            📋 Хадгаламжийн түүх
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-300">
                  📅 Огноо
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-300">
                  🏦 Данс
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-300">
                  💳 Төлбөрийн хэрэгсэл
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium dark:text-gray-300">
                  💰 Дүн
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium dark:text-gray-300">
                  🔢 Гүйлгээний ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {deposits.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    📭 Хадгаламж байхгүй.
                    <br />
                    ✏️ &quot;Шинэ хадгаламж&quot; товч дарж нэмэх.
                  </td>
                </tr>
              ) : (
                deposits.map((deposit) => {
                  const account = accounts.find(
                    (a) => a.id === deposit.account_id,
                  );
                  return (
                    <tr
                      key={deposit.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-4 py-3 text-sm dark:text-gray-300">
                        {new Date(deposit.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm dark:text-gray-300">
                        {account?.name || deposit.account_id}
                      </td>
                      <td className="px-4 py-3 text-sm dark:text-gray-300">
                        <span className="flex items-center gap-1">
                          {getMethodIcon(deposit.method)}{" "}
                          {getMethodName(deposit.method)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-green-600 dark:text-green-400">
                        +${deposit.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-xs dark:text-gray-400">
                        {deposit.transaction_id || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
