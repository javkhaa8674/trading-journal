// src/components/trades/DraftTradeInfo.tsx

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";

type DraftTradeInfoData = {
  symbol: string;
  lot_size: number | null;
  entry_price: number | null;
  entry_date: string;
  entry_time: string;
};

type Props = {
  onChange?: (data: DraftTradeInfoData) => void;
  initialData?: DraftTradeInfoData;
  onNextTab?: () => void;
  onSave?: (data: DraftTradeInfoData) => Promise<void> | void;
  draftId?: string;
};

const getCurrentDateTime = () => {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().slice(0, 8);
  return { date, time };
};

const initialState: DraftTradeInfoData = {
  symbol: "",
  lot_size: null,
  entry_price: null,
  entry_date: getCurrentDateTime().date,
  entry_time: getCurrentDateTime().time,
};

export default function DraftTradeInfo({
  onChange,
  initialData,
  onNextTab,
  onSave,
  draftId,
}: Props) {
  const [form, setForm] = useState<DraftTradeInfoData>(() => {
    if (initialData) {
      return {
        symbol: initialData.symbol || "",
        lot_size: initialData.lot_size ?? null,
        entry_price: initialData.entry_price ?? null,
        entry_date: initialData.entry_date || getCurrentDateTime().date,
        entry_time: initialData.entry_time || getCurrentDateTime().time,
      };
    }
    return initialState;
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Auto-save when form changes
  useEffect(() => {
    if (draftId && isDirty) {
      const timer = setTimeout(() => {
        handleSave();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [form, draftId, isDirty]);

  const update = (key: keyof DraftTradeInfoData, value: any) => {
    setSaved(false);
    setError(null);
    setIsDirty(true);
    const updated = { ...form, [key]: value };
    setForm(updated);
    if (onChange) {
      onChange(updated);
    }
  };

  // ✅ SAVE with separate INSERT/UPDATE
  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      // Validation
      if (!form.symbol) {
        setError("Хослол оруулна уу.");
        setSaving(false);
        return;
      }

      if (!form.lot_size || form.lot_size <= 0) {
        setError("Багц хэмжээг зөв оруулна уу.");
        setSaving(false);
        return;
      }

      if (!form.entry_price || form.entry_price <= 0) {
        setError("Нээлтийн ханш зөв оруулна уу.");
        setSaving(false);
        return;
      }

      if (!form.entry_date) {
        setError("Нээлтийн огноо сонгоно уу.");
        setSaving(false);
        return;
      }

      if (!form.entry_time) {
        setError("Нээлтийн цаг оруулна уу.");
        setSaving(false);
        return;
      }

      // ✅ Save to database if draftId is provided
      if (draftId) {
        const user = await getCurrentUser();
        if (!user) {
          setError("Хэрэглэгч олдсонгүй");
          setSaving(false);
          return;
        }

        console.log("Saving trade info for draft:", draftId);
        console.log("Data:", form);

        // ✅ Check if record exists
        const { data: existing, error: checkError } = await supabase
          .from("draft_trade_info")
          .select("id")
          .eq("draft_id", draftId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (checkError) {
          console.error("Check error:", checkError);
          throw new Error(checkError.message);
        }

        let result;
        if (existing) {
          // ✅ UPDATE existing record
          console.log("Updating existing record:", existing.id);
          const { data, error: updateError } = await supabase
            .from("draft_trade_info")
            .update({
              symbol: form.symbol,
              lot_size: form.lot_size,
              entry_price: form.entry_price,
              entry_date: form.entry_date,
              entry_time: form.entry_time,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id)
            .eq("user_id", user.id)
            .select();

          if (updateError) {
            console.error("Update error:", updateError);
            throw new Error(updateError.message);
          }
          result = data;
          console.log("Updated successfully:", result);
        } else {
          // ✅ INSERT new record
          console.log("Inserting new record");
          const { data, error: insertError } = await supabase
            .from("draft_trade_info")
            .insert({
              draft_id: draftId,
              user_id: user.id,
              symbol: form.symbol,
              lot_size: form.lot_size,
              entry_price: form.entry_price,
              entry_date: form.entry_date,
              entry_time: form.entry_time,
            })
            .select();

          if (insertError) {
            console.error("Insert error:", insertError);
            throw new Error(insertError.message);
          }
          result = data;
          console.log("Inserted successfully:", result);
        }
      }

      // ✅ Call onSave if provided
      if (onSave) {
        await onSave(form);
      }

      setIsDirty(false);
      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 3000);

      if (onNextTab) {
        setTimeout(() => {
          onNextTab();
        }, 300);
      }
    } catch (err) {
      console.error("Save error:", err);
      setError(err instanceof Error ? err.message : "Хадгалахад алдаа гарлаа");
      setSaved(false);
    } finally {
      setSaving(false);
    }
  };

  const hasData = () => {
    return !!(
      form.symbol ||
      form.lot_size ||
      form.entry_price ||
      form.entry_date
    );
  };

  return (
    <div className="rounded-xl border bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b p-5 dark:border-gray-800">
        <h2 className="text-lg font-semibold">📊 Арилжааны мэдээлэл</h2>
        <p className="mt-1 text-sm text-gray-500">
          Арилжааны үндсэн мэдээллийг бүртгэнэ. Дараа нь trade-тай холбоход энэ
          мэдээлэл ашиглагдана.
          {draftId && (
            <span className="ml-2 text-xs text-blue-500">
              (Draft ID: {draftId.slice(0, 8)}...)
            </span>
          )}
        </p>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">
              Хослол (Currency Pair) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.symbol}
              onChange={(e) => update("symbol", e.target.value.toUpperCase())}
              placeholder="EURUSD"
              className="w-full rounded-lg border px-3 py-2 text-sm uppercase dark:border-gray-600 dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Багц хэмжээ (Lot Size) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.lot_size ?? ""}
              onChange={(e) =>
                update(
                  "lot_size",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              placeholder="0.01"
              className="w-full rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Нээлтийн ханш (Entry Price){" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.00001"
              min="0"
              value={form.entry_price ?? ""}
              onChange={(e) =>
                update(
                  "entry_price",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              placeholder="1.23456"
              className="w-full rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Нээлтийн огноо (Entry Date){" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.entry_date}
              onChange={(e) => update("entry_date", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Нээлтийн цаг (Entry Time) <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              step="1"
              value={form.entry_time}
              onChange={(e) => update("entry_time", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 border border-red-200 dark:bg-red-950/20 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {saved && !error && (
          <div className="rounded-lg bg-green-50 p-3 border border-green-200 dark:bg-green-950/20 dark:border-green-800">
            <p className="text-sm text-green-600 dark:text-green-400">
              ✅ Арилжааны мэдээлэл хадгалагдлаа.
            </p>
          </div>
        )}

        {hasData() && (
          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              📌 <span className="font-medium">{form.symbol || "—"}</span>
              {form.lot_size && ` · Lot: ${form.lot_size}`}
              {form.entry_price && ` · Entry: ${form.entry_price}`}
              {form.entry_date &&
                ` · Date: ${new Date(form.entry_date).toLocaleDateString()}`}
              {form.entry_time && ` · Time: ${form.entry_time}`}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t p-5 dark:border-gray-800">
        <div>
          {saving && (
            <p className="text-sm text-blue-500">⏳ Хадгалж байна...</p>
          )}
          {saved && !error && !saving && (
            <p className="text-sm text-green-500">
              ✅ Арилжааны мэдээлэл хадгалагдлаа.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Хадгалж байна..." : "💾 Хадгалах"}
        </button>
      </div>
    </div>
  );
}
