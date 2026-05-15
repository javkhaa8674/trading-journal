"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

type WithdrawalMethod = {
  id: string;
  name: string;
  nameMn: string;
  icon: string;
  minAmount: number;
  maxAmount: number;
  processingTime: string;
  processingTimeMn: string;
  fee: number;
  accountField?: string;
  accountFieldLabel?: string;
  accountFieldLabelMn?: string;
};

const withdrawalMethods: WithdrawalMethod[] = [
  {
    id: "bank_transfer",
    name: "Bank Transfer",
    nameMn: "Банкны шилжүүлэг",
    icon: "🏦",
    minAmount: 100,
    maxAmount: 50000,
    processingTime: "2-5 business days",
    processingTimeMn: "2-5 ажлын өдөр",
    fee: 0,
    accountField: "bank_account",
    accountFieldLabel: "Bank Account Number",
    accountFieldLabelMn: "Банкны дансны дугаар",
  },
  {
    id: "crypto",
    name: "Cryptocurrency",
    nameMn: "Крипто валют",
    icon: "₿",
    minAmount: 50,
    maxAmount: 100000,
    processingTime: "10-30 minutes",
    processingTimeMn: "10-30 минут",
    fee: 1,
    accountField: "wallet_address",
    accountFieldLabel: "Wallet Address",
    accountFieldLabelMn: "Хэтэвчний хаяг",
  },
  {
    id: "paypal",
    name: "PayPal",
    nameMn: "PayPal",
    icon: "💙",
    minAmount: 10,
    maxAmount: 10000,
    processingTime: "1-2 business days",
    processingTimeMn: "1-2 ажлын өдөр",
    fee: 2.5,
    accountField: "paypal_email",
    accountFieldLabel: "PayPal Email",
    accountFieldLabelMn: "PayPal имэйл",
  },
  {
    id: "other",
    name: "Other",
    nameMn: "Бусад",
    icon: "💵",
    minAmount: 10,
    maxAmount: 5000,
    processingTime: "Varies",
    processingTimeMn: "Хувьсах",
    fee: 0,
    accountField: "account_details",
    accountFieldLabel: "Account Details",
    accountFieldLabelMn: "Дансны дэлгэрэнгүй",
  },
];

export default function NewWithdrawalPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    account_id: "",
    amount: 0,
    method: "bank_transfer" as WithdrawalMethod["id"],
    transaction_id: "",
    description: "",
    account_details: "",
  });

  useEffect(() => {
    const loadAccounts = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: accountsData } = await supabase
        .from("accounts")
        .select("id, name, balance, mode, status")
        .eq("user_id", user.id)
        .eq("status", "active");

      setAccounts(accountsData || []);
      setLoading(false);
    };

    loadAccounts();
  }, [router]);

  const selectedAccount = accounts.find((a) => a.id === formData.account_id);
  const selectedMethod = withdrawalMethods.find(
    (m) => m.id === formData.method,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const user = await getCurrentUser();
    if (!user) {
      setError("Нэвтрэнэ үү");
      setSubmitting(false);
      return;
    }

    if (!formData.account_id) {
      setError("Дансаа сонгоно уу");
      setSubmitting(false);
      return;
    }

    if (formData.amount <= 0) {
      setError("Дүн 0-с их байх ёстой");
      setSubmitting(false);
      return;
    }

    if (!selectedAccount) {
      setError("Сонгосон данс олдсонгүй");
      setSubmitting(false);
      return;
    }

    if (formData.amount > selectedAccount.balance) {
      setError(
        `Хүрэлцэхгүй баланс. Боломжтой: $${selectedAccount.balance.toLocaleString()}`,
      );
      setSubmitting(false);
      return;
    }

    if (selectedMethod) {
      if (formData.amount < selectedMethod.minAmount) {
        setError(`Хамгийн бага дүн: $${selectedMethod.minAmount}`);
        setSubmitting(false);
        return;
      }
      if (formData.amount > selectedMethod.maxAmount) {
        setError(`Хамгийн их дүн: $${selectedMethod.maxAmount}`);
        setSubmitting(false);
        return;
      }
    }

    if (selectedMethod?.accountField && !formData.account_details) {
      setError(`${selectedMethod.accountFieldLabelMn} оруулна уу`);
      setSubmitting(false);
      return;
    }

    // Calculate fee
    const fee = selectedMethod
      ? (formData.amount * selectedMethod.fee) / 100
      : 0;
    const netAmount = formData.amount - fee;

    // Insert withdrawal
    const { error: withdrawalError } = await supabase
      .from("withdrawals")
      .insert({
        user_id: user.id,
        account_id: formData.account_id,
        amount: formData.amount,
        method: formData.method,
        transaction_id: formData.transaction_id || null,
        description: formData.description || null,
        account_details: formData.account_details || null,
        date: new Date().toISOString(),
      });

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
      setError("Дансны баланс шинэчлэгдсэнгүй");
      setSubmitting(false);
      return;
    }

    router.push("/withdrawals");
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-2xl">💸</div>
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ←
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">💸 Мөнгө татах</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Арилжааны данснаас мөнгө татах
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 sm:p-6 dark:bg-gray-900">
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
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {getStatusIcon(acc.status)} {acc.name} - $
                  {acc.balance.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300">
              💰 Дүн *
            </label>
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
                className="w-full rounded-lg border p-2 pl-7 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="0.00"
                required
              />
            </div>
            {selectedAccount && formData.amount > selectedAccount.balance && (
              <p className="mt-1 text-xs text-red-500">
                ⚠️ Баланс хүрэлцэхгүй байна. Боломжтой дүн: $
                {selectedAccount.balance.toLocaleString()}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300">
              💳 Төлбөрийн хэрэгсэл *
            </label>
            <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                  className={`rounded-lg border p-2 sm:p-3 text-center transition-all ${
                    formData.method === method.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                      : "hover:border-gray-400 dark:border-gray-700"
                  }`}
                >
                  <div className="text-xl sm:text-2xl">{method.icon}</div>
                  <div className="mt-1 text-xs font-medium">
                    {method.nameMn}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedMethod && selectedMethod.accountField && (
            <div>
              <label className="block text-sm font-medium dark:text-gray-300">
                {selectedMethod.accountFieldLabelMn} *
              </label>
              <input
                type="text"
                value={formData.account_details}
                onChange={(e) =>
                  setFormData({ ...formData, account_details: e.target.value })
                }
                className="mt-1 w-full rounded-lg border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder={`${selectedMethod.accountFieldLabelMn} оруулна уу`}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium dark:text-gray-300">
              🔢 Гүйлгээний ID
            </label>
            <input
              type="text"
              value={formData.transaction_id}
              onChange={(e) =>
                setFormData({ ...formData, transaction_id: e.target.value })
              }
              className="mt-1 w-full rounded-lg border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="TX123456"
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300">
              📝 Тайлбар
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="mt-1 w-full rounded-lg border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              rows={3}
              placeholder="Нэмэлт мэдээлэл..."
            />
          </div>

          {/* Fee Information */}
          {selectedMethod && selectedMethod.fee > 0 && formData.amount > 0 && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
              <div className="flex justify-between">
                <span>💰 Гаргах дүн:</span>
                <span>${formData.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>📉 Шимтгэл ({selectedMethod.fee}%):</span>
                <span>
                  -${((formData.amount * selectedMethod.fee) / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>✅ Авах дүн:</span>
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
              ⚠️ {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-blue-500 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {submitting ? "Боловсруулж байна..." : "✅ Мөнгө татах"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border px-4 py-2 hover:bg-gray-50 dark:border-gray-700"
            >
              ❌ Цуцлах
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
