"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";

export default function CreateAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    broker: "",
    mode: "demo",
    balance: 10000,
    status: "active",
  });

  // Generate account name automatically
  const generateAccountName = () => {
    const timestamp = new Date().toLocaleString();
    const modeText = formData.mode;
    return `${formData.broker} ${modeText} $${formData.balance.toLocaleString()} ${timestamp}`;
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

    const accountName = generateAccountName();

    const { error: insertError } = await supabase.from("accounts").insert({
      name: accountName,
      broker: formData.broker,
      mode: formData.mode,
      balance: formData.balance,
      status: formData.status,
      start_balance: formData.balance,
      user_id: user.id,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
    } else {
      router.push("/accounts");
    }
  };

  // Preview account name
  const previewName = formData.broker ? generateAccountName() : "";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">
        Шинэ данс үүсгэх
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Broker */}
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">
            Брокерын нэр *
          </label>
          <input
            type="text"
            value={formData.broker}
            onChange={(e) =>
              setFormData({ ...formData, broker: e.target.value })
            }
            className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            placeholder="Жишээ нь: Interactive Brokers"
            required
          />
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
            <option value="demo">Demo</option>
            <option value="live">Live</option>
            <option value="backtest">Backtest</option>
            <option value="challengeStep1">Challenge Step 1</option>
            <option value="challengeStep2">Challenge Step 2</option>
            <option value="highStakeStep1">HighStake Step 1</option>
            <option value="highStakeStep2">HighStake Step 2</option>
            <option value="bootcampStep1">Bootcamp Step 1</option>
            <option value="bootcampStep2">Bootcamp Step 2</option>
            <option value="bootcampStep3">Bootcamp Step 3</option>
            <option value="funded">Funded</option>
          </select>
        </div>

        {/* Balance */}
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">
            Эхлэлийн баланс ($) *
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.balance}
            onChange={(e) =>
              setFormData({ ...formData, balance: parseFloat(e.target.value) })
            }
            className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            placeholder="10000"
            required
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">
            Төлөв
          </label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="achieved">Achieved</option>
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
            <p className="mt-2 text-xs text-blue-500 dark:text-blue-400/70">
              ℹ️ Дансны нэр автоматаар дараах байдлаар үүсгэгдэх болно: Брокер +
              Горим + Үлдэгдэл + Цагийн тэмдэг
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
            Алдаа: {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push("/accounts")}
            className="rounded-lg border px-4 py-2 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Цуцлах
          </button>
          <button
            type="submit"
            disabled={loading || !formData.broker}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Үүсгэж байна..." : "Данс үүсгэх"}
          </button>
        </div>
      </form>
    </div>
  );
}
