"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";

type Deposit = {
  id: string;
  account_id: string;
  amount: number;
  method: string;
  transaction_id: string;
  description: string;
  date: string;
};

type Account = {
  id: string;
  name: string;
  balance: number;
};

const depositMethods = [
  { id: "bank_transfer", nameMn: "Банкны шилжүүлэг", icon: "🏦" },
  { id: "crypto", nameMn: "Крипто валют", icon: "₿" },
  { id: "credit_card", nameMn: "Зээлийн карт", icon: "💳" },
  { id: "paypal", nameMn: "PayPal", icon: "💙" },
  { id: "other", nameMn: "Бусад", icon: "💵" },
];

export default function EditDepositPage() {
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
    date: "",
  });

  useEffect(() => {
    const loadData = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Load accounts
      const { data: accountsData } = await supabase
        .from("accounts")
        .select("id, name, balance")
        .eq("user_id", user.id);

      setAccounts(accountsData || []);

      // Load deposit
      const { data: depositData } = await supabase
        .from("deposits")
        .select("*")
        .eq("id", params.id)
        .single();

      if (depositData) {
        setFormData({
          account_id: depositData.account_id,
          amount: depositData.amount,
          method: depositData.method,
          transaction_id: depositData.transaction_id || "",
          description: depositData.description || "",
          date: depositData.date.split("T")[0],
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
      .from("deposits")
      .update({
        account_id: formData.account_id,
        amount: formData.amount,
        method: formData.method,
        transaction_id: formData.transaction_id || null,
        description: formData.description || null,
        date: formData.date,
      })
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    router.push("/deposits");
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">Ачааллаж байна...</div>
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
              Хадгаламж засварлах
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Гүйлгээний мэдээлэл өөрчлөх
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 sm:p-6 dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">🏦 Данс</label>
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
            <label className="block text-sm font-medium">💰 Дүн</label>
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
            <label className="block text-sm font-medium">
              💳 Төлбөрийн хэрэгсэл
            </label>
            <select
              value={formData.method}
              onChange={(e) =>
                setFormData({ ...formData, method: e.target.value })
              }
              className="mt-1 w-full rounded-lg border p-2 bg-white dark:bg-gray-800"
            >
              {depositMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.icon} {method.nameMn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">📅 Огноо</label>
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
            <label className="block text-sm font-medium">
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
            <label className="block text-sm font-medium">📝 Тайлбар</label>
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
