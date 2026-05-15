"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { PsychologyEntry, Mistake } from "@/types/psychology";

const moodIcons = {
  calm: {
    icon: "😌",
    labelMn: "Тайван",
    labelEn: "Calm",
    color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  },
  anxious: {
    icon: "😰",
    labelMn: "Түгшсэн",
    labelEn: "Anxious",
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  },
  confident: {
    icon: "😎",
    labelMn: "Итгэлтэй",
    labelEn: "Confident",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  },
  fearful: {
    icon: "😨",
    labelMn: "Айсан",
    labelEn: "Fearful",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  },
  greedy: {
    icon: "🤑",
    labelMn: "Шунахай",
    labelEn: "Greedy",
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  },
  frustrated: {
    icon: "😤",
    labelMn: "Ууртай",
    labelEn: "Frustrated",
    color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  },
};

const commonMistakes: Mistake[] = [
  {
    id: "1",
    name: "FOMO (Fear Of Missing Out)",
    nameMn: "Алдах вий гэх айдас (FOMO)",
    category: "emotional",
    categoryMn: "сэтгэл хөдлөл",
  },
  {
    id: "2",
    name: "Revenge trading",
    nameMn: "Өшөө хонзойх арилжаа",
    category: "emotional",
    categoryMn: "сэтгэл хөдлөл",
  },
  {
    id: "3",
    name: "Over-leveraging",
    nameMn: "Хэт их хөшүүрэг ашиглах",
    category: "risk",
    categoryMn: "эрсдэл",
  },
  {
    id: "4",
    name: "Moving stop loss",
    nameMn: "Stop loss-ийг зөөх",
    category: "discipline",
    categoryMn: "сахилга бат",
  },
  {
    id: "5",
    name: "Not following plan",
    nameMn: "Төлөвлөгөөгөө дагахгүй байх",
    category: "discipline",
    categoryMn: "сахилга бат",
  },
  {
    id: "6",
    name: "Trading during news",
    nameMn: "Мэдээний үеэр арилжаалах",
    category: "strategy",
    categoryMn: "стратеги",
  },
  {
    id: "7",
    name: "Overtrading",
    nameMn: "Хэт их арилжаалах",
    category: "discipline",
    categoryMn: "сахилга бат",
  },
  {
    id: "8",
    name: "Not taking profit",
    nameMn: "Ашгаа авахгүй байх",
    category: "greed",
    categoryMn: "шунал",
  },
  {
    id: "9",
    name: "Holding losers too long",
    nameMn: "Алдагдалтай арилжааг удаан барих",
    category: "fear",
    categoryMn: "айдас",
  },
  {
    id: "10",
    name: "Entering without confirmation",
    nameMn: "Баталгаажуулалтгүйгээр орох",
    category: "discipline",
    categoryMn: "сахилга бат",
  },
];

export default function NewPsychologyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMistakes, setSelectedMistakes] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    mood: "calm" as PsychologyEntry["mood"],
    confidence_level: 5,
    lesson_learned: "",
    notes: "",
    trades_count: 0,
    winning_trades: 0,
    losing_trades: 0,
    profit_loss: 0,
  });

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

    const dataToSave = {
      user_id: user.id,
      date: formData.date,
      mood: formData.mood,
      confidence_level: formData.confidence_level,
      mistakes: selectedMistakes,
      lesson_learned: formData.lesson_learned,
      notes: formData.notes,
      trades_count: formData.trades_count,
      winning_trades: formData.winning_trades,
      losing_trades: formData.losing_trades,
      profit_loss: formData.profit_loss,
    };

    const { error: insertError } = await supabase
      .from("psychology_entries")
      .upsert(dataToSave, { onConflict: "user_id,date" });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
    } else {
      router.push("/psychology");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ←
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">➕ Шинэ тэмдэглэл</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Арилжааны сэтгэл зүйн тэмдэглэл нэмэх
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 sm:p-6 dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium dark:text-gray-300">
                Огноо *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="mt-1 w-full rounded-lg border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-gray-300">
                Сэтгэл санаа *
              </label>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {Object.entries(moodIcons).map(([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        mood: key as PsychologyEntry["mood"],
                      })
                    }
                    className={`rounded-lg p-2 text-center transition-all ${
                      formData.mood === key
                        ? value.color + " ring-2 ring-blue-500"
                        : "border bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="text-xl">{value.icon}</div>
                    <div className="text-xs">{value.labelMn}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-gray-300">
                Итгэлийн түвшин (1-10) *
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.confidence_level}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    confidence_level: parseInt(e.target.value),
                  })
                }
                className="mt-1 w-full"
              />
              <div className="text-center text-sm font-bold dark:text-white">
                {formData.confidence_level}/10
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-gray-300">
                Арилжааны тоо
              </label>
              <input
                type="number"
                value={formData.trades_count}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    trades_count: parseInt(e.target.value),
                  })
                }
                className="mt-1 w-full rounded-lg border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-gray-300">
                Ашигтай арилжаа
              </label>
              <input
                type="number"
                value={formData.winning_trades}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    winning_trades: parseInt(e.target.value),
                  })
                }
                className="mt-1 w-full rounded-lg border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-gray-300">
                Алдагдалтай арилжаа
              </label>
              <input
                type="number"
                value={formData.losing_trades}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    losing_trades: parseInt(e.target.value),
                  })
                }
                className="mt-1 w-full rounded-lg border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-gray-300">
                Ашиг/Алдагдал ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.profit_loss || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    profit_loss: parseFloat(e.target.value),
                  })
                }
                className="mt-1 w-full rounded-lg border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium dark:text-gray-300">
                Гаргасан алдаанууд
              </label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {commonMistakes.map((mistake) => (
                  <label
                    key={mistake.id}
                    className="flex items-center gap-2 text-sm dark:text-gray-300"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMistakes.includes(mistake.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMistakes([
                            ...selectedMistakes,
                            mistake.id,
                          ]);
                        } else {
                          setSelectedMistakes(
                            selectedMistakes.filter((id) => id !== mistake.id),
                          );
                        }
                      }}
                      className="rounded dark:bg-gray-800"
                    />
                    <span className="text-xs text-gray-400">
                      {mistake.nameMn}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium dark:text-gray-300">
                Сургамж
              </label>
              <textarea
                value={formData.lesson_learned}
                onChange={(e) =>
                  setFormData({ ...formData, lesson_learned: e.target.value })
                }
                className="mt-1 w-full rounded-lg border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                rows={2}
                placeholder="Өнөөдөр юу сурсан бэ?"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium dark:text-gray-300">
                Тэмдэглэл
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="mt-1 w-full rounded-lg border p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                rows={3}
                placeholder="Нэмэлт бодол, сэтгэл хөдлөл, ажиглалт..."
              />
            </div>
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
              className="flex-1 rounded-lg bg-blue-500 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {submitting ? "Хадгалж байна..." : "✅ Хадгалах"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border px-4 py-2 hover:bg-gray-50 dark:border-gray-700"
            >
              ❌ Цуцлах
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
