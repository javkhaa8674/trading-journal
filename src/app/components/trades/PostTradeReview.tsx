"use client";

import { useEffect, useState } from "react";
import { useTrades } from "@/lib/hooks/useTrades";
import type { PostTradeReview, WouldTakeAgain } from "@/types/trade";

type PostTradeReviewFormData = {
  id?: string;
  execution_quality: number | null;
  would_take_again: WouldTakeAgain | null;
  reflection: string | null;
  lesson_learned: string | null;
  notes: string | null;
};

type Props = {
  tradeId: string;
  mode?: "view" | "create" | "edit";
  onSave?: (data: any) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  onChange?: (data: any) => void;
  initialData?: any;
};

const initialState: PostTradeReviewFormData = {
  execution_quality: null,
  would_take_again: null,
  reflection: null,
  lesson_learned: null,
  notes: null,
};

export default function PostTradeReview({
  tradeId,
  mode = "view",
  onSave,
  onCancel,
  onDelete,
  onChange,
  initialData,
}: Props) {
  const {
    trades,
    loading: tradesLoading,
    getPostTradeReview,
    savePostTradeReview,
  } = useTrades();
  const [form, setForm] = useState<PostTradeReviewFormData>(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Get trade data from useTrades
  const trade = trades.find((t) => t.id === tradeId);

  // Load existing review
  useEffect(() => {
    async function loadReview() {
      setLoading(true);
      setError(null);

      const { data, error } = await getPostTradeReview(tradeId);

      if (error) {
        setError(error);
        setLoading(false);
        return;
      }

      if (data) {
        setForm({
          id: data.id,
          execution_quality: data.execution_quality,
          would_take_again: data.would_take_again,
          reflection: data.reflection,
          lesson_learned: data.lesson_learned,
          notes: data.notes,
        });
      }

      setLoading(false);
    }

    loadReview();
  }, [tradeId, getPostTradeReview]);

  function update<K extends keyof PostTradeReviewFormData>(
    key: K,
    value: PostTradeReviewFormData[K],
  ) {
    setSaved(false);
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);

    const { data, error } = await savePostTradeReview(tradeId, form);

    if (error) {
      setError(error);
      setSaving(false);
      return;
    }

    if (data) {
      setForm((current) => ({
        ...current,
        id: data.id,
      }));
    }

    setSaved(true);
    setSaving(false);
  }

  // Format duration
  function formatDuration(openTime: string | null, closeTime: string | null) {
    if (!openTime || !closeTime) return "—";
    const diff = new Date(closeTime).getTime() - new Date(openTime).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  if (loading || tradesLoading) {
    return (
      <section className="rounded-xl border bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-500">
          Арилжааны дараах дүгнэлт ачааллаж байна...
        </p>
      </section>
    );
  }

  if (!trade) {
    return (
      <section className="rounded-xl border bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-red-500">Арилжаа олдсонгүй.</p>
      </section>
    );
  }

  const duration = formatDuration(
    trade.open_time ?? null,
    trade.close_time ?? null,
  );

  // ХАРАХ горим
  if (mode === "view") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ViewItem
            label="Гүйцэтгэлийн чанар"
            value={form.execution_quality}
            maxValue={5}
            labelMap={{
              1: "Маш муу",
              2: "Муу",
              3: "Дундаж",
              4: "Сайн",
              5: "Маш сайн",
            }}
          />
          <ViewItem
            label="Дахин хийх үү?"
            value={form.would_take_again}
            labelMap={{
              yes: "Тийм",
              yes_with_changes: "Тийм, өөрчлөлттэй",
              no: "Үгүй",
            }}
          />
        </div>

        {form.reflection && (
          <div className="rounded-lg border p-4 dark:border-gray-700">
            <p className="text-sm text-gray-500 mb-1">Рефлекс</p>
            <p className="text-sm">{form.reflection}</p>
          </div>
        )}

        {form.lesson_learned && (
          <div className="rounded-lg border p-4 dark:border-gray-700">
            <p className="text-sm text-gray-500 mb-1">Сурсан зүйл</p>
            <p className="text-sm">{form.lesson_learned}</p>
          </div>
        )}

        {form.notes && (
          <div className="rounded-lg border p-4 dark:border-gray-700">
            <p className="text-sm text-gray-500 mb-1">Нэмэлт тэмдэглэл</p>
            <p className="text-sm">{form.notes}</p>
          </div>
        )}

        {!form.id && (
          <p className="text-sm text-gray-400 text-center py-4">
            ⬜ Дүгнэлт бүртгэгдээгүй байна
          </p>
        )}
      </div>
    );
  }

  // CREATE/EDIT горим - одоо байгаа UI
  return (
    <section className="rounded-xl border bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* HEADER */}
      <div className="border-b p-5 dark:border-gray-800">
        <h2 className="text-lg font-semibold">📝 Арилжааны дараах дүгнэлт</h2>
        <p className="mt-1 text-sm text-gray-500">
          Арилжааны үр дүнг эргэн харж, сургамж, тунгаалтыг бүртгэнэ.
        </p>
      </div>

      {/* TRADE INFO (Auto-display from useTrades) */}
      <div className="border-b p-5 dark:border-gray-800">
        <h3 className="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">
          Арилжааны мэдээлэл
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500">Нээлтийн ханш</p>
            <p className="text-sm font-medium">{trade.entry_price ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">SL</p>
            <p className="text-sm font-medium">{trade.stop_loss ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">TP</p>
            <p className="text-sm font-medium">{trade.take_profit ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Хаалтын ханш</p>
            <p className="text-sm font-medium">{trade.exit_price ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">P&L</p>
            <p
              className={`text-sm font-medium ${
                trade.profit && trade.profit > 0
                  ? "text-green-600"
                  : trade.profit && trade.profit < 0
                    ? "text-red-600"
                    : ""
              }`}
            >
              {trade.profit ?? "—"}$
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Зарцуулсан хугацааа</p>
            <p className="text-sm font-medium">{duration}</p>
          </div>
        </div>
      </div>

      {/* USER INPUTS */}
      <div className="space-y-6 p-5">
        {/* Execution Quality */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Арилжааны гүйцэтгэлийн чанар
          </label>
          <p className="mb-3 text-xs text-gray-500">
            Арилжааны гүйцэтгэлийг хэрхэн үнэлэх вэ?
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 1, label: "Маш муу" },
              { value: 2, label: "Муу" },
              { value: 3, label: "Дундаж" },
              { value: 4, label: "Сайн" },
              { value: 5, label: "Маш сайн" },
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  update(
                    "execution_quality",
                    form.execution_quality === value ? null : value,
                  )
                }
                className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                  form.execution_quality === value
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                }`}
              >
                {value} — {label}
              </button>
            ))}
            {form.execution_quality && (
              <button
                type="button"
                onClick={() => update("execution_quality", null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600"
              >
                Цэвэрлэх
              </button>
            )}
          </div>
        </div>

        {/* Would Take Again */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Дахин хийх үү?
          </label>
          <p className="mb-3 text-xs text-gray-500">
            Энэ арилжааг дахин хийх үү?
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                update(
                  "would_take_again",
                  form.would_take_again === "yes" ? null : "yes",
                )
              }
              className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                form.would_take_again === "yes"
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
              }`}
            >
              ✅ Тийм
            </button>
            <button
              type="button"
              onClick={() =>
                update(
                  "would_take_again",
                  form.would_take_again === "yes_with_changes"
                    ? null
                    : "yes_with_changes",
                )
              }
              className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                form.would_take_again === "yes_with_changes"
                  ? "border-yellow-500 bg-yellow-500 text-white"
                  : "border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
              }`}
            >
              🔄 Тийм, өөрчлөлттэй
            </button>
            <button
              type="button"
              onClick={() =>
                update(
                  "would_take_again",
                  form.would_take_again === "no" ? null : "no",
                )
              }
              className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                form.would_take_again === "no"
                  ? "border-red-500 bg-red-500 text-white"
                  : "border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
              }`}
            >
              ❌ Үгүй
            </button>
            {form.would_take_again && (
              <button
                type="button"
                onClick={() => update("would_take_again", null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600"
              >
                Цэвэрлэх
              </button>
            )}
          </div>
        </div>

        {/* Reflection */}
        <div>
          <label
            htmlFor="reflection"
            className="mb-2 block text-sm font-medium"
          >
            Рефлекс
          </label>
          <p className="mb-3 text-xs text-gray-500">
            Арилжааны талаарх таны бодол, юу зөв болсон, юу буруу болсон?
          </p>
          <textarea
            id="reflection"
            value={form.reflection ?? ""}
            onChange={(e) => update("reflection", e.target.value || null)}
            rows={3}
            className="w-full rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            placeholder="Арилжааны талаарх бодлоо бичнэ үү..."
          />
        </div>

        {/* Lesson Learned */}
        <div>
          <label
            htmlFor="lesson_learned"
            className="mb-2 block text-sm font-medium"
          >
            Сурсан зүйл
          </label>
          <p className="mb-3 text-xs text-gray-500">
            Энэ арилжаанаас ямар сургамж авсан бэ?
          </p>
          <textarea
            id="lesson_learned"
            value={form.lesson_learned ?? ""}
            onChange={(e) => update("lesson_learned", e.target.value || null)}
            rows={3}
            className="w-full rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            placeholder="Сургамжаа бичнэ үү..."
          />
        </div>

        {/* Additional Notes */}
        <div>
          <label htmlFor="notes" className="mb-2 block text-sm font-medium">
            Нэмэлт тэмдэглэл
          </label>
          <p className="mb-3 text-xs text-gray-500">
            Нэмэлт тэмдэглэл, анхаарах зүйлс.
          </p>
          <textarea
            id="notes"
            value={form.notes ?? ""}
            onChange={(e) => update("notes", e.target.value || null)}
            rows={2}
            className="w-full rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            placeholder="Нэмэлт тэмдэглэл..."
          />
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between border-t p-5 dark:border-gray-800">
        <div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {saved && !error && (
            <p className="text-sm text-green-500">
              ✅ Арилжааны дараах дүгнэлт хадгалагдлаа.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Хадгалж байна..." : "💾 Хадгалах"}
        </button>
      </div>
    </section>
  );
}

// Helper component for view mode
function ViewItem({
  label,
  value,
  maxValue,
  labelMap,
}: {
  label: string;
  value: string | number | null;
  maxValue?: number;
  labelMap?: Record<string, string>;
}) {
  let displayText = "—";

  if (value !== null && value !== undefined) {
    if (labelMap && typeof value === "string") {
      displayText = labelMap[value] || value;
    } else if (maxValue && typeof value === "number") {
      displayText = `${value}/${maxValue}`;
    } else {
      displayText = String(value);
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border p-4 dark:border-gray-700">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span
        className={`text-sm font-medium ${value !== null && value !== undefined ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`}
      >
        {displayText}
      </span>
    </div>
  );
}
