// components/dashboard/DateRangeFilter.tsx
"use client";

import { useState, useMemo } from "react";

type DateRange = {
  from: string;
  to: string;
};

type DateRangeFilterProps = {
  onRangeChange: (range: { from: string; to: string } | null) => void;
  trades: any[];
};

export function DateRangeFilter({
  onRangeChange,
  trades,
}: DateRangeFilterProps) {
  const [selectedRange, setSelectedRange] = useState<string>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  // Get available years and months from trades
  const availableDates = useMemo(() => {
    const years = new Set<number>();
    const months = new Map<number, Set<number>>();

    trades.forEach((trade) => {
      const date = new Date(trade.close_time || trade.open_time);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      years.add(year);
      if (!months.has(year)) {
        months.set(year, new Set());
      }
      months.get(year)!.add(month);
    });

    return {
      years: Array.from(years).sort((a, b) => b - a),
      months: months,
    };
  }, [trades]);

  const handleRangeChange = (range: string) => {
    setSelectedRange(range);
    setShowCustom(false);

    const now = new Date();
    let from = "";
    let to = "";

    switch (range) {
      case "today":
        from = new Date().toISOString().split("T")[0];
        to = from;
        break;
      case "yesterday":
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        from = yesterday.toISOString().split("T")[0];
        to = from;
        break;
      case "week":
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        from = weekAgo.toISOString().split("T")[0];
        to = now.toISOString().split("T")[0];
        break;
      case "month":
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        from = monthAgo.toISOString().split("T")[0];
        to = now.toISOString().split("T")[0];
        break;
      case "year":
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        from = yearAgo.toISOString().split("T")[0];
        to = now.toISOString().split("T")[0];
        break;
      default:
        onRangeChange(null);
        return;
    }

    onRangeChange({ from, to });
  };

  const handleCustomRange = () => {
    if (customFrom && customTo) {
      onRangeChange({ from: customFrom, to: customTo });
      setShowCustom(false);
    }
  };

  const handleYearMonthSelect = (year: string, month: string) => {
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    const firstDay = `${yearNum}-${String(monthNum).padStart(2, "0")}-01`;
    const lastDay = new Date(yearNum, monthNum, 0).toISOString().split("T")[0];
    onRangeChange({ from: firstDay, to: lastDay });
    setSelectedRange("custom");
  };

  const handleYearSelect = (year: string) => {
    const yearNum = parseInt(year);
    const firstDay = `${yearNum}-01-01`;
    const lastDay = `${yearNum}-12-31`;
    onRangeChange({ from: firstDay, to: lastDay });
    setSelectedRange("custom");
  };

  return (
    <div className="space-y-3">
      {/* Quick select buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleRangeChange("today")}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            selectedRange === "today"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          📅 Өнөөдөр
        </button>
        <button
          onClick={() => handleRangeChange("yesterday")}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            selectedRange === "yesterday"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          📆 Өчигдөр
        </button>
        <button
          onClick={() => handleRangeChange("week")}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            selectedRange === "week"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          📊 Сүүлийн 7 хоног
        </button>
        <button
          onClick={() => handleRangeChange("month")}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            selectedRange === "month"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          📈 Сүүлийн 30 хоног
        </button>
        <button
          onClick={() => handleRangeChange("year")}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            selectedRange === "year"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          📉 Сүүлийн жил
        </button>
        <button
          onClick={() => {
            setShowCustom(!showCustom);
            setSelectedRange("custom");
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

      {/* Year/Month dropdowns (Dependent) */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          onChange={(e) => {
            const year = e.target.value;
            if (year) {
              const defaultMonth = availableDates.months
                .get(parseInt(year))
                ?.values()
                .next().value;
              if (defaultMonth) {
                handleYearMonthSelect(year, String(defaultMonth));
              } else {
                handleYearSelect(year);
              }
            }
          }}
          className="rounded-lg border p-2 text-sm bg-white dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">Жил сонгох</option>
          {availableDates.years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <select
          onChange={(e) => {
            const [year, month] = e.target.value.split("-");
            if (year && month) {
              handleYearMonthSelect(year, month);
            }
          }}
          className="rounded-lg border p-2 text-sm bg-white dark:bg-gray-800 dark:border-gray-700"
          disabled={availableDates.years.length === 0}
        >
          <option value="">Сар сонгох</option>
          {availableDates.years.map((year) =>
            Array.from(availableDates.months.get(year) || [])
              .sort((a, b) => a - b)
              .map((month) => (
                <option key={`${year}-${month}`} value={`${year}-${month}`}>
                  {year} - {month} сар
                </option>
              )),
          )}
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
            placeholder="From"
          />
          <span className="text-gray-500">→</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="rounded-lg border p-2 text-sm bg-white dark:bg-gray-700 dark:border-gray-600"
            placeholder="To"
          />
          <button
            onClick={handleCustomRange}
            disabled={!customFrom || !customTo}
            className="px-3 py-1.5 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      )}

      {/* Active filter display */}
      {selectedRange !== "all" && (
        <div className="text-xs text-blue-600 dark:text-blue-400">
          🔍 Filter active
        </div>
      )}
    </div>
  );
}
