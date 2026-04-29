"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { Trade } from "@/types/trade";

export default function EditTradePage() {
  const router = useRouter();
  const params = useParams();
  const tradeId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Trade>>({});

  useEffect(() => {
    const loadTrade = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("id", tradeId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        setError(error.message);
      } else if (data) {
        setFormData(data);
      }

      setLoading(false);
    };

    loadTrade();
  }, [tradeId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const user = await getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("trades")
      .update({
        symbol: formData.symbol,
        type: formData.type,
        entry_price: formData.entry_price,
        exit_price: formData.exit_price,
        profit: formData.profit,
        stop_loss: formData.stop_loss,
        take_profit: formData.take_profit,
        lot_size: formData.lot_size,
        open_time: formData.open_time,
        close_time: formData.close_time,
      })
      .eq("id", tradeId)
      .eq("user_id", user.id);

    setSaving(false);

    if (error) {
      setError(error.message);
    } else {
      router.push("/trades");
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="mb-2 text-2xl">📊</div>
        <div className="text-gray-500">Ачааллаж байна...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-950/50 dark:text-red-400">
        Алдаа: {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Засварлах</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium dark:text-gray-300">
              Хослол
            </label>
            <input
              type="text"
              value={formData.symbol || ""}
              onChange={(e) =>
                setFormData({ ...formData, symbol: e.target.value })
              }
              className="mt-1 w-full rounded border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300">
              Төрөл
            </label>
            <select
              value={formData.type || "buy"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as "buy" | "sell",
                })
              }
              className="mt-1 w-full rounded border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="buy">Buy (Long)</option>
              <option value="sell">Sell (Short)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300">
              Нээлтийн ханш
            </label>
            <input
              type="number"
              step="0.00001"
              value={formData.entry_price || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  entry_price: parseFloat(e.target.value),
                })
              }
              className="mt-1 w-full rounded border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300">
              Хаалтын ханш
            </label>
            <input
              type="number"
              step="0.00001"
              value={formData.exit_price || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  exit_price: parseFloat(e.target.value),
                })
              }
              className="mt-1 w-full rounded border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300">
              Лот хэмжээ
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.lot_size || 1}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  lot_size: parseFloat(e.target.value),
                })
              }
              className="mt-1 w-full rounded border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300">
              Ашиг
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.profit || ""}
              onChange={(e) =>
                setFormData({ ...formData, profit: parseFloat(e.target.value) })
              }
              className="mt-1 w-full rounded border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300">
              SL
            </label>
            <input
              type="number"
              step="0.00001"
              value={formData.stop_loss || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  stop_loss: parseFloat(e.target.value),
                })
              }
              className="mt-1 w-full rounded border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300">
              TP
            </label>
            <input
              type="number"
              step="0.00001"
              value={formData.take_profit || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  take_profit: parseFloat(e.target.value),
                })
              }
              className="mt-1 w-full rounded border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300">
              Нээлтийн огноо
            </label>
            <input
              type="datetime-local"
              value={
                formData.open_time
                  ? new Date(formData.open_time).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) =>
                setFormData({ ...formData, open_time: e.target.value })
              }
              className="mt-1 w-full rounded border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300">
              Хаалтын огноо
            </label>
            <input
              type="datetime-local"
              value={
                formData.close_time
                  ? new Date(formData.close_time).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) =>
                setFormData({ ...formData, close_time: e.target.value })
              }
              className="mt-1 w-full rounded border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
            Алдаа: {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push("/trades")}
            className="rounded-lg border px-4 py-2 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Цуцлах
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {saving ? "Хадгалж байна..." : "Хадгалах"}
          </button>
        </div>
      </form>
    </div>
  );
}
