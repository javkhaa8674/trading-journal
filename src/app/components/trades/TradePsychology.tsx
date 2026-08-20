"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";

type TradePsychologyData = {
  id?: string;
  mood: string;
  confidence_level: number | null;
  anxiety_level: number | null;
  trading_urge_level: number | null;
  plan_followed: boolean | null;
  emotional_interference: boolean | null;
  execution_quality: number | null;
  mistakes: string[];
  lesson_learned: string;
  notes: string;
};

type Props = {
  tradeId: string;
};

const initialState: TradePsychologyData = {
  mood: "",
  confidence_level: null,
  anxiety_level: null,
  trading_urge_level: null,
  plan_followed: null,
  emotional_interference: null,
  execution_quality: null,
  mistakes: [],
  lesson_learned: "",
  notes: "",
};

export default function TradePsychology({ tradeId }: Props) {
  const [form, setForm] = useState<TradePsychologyData>(initialState);

  const [mistakeInput, setMistakeInput] = useState("");

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
        .from("trade_psychology")
        .select(
          `
          id,
          mood,
          confidence_level,
          anxiety_level,
          trading_urge_level,
          plan_followed,
          emotional_interference,
          execution_quality,
          mistakes,
          lesson_learned,
          notes
        `,
        )
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
          mood: data.mood ?? "",
          confidence_level: data.confidence_level,
          anxiety_level: data.anxiety_level,
          trading_urge_level: data.trading_urge_level,
          plan_followed: data.plan_followed,
          emotional_interference: data.emotional_interference,
          execution_quality: data.execution_quality,
          mistakes: data.mistakes ?? [],
          lesson_learned: data.lesson_learned ?? "",
          notes: data.notes ?? "",
        });
      }

      setLoading(false);
    }

    load();
  }, [tradeId]);

  function update<K extends keyof TradePsychologyData>(
    key: K,
    value: TradePsychologyData[K],
  ) {
    setSaved(false);

    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function addMistake() {
    const value = mistakeInput.trim();

    if (!value) return;

    if (form.mistakes.includes(value)) {
      setMistakeInput("");
      return;
    }

    update("mistakes", [...form.mistakes, value]);
    setMistakeInput("");
  }

  function removeMistake(index: number) {
    update(
      "mistakes",
      form.mistakes.filter((_, i) => i !== index),
    );
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
        mood: form.mood || null,
        confidence_level: form.confidence_level,
        anxiety_level: form.anxiety_level,
        trading_urge_level: form.trading_urge_level,
        plan_followed: form.plan_followed,
        emotional_interference: form.emotional_interference,
        execution_quality: form.execution_quality,
        mistakes: form.mistakes,
        lesson_learned: form.lesson_learned.trim() || null,
        notes: form.notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (form.id) {
        const { error } = await supabase
          .from("trade_psychology")
          .update(payload)
          .eq("id", form.id)
          .eq("trade_id", tradeId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("trade_psychology")
          .insert(payload)
          .select("id")
          .single();

        if (error) throw error;

        setForm((current) => ({
          ...current,
          id: data.id,
        }));
      }

      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Psychology хадгалахад алдаа гарлаа.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-xl border bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-500">Psychology ачааллаж байна...</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* HEADER */}

      <div className="border-b p-5 dark:border-gray-800">
        <h2 className="text-lg font-semibold">🧠 Trade Psychology</h2>

        <p className="mt-1 text-sm text-gray-500">
          Энэ trade-ийн сэтгэл зүй болон execution-ээ бүртгэнэ.
        </p>
      </div>

      <div className="space-y-6 p-5">
        {/* MOOD */}

        <div>
          <label className="mb-2 block text-sm font-medium">Mood</label>

          <input
            type="text"
            value={form.mood}
            onChange={(e) => update("mood", e.target.value)}
            placeholder="Жишээ: Calm, Excited, Fearful..."
            className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          />
        </div>

        {/* LEVELS */}

        <div className="grid gap-5 md:grid-cols-3">
          <LevelInput
            label="Confidence"
            value={form.confidence_level}
            onChange={(value) => update("confidence_level", value)}
          />

          <LevelInput
            label="Anxiety"
            value={form.anxiety_level}
            onChange={(value) => update("anxiety_level", value)}
          />

          <LevelInput
            label="Trading Urge"
            value={form.trading_urge_level}
            onChange={(value) => update("trading_urge_level", value)}
          />
        </div>

        {/* BOOLEAN QUESTIONS */}

        <div className="grid gap-5 md:grid-cols-2">
          <BooleanInput
            label="Plan followed?"
            value={form.plan_followed}
            onChange={(value) => update("plan_followed", value)}
          />

          <BooleanInput
            label="Emotional interference?"
            value={form.emotional_interference}
            onChange={(value) => update("emotional_interference", value)}
          />
        </div>

        {/* EXECUTION */}

        <div>
          <label className="mb-2 block text-sm font-medium">
            Execution Quality
          </label>

          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => update("execution_quality", value)}
                className={`h-10 w-10 rounded-lg border text-sm ${
                  form.execution_quality === value
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "dark:border-gray-600"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {/* MISTAKES */}

        <div>
          <label className="mb-2 block text-sm font-medium">Mistakes</label>

          <div className="flex gap-2">
            <input
              type="text"
              value={mistakeInput}
              onChange={(e) => setMistakeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addMistake();
                }
              }}
              placeholder="Mistake нэмэх..."
              className="flex-1 rounded-lg border bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />

            <button
              type="button"
              onClick={addMistake}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Add
            </button>
          </div>

          {form.mistakes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {form.mistakes.map((mistake, index) => (
                <button
                  key={`${mistake}-${index}`}
                  type="button"
                  onClick={() => removeMistake(index)}
                  className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-600 dark:bg-red-950/30"
                >
                  {mistake} ×
                </button>
              ))}
            </div>
          )}
        </div>

        {/* LESSON */}

        <div>
          <label className="mb-2 block text-sm font-medium">
            Lesson Learned
          </label>

          <textarea
            value={form.lesson_learned}
            onChange={(e) => update("lesson_learned", e.target.value)}
            rows={4}
            placeholder="Энэ trade-ээс юу сурсан бэ?"
            className="w-full rounded-lg border bg-white p-3 text-sm dark:border-gray-600 dark:bg-gray-800"
          />
        </div>

        {/* NOTES */}

        <div>
          <label className="mb-2 block text-sm font-medium">Notes</label>

          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={4}
            placeholder="Нэмэлт тэмдэглэл..."
            className="w-full rounded-lg border bg-white p-3 text-sm dark:border-gray-600 dark:bg-gray-800"
          />
        </div>
      </div>

      {/* FOOTER */}

      <div className="flex items-center justify-between border-t p-5 dark:border-gray-800">
        <div>
          {error && <p className="text-sm text-red-500">{error}</p>}

          {saved && !error && (
            <p className="text-sm text-green-500">Psychology хадгалагдлаа.</p>
          )}
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Psychology"}
        </button>
      </div>
    </section>
  );
}

function LevelInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>

      <select
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : Number(e.target.value))
        }
        className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
      >
        <option value="">Select</option>

        {[1, 2, 3, 4, 5].map((value) => (
          <option key={value} value={value}>
            {value} / 5
          </option>
        ))}
      </select>
    </div>
  );
}

function BooleanInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`rounded-lg border px-4 py-2 text-sm ${
            value === true
              ? "border-green-500 bg-green-500 text-white"
              : "dark:border-gray-600"
          }`}
        >
          Yes
        </button>

        <button
          type="button"
          onClick={() => onChange(false)}
          className={`rounded-lg border px-4 py-2 text-sm ${
            value === false
              ? "border-red-500 bg-red-500 text-white"
              : "dark:border-gray-600"
          }`}
        >
          No
        </button>

        <button
          type="button"
          onClick={() => onChange(null)}
          className={`rounded-lg border px-4 py-2 text-sm ${
            value === null
              ? "bg-gray-100 dark:bg-gray-800"
              : "dark:border-gray-600"
          }`}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
