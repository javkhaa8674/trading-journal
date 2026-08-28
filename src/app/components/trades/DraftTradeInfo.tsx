// src/components/trades/DraftTradeInfo.tsx

"use client";

import { useEffect, useState } from "react";
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
  onNextTab?: () => void;
  onChange?: (data: DraftTradeInfoData) => void;
  draftId?: string;
  initialData?: Partial<DraftTradeInfoData> | null;
};

const getCurrentDateTime = () => {
  const now = new Date();

  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().slice(0, 8);

  return {
    date,
    time,
  };
};

const getInitialState = (): DraftTradeInfoData => {
  const { date, time } = getCurrentDateTime();

  return {
    symbol: "",
    lot_size: null,
    entry_price: null,
    entry_date: date,
    entry_time: time,
  };
};

export default function DraftTradeInfo({
  onNextTab,
  onChange,
  draftId,
  initialData,
}: Props) {
  const [form, setForm] = useState<DraftTradeInfoData>(() => ({
    ...getInitialState(),
    ...(initialData ?? {}),
  }));

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================
  // INITIAL DATA
  // Parent-оос DB-ээс уншсан data ирэх үед form update хийнэ
  // ============================================================

  useEffect(() => {
    if (!initialData) {
      return;
    }

    const defaultState = getInitialState();

    const updatedForm: DraftTradeInfoData = {
      ...defaultState,
      ...initialData,
    };

    setForm(updatedForm);
  }, [initialData]);

  // ============================================================
  // HANDLE INPUT CHANGE
  // ============================================================

  const update = (
    key: keyof DraftTradeInfoData,
    value: string | number | null,
  ) => {
    setSaved(false);
    setError(null);

    setForm((previous) => {
      const updated: DraftTradeInfoData = {
        ...previous,
        [key]: value,
      };

      // Parent state update
      if (onChange) {
        onChange(updated);
      }

      return updated;
    });
  };

  // ============================================================
  // SAVE
  // ============================================================

  const handleSave = async () => {
    if (saving) {
      return;
    }

    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      // ========================================================
      // 1. VALIDATION
      // ========================================================

      if (!form.symbol.trim()) {
        setError("Хослол оруулна уу.");
        return;
      }

      if (!form.lot_size || form.lot_size <= 0) {
        setError("Багц хэмжээг зөв оруулна уу.");
        return;
      }

      if (!form.entry_price || form.entry_price <= 0) {
        setError("Нээлтийн ханш зөв оруулна уу.");
        return;
      }

      if (!form.entry_date) {
        setError("Нээлтийн огноо сонгоно уу.");
        return;
      }

      if (!form.entry_time) {
        setError("Нээлтийн цаг оруулна уу.");
        return;
      }

      // ========================================================
      // 2. DRAFT ID
      // ========================================================

      if (!draftId) {
        setError("Draft ID олдсонгүй. Хадгалах боломжгүй.");
        return;
      }

      // ========================================================
      // 3. CURRENT USER
      // ========================================================

      const user = await getCurrentUser();

      if (!user) {
        setError("Хэрэглэгч олдсонгүй.");
        return;
      }

      // ========================================================
      // 4. EXISTING RECORD
      // ========================================================

      const { data: existing, error: checkError } = await supabase
        .from("draft_trade_info")
        .select("id")
        .eq("draft_id", draftId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (checkError) {
        throw new Error(checkError.message);
      }

      // ========================================================
      // 5. UPDATE EXISTING RECORD
      // ========================================================

      if (existing) {
        const { error: updateError } = await supabase
          .from("draft_trade_info")
          .update({
            symbol: form.symbol.trim(),
            lot_size: form.lot_size,
            entry_price: form.entry_price,
            entry_date: form.entry_date,
            entry_time: form.entry_time,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .eq("user_id", user.id);

        if (updateError) {
          throw new Error(updateError.message);
        }
      }

      // ========================================================
      // 6. INSERT NEW RECORD
      // ========================================================
      else {
        const { error: insertError } = await supabase
          .from("draft_trade_info")
          .insert({
            draft_id: draftId,
            user_id: user.id,
            symbol: form.symbol.trim(),
            lot_size: form.lot_size,
            entry_price: form.entry_price,
            entry_date: form.entry_date,
            entry_time: form.entry_time,
          });

        if (insertError) {
          throw new Error(insertError.message);
        }
      }

      // ========================================================
      // 7. SAVE SUCCESS
      // ========================================================

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 3000);

      // ========================================================
      // 8. NEXT TAB
      // ========================================================

      if (onNextTab) {
        setTimeout(() => {
          onNextTab();
        }, 300);
      }
    } catch (err) {
      console.error("Save error:", err);

      setError(err instanceof Error ? err.message : "Хадгалахад алдаа гарлаа.");

      setSaved(false);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // SUMMARY DATA
  // ============================================================

  const hasData = () => {
    return Boolean(
      form.symbol ||
      form.lot_size ||
      form.entry_price ||
      form.entry_date ||
      form.entry_time,
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="rounded-xl border bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* ======================================================
          HEADER
      ====================================================== */}

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

      {/* ======================================================
          FORM
      ====================================================== */}

      <div className="space-y-4 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* ==================================================
              SYMBOL
          ================================================== */}

          <div>
            <label className="mb-1 block text-sm font-medium">
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

          {/* ==================================================
              LOT SIZE
          ================================================== */}

          <div>
            <label className="mb-1 block text-sm font-medium">
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

          {/* ==================================================
              ENTRY PRICE
          ================================================== */}

          <div>
            <label className="mb-1 block text-sm font-medium">
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

          {/* ==================================================
              ENTRY DATE
          ================================================== */}

          <div>
            <label className="mb-1 block text-sm font-medium">
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

          {/* ==================================================
              ENTRY TIME
          ================================================== */}

          <div>
            <label className="mb-1 block text-sm font-medium">
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

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* ======================================================
            SAVED
        ====================================================== */}

        {saved && !error && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/20">
            <p className="text-sm text-green-600 dark:text-green-400">
              ✅ Арилжааны мэдээлэл хадгалагдлаа.
            </p>
          </div>
        )}

        {/* ======================================================
            SUMMARY
        ====================================================== */}

        {hasData() && (
          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              📌 <span className="font-medium">{form.symbol || "—"}</span>
              {form.lot_size !== null && ` · Lot: ${form.lot_size}`}
              {form.entry_price !== null && ` · Entry: ${form.entry_price}`}
              {form.entry_date &&
                ` · Date: ${new Date(form.entry_date).toLocaleDateString()}`}
              {form.entry_time && ` · Time: ${form.entry_time}`}
            </p>
          </div>
        )}
      </div>

      {/* ======================================================
          FOOTER
      ====================================================== */}

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
