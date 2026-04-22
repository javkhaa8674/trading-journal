// app/(app)/withdrawals/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { getStatusColor, getStatusIcon } from "@/lib/utils/statusUtils";

type Account = {
  id: string;
  name: string;
  balance: number;
  mode: string;
  status: string;
};

type Withdrawal = {
  id: string;
  user_id: string;
  account_id: string;
  amount: number;
  method: "bank_transfer" | "crypto" | "paypal" | "other";
  status: "pending" | "completed" | "failed" | "cancelled";
  transaction_id?: string;
  description?: string;
  date: string;
  processed_at?: string;
  created_at: string;
};

type WithdrawalMethod = {
  id: string;
  name: string;
  icon: string;
  minAmount: number;
  maxAmount: number;
  processingTime: string;
  fee: number;
  accountField?: string;
  accountFieldLabel?: string;
};

const withdrawalMethods: WithdrawalMethod[] = [
  {
    id: "bank_transfer",
    name: "Bank Transfer",
    icon: "🏦",
    minAmount: 100,
    maxAmount: 50000,
    processingTime: "2-5 business days",
    fee: 0,
    accountField: "bank_account",
    accountFieldLabel: "Bank Account Number",
  },
  {
    id: "crypto",
    name: "Cryptocurrency",
    icon: "₿",
    minAmount: 50,
    maxAmount: 100000,
    processingTime: "10-30 minutes",
    fee: 1,
    accountField: "wallet_address",
    accountFieldLabel: "Wallet Address",
  },
  {
    id: "paypal",
    name: "PayPal",
    icon: "💙",
    minAmount: 10,
    maxAmount: 10000,
    processingTime: "1-2 business days",
    fee: 2.5,
    accountField: "paypal_email",
    accountFieldLabel: "PayPal Email",
  },
  {
    id: "other",
    name: "Other",
    icon: "💵",
    minAmount: 10,
    maxAmount: 5000,
    processingTime: "Varies",
    fee: 0,
    accountField: "account_details",
    accountFieldLabel: "Account Details",
  },
];

