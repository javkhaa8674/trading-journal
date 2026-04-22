// app/(app)/deposits/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { Deposit, DepositMethod } from "@/types/deposit";
import { getStatusColor, getStatusIcon } from "@/lib/utils/statusUtils";

type Account = {
  id: string;
  name: string;
  balance: number;
  status: string;
};

const depositMethods: DepositMethod[] = [
  {
    id: "bank_transfer",
    name: "Bank Transfer",
    icon: "🏦",
    minAmount: 5,
    maxAmount: 50000,
    processingTime: "1-3 business days",
    fee: 0,
  },
  {
    id: "crypto",
    name: "Cryptocurrency",
    icon: "₿",
    minAmount: 5,
    maxAmount: 100000,
    processingTime: "10-30 minutes",
    fee: 0.5,
  },
  {
    id: "credit_card",
    name: "Credit Card",
    icon: "💳",
    minAmount: 5,
    maxAmount: 10000,
    processingTime: "Instant",
    fee: 2.9,
  },
  {
    id: "paypal",
    name: "PayPal",
    icon: "💙",
    minAmount: 5,
    maxAmount: 10000,
    processingTime: "Instant",
    fee: 3.5,
  },
  {
    id: "other",
    name: "Other",
    icon: "💵",
    minAmount: 1,
    maxAmount: 5000,
    processingTime: "Varies",
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
      setError("Please login first");
      setSubmitting(false);
      return;
    }

    if (!formData.account_id) {
      setError("Please select an account");
      setSubmitting(false);
      return;
    }

    if (formData.amount <= 0) {
      setError("Amount must be greater than 0");
      setSubmitting(false);
      return;
    }

    const selectedMethod = depositMethods.find((m) => m.id === formData.method);
    if (selectedMethod) {
      if (formData.amount < selectedMethod.minAmount) {
        setError(`Minimum amount is $${selectedMethod.minAmount}`);
        setSubmitting(false);
        return;
      }
      if (formData.amount > selectedMethod.maxAmount) {
        setError(`Maximum amount is $${selectedMethod.maxAmount}`);
        setSubmitting(false);
        return;
      }
    }

    // Calculate fee
    const fee = selectedMethod
      ? (formData.amount * selectedMethod.fee) / 100
      : 0;
    const netAmount = formData.amount - fee;

    // Insert deposit
    const { data: depositData, error: depositError } = await supabase
      .from("deposits")
      .insert({
        user_id: user.id,
        account_id: formData.account_id,
        amount: formData.amount,
        method: formData.method,
        transaction_id: formData.transaction_id || null,
        description: formData.description || null,
        status: "completed",
        date: new Date().toISOString(),
      })
      .select()
      .single();

    if (depositError) {
      setError(depositError.message);
      setSubmitting(false);
      return;
    }

    // Update account balance
    const { error: updateError } = await supabase
      .from("accounts")
      .update({
        balance: supabase.rpc("increment", {
          row_id: formData.account_id,
          amount: netAmount,
        }),
      })
      .eq("id", formData.account_id);

    if (updateError) {
      // Rollback - delete deposit
      await supabase.from("deposits").delete().eq("id", depositData.id);
      setError("Failed to update account balance");
      setSubmitting(false);
      return;
    }

    setSuccess(`Successfully deposited $${formData.amount.toFixed(2)}!`);
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
    switch (method) {
      case "bank_transfer":
        return "Bank Transfer";
      case "crypto":
        return "Crypto";
      case "credit_card":
        return "Credit Card";
      case "paypal":
        return "PayPal";
      default:
        return "Other";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
            ✅ Completed
          </span>
        );
      case "pending":
        return (
          <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-700">
            ⏳ Pending
          </span>
        );
      case "failed":
        return (
          <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
            ❌ Failed
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
            {status}
          </span>
        );
    }
  };

  const totalDeposits = deposits.reduce(
    (sum, d) => sum + (d.status === "completed" ? d.amount : 0),
    0,
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-2xl">🏦</div>
          <div className="text-gray-500">Loading deposits...</div>
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
          <h1 className="text-2xl font-bold">Deposits</h1>
          <p className="text-sm text-gray-500">
            Manage your account deposits and funding
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          <span className="text-lg">+</span>
          <span>New Deposit</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-lg">💰</span>
            <span className="text-sm">Total Deposits</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-green-600">
            ${totalDeposits.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-lg">📊</span>
            <span className="text-sm">Total Deposits (All Time)</span>
          </div>
          <div className="mt-2 text-2xl font-bold">{deposits.length}</div>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-lg">🏦</span>
            <span className="text-sm">Active Accounts</span>
          </div>
          <div className="mt-2 text-2xl font-bold">{accounts.length}</div>
        </div>
      </div>

      {/* Deposit Form */}
      {showForm && (
        <div className="rounded-lg border bg-white p-6 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold">New Deposit</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">
                Select Account *
              </label>
              <select
                value={formData.account_id}
                onChange={(e) =>
                  setFormData({ ...formData, account_id: e.target.value })
                }
                className="mt-1 w-full rounded-lg border p-2"
                required
              >
                <option value="">Select an account</option>
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
              <label className="block text-sm font-medium">Amount *</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
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
                  className="w-full rounded-lg border p-2 pl-7"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">
                Payment Method *
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
                        : "hover:border-gray-400"
                    }`}
                  >
                    <div className="text-2xl">{method.icon}</div>
                    <div className="mt-1 text-xs font-medium">
                      {method.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">
                Transaction ID (Optional)
              </label>
              <input
                type="text"
                value={formData.transaction_id}
                onChange={(e) =>
                  setFormData({ ...formData, transaction_id: e.target.value })
                }
                className="mt-1 w-full rounded-lg border p-2"
                placeholder="e.g., TXN-123456"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="mt-1 w-full rounded-lg border p-2"
                rows={2}
                placeholder="Additional notes..."
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
                {success}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {submitting ? "Processing..." : "Confirm Deposit"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border px-4 py-2 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Deposits History Table */}
      <div className="rounded-lg border bg-white dark:bg-gray-900">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Deposit History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Account
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Method
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Transaction ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {deposits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No deposits yet. Click <strong>New Deposit</strong> to add
                    one.
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
                      <td className="px-4 py-3 text-sm">
                        {new Date(deposit.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {account?.name || deposit.account_id}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="flex items-center gap-1">
                          {getMethodIcon(deposit.method)}{" "}
                          {getMethodName(deposit.method)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-green-600">
                        +${deposit.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getStatusBadge(deposit.status)}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-xs">
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
