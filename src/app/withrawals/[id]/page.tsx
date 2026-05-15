"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";

type Withdrawal = {
  id: string;
  account_id: string;
  amount: number;
  method: string;
  transaction_id: string;
  description: string;
  account_details: string;
  date: string;
};

type Account = {
  id: string;
  name: string;
  balance: number;
};

const withdrawalMethods = [
  { id: "bank_transfer", nameMn: "Банкны шилжүүлэг", icon: "🏦" },
  { id: "crypto", nameMn: "Крипто валют", icon: "₿" },
  { id: "paypal", nameMn: "PayPal", icon: "💙" },
  { id: "other", nameMn: "Бусад", icon: "💵" },
];

export default function EditWithdrawalPage() {
  const router = useRouter();
  const params = useParams();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    account_id: "",
    amount: 0,
    method: "",
    transaction_id: "",
    description: "",
    account_details: "",
    date: "",
  });

  useEffect(() => {
    const loadData = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: accountsData } = await supabase
        .from("accounts")
        .select("id, name, balance")
        .eq("user_id", user.id);

      setAccounts(accountsData || []);

      const { data: withdrawalData } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("id", params.id)
        .single();

      if (withdrawalData) {
        setFormData({
          account_id: withdrawalData.account_id,
          amount: withdrawalData.amount,
          method: withdrawalData.method,
          transaction_id: withdrawalData.transaction_id || "",
          description: withdrawalData.description || "",
          account_details: withdrawalData.account_details || "",
          date: withdrawalData.date.split("T")[0],
        });
      }

      setLoading(false);
    };

    loadData();
  }, [params.id, router]);

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

    const { error: updateError } = await supabase
      .from("withdrawals")
      .update({
        account_id: formData.account_id,
        amount: formData.amount,
        method: formData.method,
        transaction_id: formData.transaction_id || null,
        description: formData.description || null,
        account_details: formData.account_details || null,
        date: formData.date,
      })
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (updateError) {
      setError(updateError.message);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              ✏️ Гүйлгээ засварлах
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Мөнгө татах гүйлгээний мэдээлэл өөрчлөх
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 sm:p-6 dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">🏦 Данс</label>
            <select
              value={formData.account_id}
              onChange={(e) =>
                setFormData({ ...formData, account_id: e.target.value })
              }
              className="mt-1 w-full rounded-lg border p-2 bg-white dark:bg-gray-800"
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} - ${acc.balance.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">💰 Дүн</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: parseFloat(e.target.value) })
              }
              className="mt-1 w-full rounded-lg border p-2 bg-white dark:bg-gray-800"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              💳 Төлбөрийн хэрэгсэл
            </label>
            <select
              value={formData.method}
              onChange={(e) =>
                setFormData({ ...formData, method: e.target.value })
              }
              className="mt-1 w-full rounded-lg border p-2 bg-white dark:bg-gray-800"
            >
              {withdrawalMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.icon} {method.nameMn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">📅 Огноо</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="mt-1 w-full rounded-lg border p-2 bg-white dark:bg-gray-800"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              🏦 Дансны дэлгэрэнгүй
            </label>
            <input
              type="text"
              value={formData.account_details}
              onChange={(e) =>
                setFormData({ ...formData, account_details: e.target.value })
              }
              className="mt-1 w-full rounded-lg border p-2 bg-white dark:bg-gray-800"
              placeholder="Банкны данс, крипто хаяг, PayPal имэйл"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              🔢 Гүйлгээний ID
            </label>
            <input
              type="text"
              value={formData.transaction_id}
              onChange={(e) =>
                setFormData({ ...formData, transaction_id: e.target.value })
              }
              className="mt-1 w-full rounded-lg border p-2 bg-white dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">📝 Тайлбар</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="mt-1 w-full rounded-lg border p-2 bg-white dark:bg-gray-800"
              rows={3}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              ⚠️ {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-blue-500 py-2 text-white hover:bg-blue-600"
            >
              {submitting ? "Хадгалж байна..." : "💾 Хадгалах"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border px-4 py-2 hover:bg-gray-50"
            >
              Цуцлах
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