export default function WithdrawalsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    account_id: "",
    amount: 0,
    method: "bank_transfer" as WithdrawalMethod["id"],
    transaction_id: "",
    description: "",
    account_details: "",
  });

  // Load accounts and withdrawals
  useEffect(() => {
    const loadData = async () => {
      const user = await getCurrentUser();
      if (!user) return;

      // Load accounts
      const { data: accountsData } = await supabase
        .from("accounts")
        .select("id, name, balance, mode, status")
        .eq("user_id", user.id);

      setAccounts(accountsData || []);

      // Load withdrawals
      const { data: withdrawalsData } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      setWithdrawals(withdrawalsData || []);
      setLoading(false);
    };

    loadData();
  }, []);

  const selectedAccount = accounts.find((a) => a.id === formData.account_id);
  const selectedMethod = withdrawalMethods.find(
    (m) => m.id === formData.method,
  );

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

    if (!selectedAccount) {
      setError("Selected account not found");
      setSubmitting(false);
      return;
    }

    if (formData.amount > selectedAccount.balance) {
      setError(
        `Insufficient balance. Available: $${selectedAccount.balance.toLocaleString()}`,
      );
      setSubmitting(false);
      return;
    }

    if (selectedMethod) {
      if (formData.amount < selectedMethod.minAmount) {
        setError(`Minimum withdrawal amount is $${selectedMethod.minAmount}`);
        setSubmitting(false);
        return;
      }
      if (formData.amount > selectedMethod.maxAmount) {
        setError(`Maximum withdrawal amount is $${selectedMethod.maxAmount}`);
        setSubmitting(false);
        return;
      }
    }

    // Calculate fee
    const fee = selectedMethod
      ? (formData.amount * selectedMethod.fee) / 100
      : 0;
    const netAmount = formData.amount - fee;

    // Insert withdrawal
    const { data: withdrawalData, error: withdrawalError } = await supabase
      .from("withdrawals")
      .insert({
        user_id: user.id,
        account_id: formData.account_id,
        amount: formData.amount,
        method: formData.method,
        transaction_id: formData.transaction_id || null,
        description: formData.description || null,
        account_details: formData.account_details || null,
        status: "pending",
        date: new Date().toISOString(),
      })
      .select()
      .single();

    if (withdrawalError) {
      setError(withdrawalError.message);
      setSubmitting(false);
      return;
    }

    // Update account balance
    const { error: updateError } = await supabase
      .from("accounts")
      .update({ balance: selectedAccount.balance - netAmount })
      .eq("id", formData.account_id);

    if (updateError) {
      // Rollback - delete withdrawal
      await supabase.from("withdrawals").delete().eq("id", withdrawalData.id);
      setError("Failed to update account balance");
      setSubmitting(false);
      return;
    }

    setSuccess(
      `Withdrawal request of $${formData.amount.toFixed(2)} submitted successfully!`,
    );
    setShowForm(false);
    setFormData({
      account_id: "",
      amount: 0,
      method: "bank_transfer",
      transaction_id: "",
      description: "",
      account_details: "",
    });

    // Refresh data
    const { data: withdrawalsData } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    setWithdrawals(withdrawalsData || []);

    const { data: accountsData } = await supabase
      .from("accounts")
      .select("id, name, balance, mode")
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
      case "cancelled":
        return (
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
            ❌ Cancelled
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

  const totalWithdrawals = withdrawals.reduce(
    (sum, w) => sum + (w.status === "completed" ? w.amount : 0),
    0,
  );
  const pendingWithdrawals = withdrawals.reduce(
    (sum, w) => sum + (w.status === "pending" ? w.amount : 0),
    0,
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-2xl">💸</div>
          <div className="text-gray-500">Loading withdrawals...</div>
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
          <h1 className="text-2xl font-bold">Withdrawals</h1>
          <p className="text-sm text-gray-500">
            Request withdrawals from your trading accounts
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          <span className="text-lg">+</span>
          <span>Request Withdrawal</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-lg">💰</span>
            <span className="text-sm">Total Withdrawn</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-orange-600">
            ${totalWithdrawals.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-lg">⏳</span>
            <span className="text-sm">Pending</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-yellow-600">
            ${pendingWithdrawals.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-lg">📊</span>
            <span className="text-sm">Total Requests</span>
          </div>
          <div className="mt-2 text-2xl font-bold">{withdrawals.length}</div>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-lg">✅</span>
            <span className="text-sm">Completed</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-green-600">
            {withdrawals.filter((w) => w.status === "completed").length}
          </div>
        </div>
      </div>

      {/* Withdrawal Form */}
      {showForm && (
        <div className="rounded-lg border bg-white p-6 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold">Request Withdrawal</h2>
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
              {selectedAccount && formData.amount > selectedAccount.balance && (
                <p className="mt-1 text-xs text-red-500">
                  Insufficient balance. Available: $
                  {selectedAccount.balance.toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium">
                Withdrawal Method *
              </label>
              <div className="mt-1 grid grid-cols-2 gap-2 md:grid-cols-4">
                {withdrawalMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        method: method.id,
                        account_details: "",
                      })
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

            {selectedMethod && selectedMethod.accountField && (
              <div>
                <label className="block text-sm font-medium">
                  {selectedMethod.accountFieldLabel} *
                </label>
                <input
                  type="text"
                  value={formData.account_details}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      account_details: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border p-2"
                  placeholder={`Enter your ${selectedMethod.accountFieldLabel}`}
                  required
                />
              </div>
            )}

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

            {/* Fee Information */}
            {selectedMethod && selectedMethod.fee > 0 && (
              <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
                <div className="flex justify-between">
                  <span>Withdrawal Amount:</span>
                  <span>${formData.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Fee ({selectedMethod.fee}%):</span>
                  <span>
                    -$
                    {((formData.amount * selectedMethod.fee) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Net Amount:</span>
                  <span>
                    $
                    {(
                      formData.amount -
                      (formData.amount * selectedMethod.fee) / 100
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

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
                {submitting ? "Processing..." : "Submit Request"}
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

      {/* Withdrawals History Table */}
      <div className="rounded-lg border bg-white dark:bg-gray-900">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Withdrawal History</h2>
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
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No withdrawals yet. Click "Request Withdrawal" to add one.
                  </td>
                </tr>
              ) : (
                withdrawals.map((withdrawal) => {
                  const account = accounts.find(
                    (a) => a.id === withdrawal.account_id,
                  );
                  return (
                    <tr
                      key={withdrawal.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-4 py-3 text-sm">
                        {new Date(withdrawal.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {account?.name || withdrawal.account_id}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="flex items-center gap-1">
                          {getMethodIcon(withdrawal.method)}{" "}
                          {getMethodName(withdrawal.method)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-red-600">
                        -${withdrawal.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getStatusBadge(withdrawal.status)}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-xs">
                        {withdrawal.transaction_id || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdrawal Rules */}
      <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/20">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <h3 className="font-semibold">Withdrawal Rules</h3>
        </div>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
          <li>Minimum withdrawal amount varies by method</li>
          <li>Processing time depends on selected method</li>
          <li>Withdrawals are subject to review before processing</li>
          <li>
            Funded accounts must meet minimum trading days before withdrawal
          </li>
          <li>Withdrawal fees apply for some methods</li>
        </ul>
      </div>
    </div>
  );
}
