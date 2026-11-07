"use client";

import { useState, useMemo } from "react";

type DateRangeFilterProps = {
  onRangeChange: (range: { from: string; to: string } | null) => void;
  trades: any[];
};

// Орон нутгийн цагаар YYYY-MM-DD форматлах (timezone алдаа засах)
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function DateRangeFilter({ onRangeChange, trades }: DateRangeFilterProps) {
  const [selectedRange, setSelectedRange] = useState<string>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  // ✅ Сонгосон жил/сарыг тусдаа state-д хадгална
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const availableDates = useMemo(() => {
    const years = new Set<number>();
    const months = new Map<number, Set<number>>();

    trades.forEach((trade) => {
      const date = new Date(trade.close_time || trade.open_time);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      years.add(year);
      if (!months.has(year)) months.set(year, new Set());
      months.get(year)!.add(month);
    });

    return {
      years: Array.from(years).sort((a, b) => b - a),
      months,
    };
  }, [trades]);

  // ✅ Сонгосон жилд байгаа саруудыг л буцаана
  const monthsForSelectedYear = useMemo(() => {
    if (!selectedYear) return [];
    return Array.from(availableDates.months.get(parseInt(selectedYear)) || []).sort(
      (a, b) => a - b
    );
  }, [selectedYear, availableDates]);

  const handleRangeChange = (range: string) => {
    setSelectedRange(range);
    setShowCustom(false);
    // ✅ Quick select хийх үед жил/сарын сонголтыг цэвэрлэнэ
    setSelectedYear("");
    setSelectedMonth("");

    const now = new Date();
    let from = "";
    let to = "";

    switch (range) {
      case "today":
        from = formatDate(now);
        to = from;
        break;
      case "yesterday": {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        from = formatDate(y);
        to = from;
        break;
      }
      case "week": {
        const w = new Date(now);
        w.setDate(w.getDate() - 7);
        from = formatDate(w);
        to = formatDate(now);
        break;
      }
      case "month": {
        const m = new Date(now);
        m.setMonth(m.getMonth() - 1);
        from = formatDate(m);
        to = formatDate(now);
        break;
      }
      case "year": {
        const y = new Date(now);
        y.setFullYear(y.getFullYear() - 1);
        from = formatDate(y);
        to = formatDate(now);
        break;
      }
      default:
        onRangeChange(null);
        return;
    }
    onRangeChange({ from, to });
  };

  // ✅ Жил сольсон үед сарыг цэвэрлэж, бүтэн жилийг сонгоно
  const handleYearSelect = (year: string) => {
    setSelectedYear(year);
    setSelectedMonth("");
    setSelectedRange("custom");

    if (!year) {
      onRangeChange(null);
      return;
    }

    const yearNum = parseInt(year);
    const from = `${yearNum}-01-01`;
    const to = `${yearNum}-12-31`;
    onRangeChange({ from, to });
  };

  // ✅ Сар сольсон үед тухайн сарын from/to-г тооцоолно
  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month);
    setSelectedRange("custom");

    if (!month || !selectedYear) return;

    const yearNum = parseInt(selectedYear);
    const monthNum = parseInt(month);
    const from = `${yearNum}-${String(monthNum).padStart(2, "0")}-01`;
    // ✅ Орон нутгийн цагаар сүүлийн өдөр (timezone-safe)
    const lastDayDate = new Date(yearNum, monthNum, 0);
    const to = formatDate(lastDayDate);

    onRangeChange({ from, to });
  };

  const handleCustomRange = () => {
    if (customFrom && customTo) {
      onRangeChange({ from: customFrom, to: customTo });
      setShowCustom(false);
      setSelectedYear("");
      setSelectedMonth("");
    }
  };

  return (
    <div className="space-y-3">
      {/* Quick select buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "today", label: "📅 Өнөөдөр" },
          { key: "yesterday", label: "📆 Өчигдөр" },
          { key: "week", label: "📊 Сүүлийн 7 хоног" },
          { key: "month", label: "📈 Сүүлийн 30 хоног" },
          { key: "year", label: "📉 Сүүлийн жил" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleRangeChange(key)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              selectedRange === key
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => {
            setShowCustom(!showCustom);
            setSelectedRange("custom");
            setSelectedYear("");
            setSelectedMonth("");
          }}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            showCustom
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          🎯 Гараар тохируулах
        </button>
      </div>

      {/* Year/Month dropdowns */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* ✅ Controlled select — value prop-той */}
        <select
          value={selectedYear}
          onChange={(e) => handleYearSelect(e.target.value)}
          className="rounded-lg border p-2 text-sm bg-white dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">Бүх жил</option>
          {availableDates.years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        {/* ✅ Зөвхөн сонгосон жилийн саруудыг харуулна */}
        <select
          value={selectedMonth}
          onChange={(e) => handleMonthSelect(e.target.value)}
          disabled={!selectedYear || monthsForSelectedYear.length === 0}
          className="rounded-lg border p-2 text-sm bg-white dark:bg-gray-800 dark:border-gray-700 disabled:opacity-50"
        >
          <option value="">Бүх сар</option>
          {monthsForSelectedYear.map((month) => (
            <option key={month} value={month}>
              {selectedYear} - {month} сар
            </option>
          ))}
        </select>
      </div>

      {/* Custom range inputs */}
      {showCustom && (
        <div className="flex flex-wrap gap-2 items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="rounded-lg border p-2 text-sm bg-white dark:bg-gray-700 dark:border-gray-600"
          />
          <span className="text-gray-500">→</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="rounded-lg border p-2 text-sm bg-white dark:bg-gray-700 dark:border-gray-600"
          />
          <button
            onClick={handleCustomRange}
            disabled={!customFrom || !customTo}
            className="px-3 py-1.5 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            Хайх
          </button>
        </div>
      )}

      {selectedRange !== "all" && (
        <div className="text-xs text-blue-600 dark:text-blue-400">
          🔍 Filter active
        </div>
      )}
    </div>
  );
}
