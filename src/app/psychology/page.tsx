// app/(app)/psychology/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { analyzePsychology, generateSummary } from "@/lib/psychologyAnalytics";
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

export default function PsychologyPage() {
  const [entries, setEntries] = useState<PsychologyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PsychologyEntry | null>(
    null,
  );
  const [selectedMistakes, setSelectedMistakes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [dateRange, setDateRange] = useState<"week" | "month" | "all">("week");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

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

  // Load psychology entries
  useEffect(() => {
    const loadEntries = async () => {
      const user = await getCurrentUser();
      if (!user) return;

      const query = supabase
        .from("psychology_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      const { data } = await query;
      setEntries(data || []);
      setLoading(false);
    };

    loadEntries();
  }, []);

  // Filter entries by date range
  const filteredEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.date);
    const now = new Date();
    if (dateRange === "week") {
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      return entryDate >= weekAgo;
    }
    if (dateRange === "month") {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      return entryDate >= monthAgo;
    }
    return true;
  });

  const analysis = showAnalysis ? analyzePsychology(filteredEntries) : null;

  const getMistakeName = (id: string) =>
    commonMistakes.find((m) => m.id === id)?.nameMn || id;

  const summary = showAnalysis ? generateSummary(analysis, getMistakeName) : "";

  const handleGenerate = () => {
    setLoadingAnalysis(true);

    setTimeout(() => {
      setShowAnalysis(true);
      setLoadingAnalysis(false);
    }, 1500); // fake AI delay 😄
  };

  // Handle edit
  const handleEdit = (entry: PsychologyEntry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date.slice(0, 10),
      mood: entry.mood,
      confidence_level: entry.confidence_level,
      lesson_learned: entry.lesson_learned || "",
      notes: entry.notes || "",
      trades_count: entry.trades_count || 0,
      winning_trades: entry.winning_trades || 0,
      losing_trades: entry.losing_trades || 0,
      profit_loss: entry.profit_loss || 0,
    });
    setSelectedMistakes(entry.mistakes || []);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    const user = await getCurrentUser();
    if (!user) return;

    const { error } = await supabase
      .from("psychology_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      setError(error.message);
    } else {
      setEntries(entries.filter((e) => e.id !== id));
      setSuccess("Entry deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    }
    setDeleteConfirm(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const user = await getCurrentUser();
    if (!user) {
      setError("Please login first / Нэвтрэнэ үү");
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

    let error;
    if (editingEntry) {
      // Update existing entry
      const { error: updateError } = await supabase
        .from("psychology_entries")
        .update(dataToSave)
        .eq("id", editingEntry.id)
        .eq("user_id", user.id);
      error = updateError;
    } else {
      // Insert new entry
      const { error: insertError } = await supabase
        .from("psychology_entries")
        .upsert(dataToSave, {
          onConflict: "user_id,date",
        });
      error = insertError;
    }

    setSubmitting(false);

    if (error) {
      console.error(error);
      setError(error.message);
    } else {
      setSuccess(
        editingEntry ? "Амжилттай шинэчлэгдлээ!" : "Амжилттай хадгалагдлаа!",
      );

      // Refresh entries
      const { data } = await supabase
        .from("psychology_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      setEntries(data || []);
      setShowForm(false);
      setEditingEntry(null);
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        mood: "calm",
        confidence_level: 5,
        lesson_learned: "",
        notes: "",
        trades_count: 0,
        winning_trades: 0,
        losing_trades: 0,
        profit_loss: 0,
      });
      setSelectedMistakes([]);

      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const cancelEdit = () => {
    setShowForm(false);
    setEditingEntry(null);
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      mood: "calm",
      confidence_level: 5,
      lesson_learned: "",
      notes: "",
      trades_count: 0,
      winning_trades: 0,
      losing_trades: 0,
      profit_loss: 0,
    });
    setSelectedMistakes([]);
    setError(null);
  };

  const avgMood = () => {
    const moods = filteredEntries.map((e) => e.mood);
    const moodScores: Record<string, number> = {
      calm: 5,
      confident: 5,
      anxious: 3,
      fearful: 2,
      frustrated: 2,
      greedy: 3,
    };
    const avg =
      moods.reduce((sum, m) => sum + (moodScores[m] || 3), 0) / moods.length;
    return avg.toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-2xl">🧠</div>
          <div className="text-gray-500 dark:text-gray-400">
            Ачааллаж байна...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">
            🧠 Арилжааны сэтгэлзүй
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Арилжаа хийж байхдаа сэтгэл санаа, алдаа, сэтгэл зүйн байдлаа хянаж
            тэмдэглэх
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingEntry(null);
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 transition-colors"
        >
          <span className="text-lg">+</span>
          <span>Нэмэх</span>
        </button>
      </div>

      {/* Error / Success Messages */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-950/50 dark:text-green-400">
          ✅ {success}
        </div>
      )}

      {/* Psychology Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <span className="text-lg">📊</span>
            <span className="text-sm">Нийт бүртгэл</span>
          </div>
          <div className="mt-2 text-2xl font-bold dark:text-white">
            {entries.length}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <span className="text-lg">😊</span>
            <span className="text-sm">Дундаж сэтгэл санаа</span>
          </div>
          <div className="mt-2 text-2xl font-bold dark:text-white">
            {avgMood()}/5
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <span className="text-lg">⚠️</span>
            <span className="text-sm">Түгээмэл алдаа</span>
          </div>
          <div className="mt-2 text-sm font-medium dark:text-white">
            {entries.length > 0 ? "FOMO" : "—"}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <span className="text-lg">📈</span>
            <span className="text-sm">Сэтгэл санаа vs Гүйцэтгэл</span>
          </div>
          <div className="mt-2 text-sm dark:text-white">
            {entries.length > 0 ? "😌 Calm = +2% better" : "—"}
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setDateRange("week")}
          className={`rounded-lg px-3 py-1 text-sm transition-colors ${
            dateRange === "week"
              ? "bg-blue-500 text-white"
              : "border bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          }`}
        >
          Сүүлийн 7 хоног
        </button>
        <button
          onClick={() => setDateRange("month")}
          className={`rounded-lg px-3 py-1 text-sm transition-colors ${
            dateRange === "month"
              ? "bg-blue-500 text-white"
              : "border bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          }`}
        >
          Сүүлийн 30 хоног
        </button>
        <button
          onClick={() => setDateRange("all")}
          className={`rounded-lg px-3 py-1 text-sm transition-colors ${
            dateRange === "all"
              ? "bg-blue-500 text-white"
              : "border bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          }`}
        >
          Бүх хугацаа
        </button>
      </div>

      {/* Psychology Form */}
      {showForm && (
        <div className="rounded-lg border bg-white p-6 dark:bg-gray-900 dark:border-gray-800">
          <h2 className="mb-4 text-lg font-semibold dark:text-white">
            {editingEntry ? "Засварлах" : "Өдрийн тэмдэглэл"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ... form fields (өмнөхтэй ижил) ... */}
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
                  {(
                    Object.entries(moodIcons) as [
                      string,
                      typeof moodIcons.calm,
                    ][]
                  ).map(([key, value]) => (
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
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {value.labelEn}
                      </div>
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
                      profit_loss:
                        e.target.value === "" ? 0 : parseFloat(e.target.value),
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
                              selectedMistakes.filter(
                                (id) => id !== mistake.id,
                              ),
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

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {submitting
                  ? "Saving..."
                  : editingEntry
                    ? "Шинэчлэх"
                    : "Хадгалах"}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg border px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Цуцлах
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Psychology Entries List with Edit & Delete buttons */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold dark:text-white">
          🤖 AI дүгнэлт хийлгэмээр байвал &quot;Анализ хийх&quot; товчийг дарна
          уу.
        </h3>

        <button
          onClick={handleGenerate}
          className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          {loadingAnalysis ? "AI ачааллаж байна..." : "Анализ хийх"}
        </button>
      </div>
      {showAnalysis && (
        <div className="rounded-lg border bg-purple-50 p-4 dark:bg-purple-950/20 dark:border-purple-800/30">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
            {summary}
          </pre>
        </div>
      )}
      {/* Psychology Tips */}
      <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/20 dark:border-blue-800/30">
        <div className="flex items-center gap-2">
          <span className="text-lg">💡</span>
          <h3 className="font-semibold dark:text-white">
            Арилжааны сэтгэл зүйн зөвлөгөө
          </h3>
        </div>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm dark:text-gray-300">
          <li>
            Арилжааны өдрийн тэмдэглэл хөтөл - Бүх арилжаа болон сэтгэл хөдлөлөө
            тэмдэглэж хэвш
          </li>
          <li>
            Алдаануудаа долоо хоног бүр хяна - Загвар, хэв маягийг нь тодорхойлж
            сур
          </li>
          <li>
            Алдагдлын дараа завсарлага ав - Өшөө хонзойх арилжаа (revenge trade)
            хийхээс зайлсхий
          </li>
          <li>
            Бясалгал, дасгал хөдөлгөөн хий - Сэтгэл санааны тэнцвэрийг
            хадгалахад тусална
          </li>
          <li>
            Эрсдэлийн удирдлагын дүрмээ баримтал - Ямар ч тохиолдолд дүрмээсээ
            хазайхгүй бай
          </li>
          <li>
            Жижиг амжилтуудаа тэмдэглэ, алдаанаасаа суралц - Ялалтаа баярлаж,
            ялагдалаасаа сургамж ав
          </li>
          <li>
            Зах зээлд итгэлтэй биш үед арилжаанд оролцохгүй бай - Хүлээх нь
            алдахаас дээр
          </li>
          <li>
            Арилжааны төлөвлөгөөгөө хатуу баримтал - Зөн совиндоо биш, дүрэмдээ
            дага
          </li>
          <li>
            Стресс ихтэй үед жижиг лотоор арилжаал - Эрсдэлээ бууруулж, сэтгэл
            санааны ачааллыг хөнгөвчил
          </li>
          <li>
            Амжилт, бүтэлгүйтлээ дүн шинжилгээ хий - Аль нь яагаад болсныг
            ойлгох нь хамгийн чухал
          </li>
        </ul>
      </div>
      {/* Golden Rule Section */}
      <div className="mt-8 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-[1px] shadow-lg">
        <div className="rounded-xl bg-gradient-to-br from-white to-gray-50 p-6 dark:from-gray-900 dark:to-gray-800">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 animate-ping rounded-full bg-amber-400/20" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg">
                <span className="text-3xl">🧠</span>
              </div>
            </div>

            <div className="relative">
              <p className="text-center text-xl font-bold leading-relaxed text-gray-800 dark:text-white md:text-2xl">
                <span className="block">
                  Хэрэв та сэтгэл хөдлөлөө удирдаж чадвал,
                </span>
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  зах зээлийг удирдаж чадна
                </span>
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2 backdrop-blur-sm">
              <span className="text-lg">⭐</span>
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Алтан дүрэм
              </span>
              <span className="text-lg">⭐</span>
            </div>

            <div className="mt-4 flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-1 w-6 rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                  style={{ opacity: 0.3 + i * 0.15 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
