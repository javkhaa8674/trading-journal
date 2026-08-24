"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import type {
  TradeBehavior as TradeBehaviorType,
  PlanAdherence,
  SLModification,
  TPModification,
  EarlyExit,
} from "@/types/trade";

type Props = {
  tradeId: string;
  mode?: "view" | "create" | "edit";
  onSave?: (data: any) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  onChange?: (data: any) => void;
  onNextTab?: () => void;
  initialData?: any;
};

type FormData = {
  id?: string;
  plan_adherence: PlanAdherence | null;
  sl_modification: SLModification | null;
  tp_modification: TPModification | null;
  early_exit: EarlyExit | null;
};

const initialState: FormData = {
  plan_adherence: null,
  sl_modification: null,
  tp_modification: null,
  early_exit: null,
};

// Option button component for better UX
function OptionButton<T extends string>({
  label,
  value,
  currentValue,
  onChange,
  variant = "default",
}: {
  label: string;
  value: T;
  currentValue: T | null;
  onChange: (value: T | null) => void;
  variant?: "default" | "danger";
}) {
  const isSelected = currentValue === value;

  return (
    <button
      type="button"
      onClick={() => onChange(isSelected ? null : value)}
      className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
        isSelected
          ? variant === "danger"
            ? "border-red-500 bg-red-500 text-white"
            : "border-blue-500 bg-blue-500 text-white"
          : "border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
      }`}
    >
      {label}
    </button>
  );
}

export default function TradeBehavior({
  tradeId,
  mode = "view",
  onSave,
  onCancel,
  onDelete,
  onChange,
  onNextTab,
  initialData,
}: Props) {
  const [form, setForm] = useState<FormData>(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const user = await getCurrentUser();

      if (!user) {
        setError("Хэрэглэгч олдсонгүй.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("trade_behavior")
        .select("*")
        .eq("trade_id", tradeId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data) {
        setForm({
          id: data.id,
          plan_adherence: data.plan_adherence as PlanAdherence | null,
          sl_modification: data.sl_modification as SLModification | null,
          tp_modification: data.tp_modification as TPModification | null,
          early_exit: data.early_exit as EarlyExit | null,
        });
      }

      setLoading(false);
    }

    load();
  }, [tradeId]);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
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

    try {
      const user = await getCurrentUser();

      if (!user) {
        throw new Error("Хэрэглэгч олдсонгүй.");
      }

      const payload = {
        trade_id: tradeId,
        user_id: user.id,
        plan_adherence: form.plan_adherence,
        sl_modification: form.sl_modification,
        tp_modification: form.tp_modification,
        early_exit: form.early_exit,
        updated_at: new Date().toISOString(),
      };

      if (form.id) {
        const { error } = await supabase
          .from("trade_behavior")
          .update(payload)
          .eq("id", form.id)
          .eq("trade_id", tradeId)
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }
      } else {
        const { data, error } = await supabase
          .from("trade_behavior")
          .insert(payload)
          .select("id")
          .single();

        if (error) {
          throw error;
        }

        setForm((current) => ({
          ...current,
          id: data.id,
        }));
      }

      setSaved(true);
      // 🆕 Дараагийн tab руу шилжих
      if (onNextTab) {
        setTimeout(() => {
          onNextTab();
        }, 300);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Trade Behavior хадгалахад алдаа гарлаа.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-xl border bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-500">
          Арилжааны зан төлөв ачааллаж байна...
        </p>
      </section>
    );
  }

  // ХАРАХ горим
  if (mode === "view") {
    return (
      <div className="space-y-4">
        <ViewBehaviorItem
          label="Төлөвлөгөөний биелэлт"
          value={form.plan_adherence}
          options={{
            full: "Бүрэн",
            partial: "Хагас",
            violated: "Дагаагүй",
          }}
          dangerValues={["violated"]}
        />
        <ViewBehaviorItem
          label="Stop Loss өөрчлөлт"
          value={form.sl_modification}
          options={{
            none: "Үгүй",
            as_planned: "Төлөвлөсөн байдлаар",
            increased_risk: "Эрсдэлийг нэмэгдүүлсэн",
            emotional: "Сэтгэл хөдлөлөөр",
          }}
          dangerValues={["increased_risk", "emotional"]}
        />
        <ViewBehaviorItem
          label="Take Profit өөрчлөлт"
          value={form.tp_modification}
          options={{
            none: "Үгүй",
            based_on_new_info: "Шинэ мэдээлэлд тулгуурлаж",
            fear: "Айснаас болж",
            greed: "Шуналаас болж",
          }}
          dangerValues={["fear", "greed"]}
        />
        <ViewBehaviorItem
          label="Эрт хаалт"
          value={form.early_exit}
          options={{
            no: "Үгүй",
            as_planned: "Төлөвлөсөн байдлаар",
            fear: "Айснаас болж",
            impatience: "Тэвчээргүйгээс",
          }}
          dangerValues={["fear", "impatience"]}
        />

        {!form.id && (
          <p className="text-sm text-gray-400 text-center py-4">
            ⬜ Зан төлөвийн мэдээлэл бүртгэгдээгүй байна
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
        <h2 className="text-lg font-semibold">⚡ Арилжааны зан төлөв</h2>
        <p className="mt-1 text-sm text-gray-500">
          Арилжаа хийх үеийн зан төлөв, төлөвлөгөөг хэрхэн дагасан талаар
          бүртгэнэ.
        </p>
      </div>

      <div className="space-y-6 p-5">
        {/* PLAN ADHERENCE */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Төлөвлөгөөний биелэлт
          </label>
          <p className="mb-3 text-xs text-gray-500">
            Арилжаа хийхдээ төлөвлөгөөгөө хэр зэрэг дагасан бэ?
          </p>
          <div className="flex flex-wrap gap-2">
            <OptionButton
              label="Бүрэн"
              value="full"
              currentValue={form.plan_adherence}
              onChange={(value) => update("plan_adherence", value)}
            />
            <OptionButton
              label="Хагас"
              value="partial"
              currentValue={form.plan_adherence}
              onChange={(value) => update("plan_adherence", value)}
            />
            <OptionButton
              label="Дагаагүй"
              value="violated"
              currentValue={form.plan_adherence}
              onChange={(value) => update("plan_adherence", value)}
              variant="danger"
            />
            {form.plan_adherence && (
              <button
                type="button"
                onClick={() => update("plan_adherence", null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600"
              >
                Цэвэрлэх
              </button>
            )}
          </div>
        </div>

        {/* STOP LOSS MODIFICATION */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Stop Loss өөрчлөлт
          </label>
          <p className="mb-3 text-xs text-gray-500">
            Stop Loss-оо өөрчилсөн үү? Хэрвээ тийм бол ямар шалтгаанаар?
          </p>
          <div className="flex flex-wrap gap-2">
            <OptionButton
              label="Үгүй"
              value="none"
              currentValue={form.sl_modification}
              onChange={(value) => update("sl_modification", value)}
            />
            <OptionButton
              label="Төлөвлөсөн байдлаар"
              value="as_planned"
              currentValue={form.sl_modification}
              onChange={(value) => update("sl_modification", value)}
            />
            <OptionButton
              label="Эрсдэлийг нэмэгдүүлсэн"
              value="increased_risk"
              currentValue={form.sl_modification}
              onChange={(value) => update("sl_modification", value)}
              variant="danger"
            />
            <OptionButton
              label="Сэтгэл хөдлөлөөр"
              value="emotional"
              currentValue={form.sl_modification}
              onChange={(value) => update("sl_modification", value)}
              variant="danger"
            />
            {form.sl_modification && (
              <button
                type="button"
                onClick={() => update("sl_modification", null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600"
              >
                Цэвэрлэх
              </button>
            )}
          </div>
        </div>

        {/* TAKE PROFIT MODIFICATION */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Take Profit өөрчлөлт
          </label>
          <p className="mb-3 text-xs text-gray-500">
            Take Profit-оо өөрчилсөн үү? Хэрвээ тийм бол ямар шалтгаанаар?
          </p>
          <div className="flex flex-wrap gap-2">
            <OptionButton
              label="Үгүй"
              value="none"
              currentValue={form.tp_modification}
              onChange={(value) => update("tp_modification", value)}
            />
            <OptionButton
              label="Шинэ мэдээлэлд тулгуурлаж"
              value="based_on_new_info"
              currentValue={form.tp_modification}
              onChange={(value) => update("tp_modification", value)}
            />
            <OptionButton
              label="Айснаас болж"
              value="fear"
              currentValue={form.tp_modification}
              onChange={(value) => update("tp_modification", value)}
              variant="danger"
            />
            <OptionButton
              label="Шуналаас болж"
              value="greed"
              currentValue={form.tp_modification}
              onChange={(value) => update("tp_modification", value)}
              variant="danger"
            />
            {form.tp_modification && (
              <button
                type="button"
                onClick={() => update("tp_modification", null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600"
              >
                Цэвэрлэх
              </button>
            )}
          </div>
        </div>

        {/* EARLY EXIT */}
        <div>
          <label className="mb-2 block text-sm font-medium">Эрт хаалт</label>
          <p className="mb-3 text-xs text-gray-500">
            Төлөвлөснөөс эрт гарсан уу? Хэрвээ тийм бол ямар шалтгаанаар?
          </p>
          <div className="flex flex-wrap gap-2">
            <OptionButton
              label="Үгүй"
              value="no"
              currentValue={form.early_exit}
              onChange={(value) => update("early_exit", value)}
            />
            <OptionButton
              label="Төлөвлөсөн байдлаар"
              value="as_planned"
              currentValue={form.early_exit}
              onChange={(value) => update("early_exit", value)}
            />
            <OptionButton
              label="Айснаас болж"
              value="fear"
              currentValue={form.early_exit}
              onChange={(value) => update("early_exit", value)}
              variant="danger"
            />
            <OptionButton
              label="Шуналаас болж"
              value="impatience"
              currentValue={form.early_exit}
              onChange={(value) => update("early_exit", value)}
              variant="danger"
            />
            {form.early_exit && (
              <button
                type="button"
                onClick={() => update("early_exit", null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600"
              >
                Цэвэрлэх
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between border-t p-5 dark:border-gray-800">
        <div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {saved && !error && (
            <p className="text-sm text-green-500">
              Арилжааны зан төлөв хадгалагдлаа.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Хадгалж байна..." : "Хадгалах"}
        </button>
      </div>
    </section>
  );
}

// Helper component for view mode
function ViewBehaviorItem({
  label,
  value,
  options,
  dangerValues = [],
}: {
  label: string;
  value: string | null;
  options: Record<string, string>;
  dangerValues?: string[];
}) {
  const labelText = value ? options[value] : null;
  const isDanger = value && dangerValues.includes(value);

  return (
    <div className="flex items-center justify-between rounded-lg border p-4 dark:border-gray-700">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span
        className={`text-sm font-medium ${labelText ? (isDanger ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400") : "text-gray-400"}`}
      >
        {labelText || "—"}
      </span>
    </div>
  );
}
