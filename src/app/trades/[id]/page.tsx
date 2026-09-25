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

  // Балансын төрлүүд (payout/violation/deposit)
  const isBalanceType =
    formData.type === "payout" ||
    formData.type === "violation" ||
    formData.type === "deposit";

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

    // Балансын төрөл бол зөвхөн шаардлагатай талбаруудыг илгээнэ
    const updatePayload = isBalanceType
      ? {
          symbol: formData.symbol,
          type: formData.type,
          profit: formData.profit,
          open_time: formData.open_time,
          close_time: formData.close_time,
          // Бусад талбарыг 0 болгоно
          entry_price: 0,
          exit_price: 0,
          stop_loss: 0,
          take_profit: 0,
          lot_size: 0,
        }
      : {
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
        };

    const { error } = await supabase
      .from("trades")
      .update(updatePayload)
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
          {/* ХОСЛОЛ — бүх төрөлд */}
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
              disabled={isBalanceType}
              placeholder={isBalanceType ? "PAYOUT / VIOLATION / DEPOSIT" : ""}
            />
          </div>

          {/* ТӨРӨЛ — бүх төрөл (buy, sell, payout, violation, deposit) */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-300">
              Төрөл
            </label>
            <select
              value={formData.type || "buy"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as
                    | "buy"
                    | "sell"
                    | "payout"
                    | "violation"
                    | "deposit",
                })
              }
              className="mt-1 w-full rounded border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <optgroup label="Арилжаа">
                <option value="buy">Buy (Long)</option>
                <option value="sell">Sell (Short)</option>
              </optgroup>
              <optgroup label="Балансын бичлэг">
                <option value="payout">Payout (Ашиг татах)</option>
                <option value="violation">Violation (Дүрэм зөрчил)</option>
                <option value="deposit">Deposit (Хөрөнгө оруулалт)</option>
              </optgroup>
            </select>
          </div>

          {/* ЗӨВХӨН АРИЛЖААНЫ ТАЛБАРУУД */}
          {!isBalanceType && (
            <>
              <div>
                <label className="block text-sm font-medium dark:text-gray-300">
                  Нээлтийн ханш
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={formData.entry_price ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      entry_price: parseFloat(e.target.value),
                    })
                  }
                  className="mt-1 w-full rounded border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium dark:text-gray-300">
                  Хаалтын ханш
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={formData.exit_price ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      exit_price: parseFloat(e.target.value),
                    })
                  }
                  className="mt-1 w-full rounded border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium dark:text-gray-300">
                  SL
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={formData.stop_loss ?? ""}
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
                  value={formData.take_profit ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      take_profit: parseFloat(e.target.value),
                    })
                  }
                  className="mt-1 w-full rounded border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
            </>
          )}

          {/* АШИГ — бүх төрөлд */}
          <div className={isBalanceType ? "col-span-2" : ""}>
            <label className="block text-sm font-medium dark:text-gray-300">
              {isBalanceType ? "Дүн (Profit)" : "Ашиг"}
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.profit ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  profit:
                    e.target.value === "" ? 0 : parseFloat(e.target.value),
                })
              }
              className="mt-1 w-full rounded border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              required
              placeholder={
                isBalanceType
                  ? "Жишээ: -210.07 (Payout) эсвэл -9.28 (Violation)"
                  : ""
              }
            />
            {isBalanceType && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                💡 Сөрөг тоо = хасагдана, эерэг тоо = нэмэгдэнэ
              </p>
            )}
          </div>

          {/* НЭЭЛТИЙН ОГНОО — бүх төрөлд */}
          <div className={isBalanceType ? "col-span-2" : ""}>
            <label className="block text-sm font-medium dark:text-gray-300">
              {isBalanceType ? "Огноо" : "Нээлтийн огноо"}
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

          {/* ХААЛТЫН ОГНОО — зөвхөн арилжаанд */}
          {!isBalanceType && (
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
          )}
        </div>

        {/* МЭДЭГДЭЛ — балансын төрөл үед */}
        {isBalanceType && (
          <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
            ⚠️ Энэ нь <strong>балансын бичлэг</strong>. Зөвхөн огноо, дүн,
            төрлийг засварлана. Ханш, лот, SL/TP гэх мэт талбарууд
            хэрэглэгдэхгүй.
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
