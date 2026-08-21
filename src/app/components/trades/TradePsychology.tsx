"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";

type TradePsychologyData = {
  id?: string;

  // Emotional State
  calmness_level: number | null;
  anxiety_level: number | null;
  fear_level: number | null;
  greed_level: number | null;
  frustration_level: number | null;
  confidence_level: number | null;

  // Cognitive State
  focus_level: number | null;
  patience_level: number | null;
  decision_clarity_level: number | null;
  decision_pressure_level: number | null;

  rushed_decision: boolean | null;
  fomo: boolean | null;
  emotional_carryover: boolean | null;
};

type Props = {
  tradeId: string;
};

const initialState: TradePsychologyData = {
  calmness_level: null,
  anxiety_level: null,
  fear_level: null,
  greed_level: null,
  frustration_level: null,
  confidence_level: null,

  focus_level: null,
  patience_level: null,
  decision_clarity_level: null,
  decision_pressure_level: null,

  rushed_decision: null,
  fomo: null,
  emotional_carryover: null,
};

export default function TradePsychology({ tradeId }: Props) {
  const [form, setForm] = useState<TradePsychologyData>(initialState);

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
          calmness_level,
          anxiety_level,
          fear_level,
          greed_level,
          frustration_level,
          confidence_level,
          focus_level,
          patience_level,
          decision_clarity_level,
          decision_pressure_level,
          rushed_decision,
          fomo,
          emotional_carryover
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

          calmness_level: data.calmness_level,
          anxiety_level: data.anxiety_level,
          fear_level: data.fear_level,
          greed_level: data.greed_level,
          frustration_level: data.frustration_level,
          confidence_level: data.confidence_level,

          focus_level: data.focus_level,
          patience_level: data.patience_level,
          decision_clarity_level: data.decision_clarity_level,
          decision_pressure_level: data.decision_pressure_level,

          rushed_decision: data.rushed_decision,
          fomo: data.fomo,
          emotional_carryover: data.emotional_carryover,
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

        calmness_level: form.calmness_level,
        anxiety_level: form.anxiety_level,
        fear_level: form.fear_level,
        greed_level: form.greed_level,
        frustration_level: form.frustration_level,
        confidence_level: form.confidence_level,

        focus_level: form.focus_level,
        patience_level: form.patience_level,
        decision_clarity_level: form.decision_clarity_level,
        decision_pressure_level: form.decision_pressure_level,

        rushed_decision: form.rushed_decision,
        fomo: form.fomo,
        emotional_carryover: form.emotional_carryover,

        updated_at: new Date().toISOString(),
      };

      if (form.id) {
        const { error } = await supabase
          .from("trade_psychology")
          .update(payload)
          .eq("id", form.id)
          .eq("trade_id", tradeId)
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }
      } else {
        const { data, error } = await supabase
          .from("trade_psychology")
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
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Pre-Trade Psychology хадгалахад алдаа гарлаа.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-xl border bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-500">
          Арилжааны өмнөх сэтгэлзүй хуудсыг ачааллаж байна...
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* HEADER */}

      <div className="border-b p-5 dark:border-gray-800">
        <h2 className="text-lg font-semibold">🧠 Арилжааны өмнөх сэтгэл зүй</h2>

        <p className="mt-1 text-sm text-gray-500">
          Арилжаа хийхийн өмнөх сэтгэл зүй болон танин мэдэхүйн төлөвөө
          бүртгэнэ.
        </p>
      </div>

      <div className="space-y-8 p-5">
        {/* EMOTIONAL STATE */}

        <div>
          <div className="mb-4">
            <h3 className="text-base font-semibold">Сэтгэл хөдлөлийн төлөв</h3>

            <p className="mt-1 text-xs text-gray-500">
              Арилжаа хийхийн өмнөх тухайн үеийн сэтгэл хөдлөлийн төлөв.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <LevelInput
              label="Тогтвортой байдал"
              value={form.calmness_level}
              onChange={(value) => update("calmness_level", value)}
            />

            <LevelInput
              label="Түгшүүр/Сандарсан байдал"
              value={form.anxiety_level}
              onChange={(value) => update("anxiety_level", value)}
            />

            <LevelInput
              label="Айдас"
              value={form.fear_level}
              onChange={(value) => update("fear_level", value)}
            />

            <LevelInput
              label="Шунал"
              value={form.greed_level}
              onChange={(value) => update("greed_level", value)}
            />

            <LevelInput
              label="Бухимдал"
              value={form.frustration_level}
              onChange={(value) => update("frustration_level", value)}
            />

            <LevelInput
              label="Өөртөө итгэх итгэл"
              value={form.confidence_level}
              onChange={(value) => update("confidence_level", value)}
            />
          </div>
        </div>

        {/* COGNITIVE STATE */}

        <div>
          <div className="mb-4">
            <h3 className="text-base font-semibold">Танин мэдэхүйн төлөв</h3>

            <p className="mt-1 text-xs text-gray-500">
              Арилжаа хийхийн өмнөх анхаарал, шийдвэр гаргалт болон сэтгэлзүйн
              дарамтын төлөв.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <LevelInput
              label="Төвлөрөл"
              value={form.focus_level}
              onChange={(value) => update("focus_level", value)}
            />

            <LevelInput
              label="Тэвчээр"
              value={form.patience_level}
              onChange={(value) => update("patience_level", value)}
            />

            <LevelInput
              label="Шийдвэрийн тодорхой байдал"
              value={form.decision_clarity_level}
              onChange={(value) => update("decision_clarity_level", value)}
            />

            <LevelInput
              label="Шийдвэрийн дарамт"
              value={form.decision_pressure_level}
              onChange={(value) => update("decision_pressure_level", value)}
            />
          </div>
        </div>

        {/* COGNITIVE FLAGS */}

        <div>
          <div className="mb-4">
            <h3 className="text-base font-semibold">
              Шийдвэр ба сэтгэл хөдлөлийн улаан туг
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Тухайн арилжаа хийхийн өмнө эдгээр нөхцөл байсан эсэх.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <BooleanInput
              label="Яаран гаргасан шийдвэр"
              description="Энэ арилжаа яаран гаргасан шийдвэр байсан эсэх."
              value={form.rushed_decision}
              onChange={(value) => update("rushed_decision", value)}
            />

            <BooleanInput
              label="Хоцрох айдас (FOMO)"
              description="Энэ арилжаа хийхдээ FOMO буюу хоцрох вий гэсэн айдас байсан эсэх."
              value={form.fomo}
              onChange={(value) => update("fomo", value)}
            />

            <BooleanInput
              label="Сэтгэл хөдлөлийн үлдэгдэл"
              description="Энэ арилжаа хийхийн өмнө өмнөх арилжаанаас үлдсэн сэтгэл хөдлөлийн нөлөө байсан эсэх."
              value={form.emotional_carryover}
              onChange={(value) => update("emotional_carryover", value)}
            />
          </div>
        </div>
      </div>

      {/* FOOTER */}

      <div className="flex items-center justify-between border-t p-5 dark:border-gray-800">
        <div>
          {error && <p className="text-sm text-red-500">{error}</p>}

          {saved && !error && (
            <p className="text-sm text-green-500">
              Арилжааны өмнөх сэтгэл зүйд хадгалагдлаа.
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
        <option value="">Сонгох</option>

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
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <p className="mt-1 text-xs text-gray-500 mb-2">{description}</p>
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
          Тийм
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
          Үгүй
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
          Цэвэрлэх
        </button>
      </div>
    </div>
  );
}
