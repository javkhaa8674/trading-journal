"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
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
    borderColor: "border-green-200 dark:border-green-800",
  },
  anxious: {
    icon: "😰",
    labelMn: "Түгшсэн",
    labelEn: "Anxious",
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
    borderColor: "border-yellow-200 dark:border-yellow-800",
  },
  confident: {
    icon: "😎",
    labelMn: "Итгэлтэй",
    labelEn: "Confident",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  fearful: {
    icon: "😨",
    labelMn: "Айсан",
    labelEn: "Fearful",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  greedy: {
    icon: "🤑",
    labelMn: "Шунахай",
    labelEn: "Greedy",
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
  frustrated: {
    icon: "😤",
    labelMn: "Ууртай",
    labelEn: "Frustrated",
    color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    borderColor: "border-red-200 dark:border-red-800",
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

const ITEMS_PER_PAGE = 10;

export default function PsychologyPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<PsychologyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [dateRange, setDateRange] = useState<"week" | "month" | "all">("week");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [allEntries, setAllEntries] = useState<PsychologyEntry[]>([]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastCardRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loadingMore, hasMore],
  );

  // Load all entries first (for filtering)
  useEffect(() => {
    const loadEntries = async () => {
      const user = await getCurrentUser();
      if (!user) return;

      const { data } = await supabase
        .from("psychology_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      setAllEntries(data || []);
      setLoading(false);
    };

    loadEntries();
  }, []);

  // Filter entries by date range
  const getFilteredEntries = useCallback(() => {
    let filtered = [...allEntries];
    const now = new Date();

    if (dateRange === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      filtered = filtered.filter((e) => new Date(e.date) >= weekAgo);
    } else if (dateRange === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      filtered = filtered.filter((e) => new Date(e.date) >= monthAgo);
    }

    return filtered;
  }, [allEntries, dateRange]);

  // Reset pagination when filter changes
  useEffect(() => {
    setPage(0);
    setEntries([]);
    setHasMore(true);
  }, [dateRange]);

  // Load more entries
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    const filtered = getFilteredEntries();
    const start = page * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const newEntries = filtered.slice(start, end);

    setTimeout(() => {
      if (newEntries.length > 0) {
        setEntries((prev) => [...prev, ...newEntries]);
        setPage((prev) => prev + 1);
        setHasMore(end < filtered.length);
      } else {
        setHasMore(false);
      }
      setLoadingMore(false);
    }, 500);
  }, [page, hasMore, loadingMore, getFilteredEntries]);

  // Initial load
  useEffect(() => {
    if (!loading && allEntries.length > 0) {
      loadMore();
    }
  }, [loading, allEntries, loadMore]);

  const getMistakeName = (id: string) =>
    commonMistakes.find((m) => m.id === id)?.nameMn || id;
  const analysis = showAnalysis
    ? analyzePsychology(getFilteredEntries())
    : null;
  const summary = showAnalysis ? generateSummary(analysis, getMistakeName) : "";

  const handleGenerate = () => {
    setLoadingAnalysis(true);
    setTimeout(() => {
      setShowAnalysis(true);
      setLoadingAnalysis(false);
    }, 1500);
  };

  const handleDelete = async (id: string) => {
    const user = await getCurrentUser();
    if (!user) return;

    const { error } = await supabase
      .from("psychology_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      alert(error.message);
    } else {
      setAllEntries(allEntries.filter((e) => e.id !== id));
      setEntries(entries.filter((e) => e.id !== id));
    }
    setDeleteConfirm(null);
  };

  const avgMood = () => {
    const filtered = getFilteredEntries();
    const moods = filtered.map((e) => e.mood);
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

  const getWinRate = () => {
    const filtered = getFilteredEntries();
    const totalTrades = filtered.reduce(
      (sum, e) => sum + (e.trades_count || 0),
      0,
    );
    const winningTrades = filtered.reduce(
      (sum, e) => sum + (e.winning_trades || 0),
      0,
    );
    return totalTrades > 0
      ? ((winningTrades / totalTrades) * 100).toFixed(0)
      : "0";
  };

  const getTotalProfitLoss = () => {
    const filtered = getFilteredEntries();
    return filtered.reduce((sum, e) => sum + (e.profit_loss || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-2xl">🧠</div>
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </div>
    );
  }

  const filteredCount = getFilteredEntries().length;

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            🧠 Арилжааны сэтгэлзүй
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Арилжаа хийж байхдаа сэтгэл санаа, алдаа, сэтгэл зүйн байдлаа хянах
          </p>
        </div>
        <button
          onClick={() => router.push("/psychology/new")}
          className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base text-white hover:bg-blue-600"
        >
          <span className="text-base sm:text-lg">+</span>
          <span>Шинэ тэмдэглэл</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-3 sm:p-4 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-base sm:text-lg">📊</span>
            <span className="text-xs sm:text-sm">Нийт бүртгэл</span>
          </div>
          <div className="mt-1 sm:mt-2 text-lg sm:text-2xl font-bold">
            {filteredCount}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-3 sm:p-4 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-base sm:text-lg">😊</span>
            <span className="text-xs sm:text-sm">Дундаж сэтгэл санаа</span>
          </div>
          <div className="mt-1 sm:mt-2 text-lg sm:text-2xl font-bold">
            {avgMood()}/5
          </div>
        </div>
        <div className="rounded-lg border bg-white p-3 sm:p-4 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-base sm:text-lg">📈</span>
            <span className="text-xs sm:text-sm">Win Rate</span>
          </div>
          <div className="mt-1 sm:mt-2 text-lg sm:text-2xl font-bold text-green-600">
            {getWinRate()}%
          </div>
        </div>
        <div className="rounded-lg border bg-white p-3 sm:p-4 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-base sm:text-lg">💰</span>
            <span className="text-xs sm:text-sm">Нийт P/L</span>
          </div>
          <div
            className={`mt-1 sm:mt-2 text-lg sm:text-2xl font-bold ${getTotalProfitLoss() >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {getTotalProfitLoss() >= 0 ? "+" : ""}
            {getTotalProfitLoss().toFixed(2)} USD
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "week", label: "Сүүлийн 7 хоног" },
          { key: "month", label: "Сүүлийн 30 хоног" },
          { key: "all", label: "Бүх хугацаа" },
        ].map((range) => (
          <button
            key={range.key}
            onClick={() => setDateRange(range.key as typeof dateRange)}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              dateRange === range.key
                ? "bg-blue-500 text-white"
                : "border bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* AI Analysis Section */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
        <h3 className="text-base sm:text-lg font-semibold">
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

      {/* Entries List - Card View */}
      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed p-8 text-center dark:border-gray-700">
            <div className="mb-2 text-4xl">📔</div>
            <p className="text-gray-500 dark:text-gray-400">
              Одоогоор бүртгэлгүй байна
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Арилжааны сэтгэл зүйгээ хянаж эхлэх
            </p>
          </div>
        ) : (
          entries.map((entry, index) => {
            const moodData = moodIcons[entry.mood];
            const isLast = index === entries.length - 1;

            return (
              <div
                key={entry.id}
                ref={isLast ? lastCardRef : null}
                className={`rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-gray-900 dark:border-gray-800 ${moodData?.borderColor || ""}`}
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${moodData?.color || "bg-gray-100"}`}
                    >
                      <span className="text-xl">{moodData?.icon || "😐"}</span>
                    </div>
                    <div>
                      <div className="font-semibold dark:text-white">
                        {new Date(entry.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Итгэлийн түвшин: {entry.confidence_level}/10
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        entry.profit_loss >= 0
                          ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                      }`}
                    >
                      {entry.profit_loss >= 0 ? "+" : ""}
                      {entry.profit_loss?.toFixed(2)} USD
                    </div>

                    {/* Action Buttons */}
                    {deleteConfirm === entry.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                        >
                          Устгах
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                        >
                          Цуцлах
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          onClick={() => router.push(`/psychology/${entry.id}`)}
                          className="rounded p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950"
                          title="Засах"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(entry.id)}
                          className="rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                          title="Устгах"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trading Stats */}
                {(entry.trades_count > 0 ||
                  entry.winning_trades > 0 ||
                  entry.losing_trades > 0) && (
                  <div className="mt-3 flex flex-wrap gap-3 border-t pt-3 text-sm">
                    {entry.trades_count > 0 && (
                      <div>
                        <span className="text-gray-500">Арилжааны тоо:</span>
                        <span className="ml-1 font-medium">
                          {entry.trades_count}
                        </span>
                      </div>
                    )}
                    {entry.winning_trades > 0 && (
                      <div>
                        <span className="text-gray-500">Ашигтай:</span>
                        <span className="ml-1 font-medium text-green-600">
                          {entry.winning_trades}
                        </span>
                      </div>
                    )}
                    {entry.losing_trades > 0 && (
                      <div>
                        <span className="text-gray-500">Алдагдалтай:</span>
                        <span className="ml-1 font-medium text-red-600">
                          {entry.losing_trades}
                        </span>
                      </div>
                    )}
                    {entry.trades_count > 0 && (
                      <div>
                        <span className="text-gray-500">Win Rate:</span>
                        <span className="ml-1 font-medium">
                          {(
                            (entry.winning_trades / entry.trades_count) *
                            100
                          ).toFixed(0)}
                          %
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Mistakes */}
                {entry.mistakes && entry.mistakes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    <span className="text-xs text-gray-500">Алдаанууд:</span>
                    {entry.mistakes.map((mistakeId) => {
                      const mistake = commonMistakes.find(
                        (m) => m.id === mistakeId,
                      );
                      return mistake ? (
                        <span
                          key={mistakeId}
                          className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600 dark:bg-red-950/50 dark:text-red-400"
                        >
                          {mistake.nameMn}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Lesson Learned */}
                {entry.lesson_learned && (
                  <div className="mt-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
                    <div className="flex items-start gap-2">
                      <span className="text-sm">📖</span>
                      <div>
                        <div className="text-xs font-medium text-amber-700 dark:text-amber-400">
                          Сургамж
                        </div>
                        <div className="text-sm dark:text-gray-300">
                          {entry.lesson_learned}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {entry.notes && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {entry.notes}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading indicator */}
        {loadingMore && (
          <div className="py-4 text-center">
            <div className="inline-flex items-center gap-2 text-gray-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
              <span>Ачааллаж байна...</span>
            </div>
          </div>
        )}

        {/* No more entries */}
        {!hasMore && entries.length > 0 && (
          <div className="py-4 text-center text-sm text-gray-400">
            — Бүх бүртгэл харагдлаа —
          </div>
        )}
      </div>

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
        </ul>
      </div>

      {/* Golden Rule Section */}
      <div className="overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-[1px] shadow-lg">
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
