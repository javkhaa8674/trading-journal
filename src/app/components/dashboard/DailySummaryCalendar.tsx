"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
  setMonth,
  setYear,
  getYear,
  getMonth,
} from "date-fns";

interface DailySummaryCalendarProps {
  data: Map<string, { count: number; profit: number }>;
}

export function DailySummaryCalendar({ data }: DailySummaryCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Get available years from data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    data.forEach((_, dateStr) => {
      const year = parseInt(dateStr.split("-")[0]);
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [data]);

  const currentYear = getYear(currentDate);
  const currentMonth = getMonth(currentDate);

  // Get all days for the current month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentDate]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Months array
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Get day data
  const getDayData = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return data.get(dateStr);
  };

  // Get color based on profit
  const getProfitColor = (profit: number) => {
    if (profit > 100) return "text-green-700";
    if (profit > 0) return "text-green-600";
    if (profit === 0) return "text-gray-500";
    if (profit > -100) return "text-red-600";
    return "text-red-700";
  };

  const getBgColor = (profit: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return "bg-gray-50 dark:bg-gray-800/50";
    if (profit > 100) return "bg-green-100 dark:bg-green-950/30";
    if (profit > 0) return "bg-green-50 dark:bg-green-950/20";
    if (profit === 0) return "bg-gray-50 dark:bg-gray-800";
    if (profit > -100) return "bg-red-50 dark:bg-red-950/20";
    return "bg-red-100 dark:bg-red-950/30";
  };

  // Navigation handlers
  const goToPreviousMonth = () => {
    setCurrentDate((prev) => subMonths(prev, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate((prev) => addMonths(prev, 1));
    setSelectedDate(null);
  };

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  // Year change handler
  const handleYearChange = (year: number) => {
    setCurrentDate(setYear(currentDate, year));
    setSelectedDate(null);
  };

  // Month change handler
  const handleMonthChange = (month: number) => {
    setCurrentDate(setMonth(currentDate, month));
    setSelectedDate(null);
  };

  // Quick year navigation
  const goToPreviousYear = () => {
    setCurrentDate((prev) => setYear(prev, getYear(prev) - 1));
    setSelectedDate(null);
  };

  const goToNextYear = () => {
    setCurrentDate((prev) => setYear(prev, getYear(prev) + 1));
    setSelectedDate(null);
  };

  // Format number with $ sign
  const formatProfit = (profit: number) => {
    if (profit === 0) return "$0";
    const absProfit = Math.abs(profit);
    if (absProfit >= 1000) return `$${(profit / 1000).toFixed(1)}k`;
    if (absProfit >= 100) return `$${profit.toFixed(0)}`;
    return `$${profit.toFixed(2)}`;
  };

  // Calculate month summary
  const monthSummary = useMemo(() => {
    let totalProfit = 0;
    let totalTrades = 0;
    let tradingDays = 0;
    let winningDays = 0;
    let losingDays = 0;

    calendarDays.forEach((day) => {
      if (isSameMonth(day, currentDate)) {
        const dayData = getDayData(day);
        if (dayData) {
          totalProfit += dayData.profit;
          totalTrades += dayData.count;
          tradingDays++;
          if (dayData.profit > 0) winningDays++;
          if (dayData.profit < 0) losingDays++;
        }
      }
    });

    return {
      totalProfit,
      totalTrades,
      tradingDays,
      winningDays,
      losingDays,
      avgProfitPerDay: tradingDays > 0 ? totalProfit / tradingDays : 0,
      avgTradesPerDay: tradingDays > 0 ? totalTrades / tradingDays : 0,
      winRate: tradingDays > 0 ? (winningDays / tradingDays) * 100 : 0,
    };
  }, [calendarDays, currentDate, data]);

  const selectedDayData = selectedDate ? data.get(selectedDate) : null;

  if (data.size === 0) {
    return (
      <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold">Daily Summary</h3>
        <div className="flex h-[400px] items-center justify-center text-gray-500">
          No trading data available
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-900">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-xl font-semibold">Daily Summary</h3>

        {/* Year Navigation + Dropdown */}
        <div className="flex items-center gap-2">
          {/* Year quick nav */}
          <button
            onClick={goToPreviousYear}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            title="Previous Year"
          >
            ⏪
          </button>

          {/* Year Dropdown */}
          <select
            value={currentYear}
            onChange={(e) => handleYearChange(parseInt(e.target.value))}
            className="rounded-lg border px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {/* Year quick nav */}
          <button
            onClick={goToNextYear}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            title="Next Year"
          >
            ⏩
          </button>

          <div className="mx-1 h-6 w-px bg-gray-300"></div>

          {/* Month Navigation */}
          <button
            onClick={goToPreviousMonth}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            ←
          </button>

          {/* Month Dropdown */}
          <select
            value={currentMonth}
            onChange={(e) => handleMonthChange(parseInt(e.target.value))}
            className="rounded-lg border px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {months.map((month, index) => (
              <option key={month} value={index}>
                {month}
              </option>
            ))}
          </select>

          <button
            onClick={goToNextMonth}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            →
          </button>

          <button
            onClick={goToCurrentMonth}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            Today
          </button>
        </div>
      </div>

      {/* Month Title */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold">
          {months[currentMonth]} {currentYear}
        </h2>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[650px]">
          {/* Weekday headers */}
          <div className="mb-2 grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-500"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              const dayData = getDayData(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const profit = dayData?.profit || 0;
              const count = dayData?.count || 0;
              const isSelected = selectedDate === format(day, "yyyy-MM-dd");

              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (dayData) {
                      setSelectedDate(format(day, "yyyy-MM-dd"));
                    }
                  }}
                  disabled={!dayData}
                  className={`
                    min-h-[100px] rounded-lg p-2 text-left transition-all
                    ${getBgColor(profit, isCurrentMonth)}
                    ${!isCurrentMonth ? "opacity-40" : ""}
                    ${dayData ? "cursor-pointer hover:shadow-md hover:scale-[1.02]" : "cursor-default"}
                    ${isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""}
                  `}
                >
                  <div className="mb-1 text-right text-sm font-medium">
                    {format(day, "d")}
                  </div>

                  {dayData && (
                    <>
                      <div
                        className={`text-sm font-bold ${getProfitColor(profit)}`}
                      >
                        {formatProfit(profit)}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        📊 {count} trade{count !== 1 ? "s" : ""}
                      </div>
                      {Math.abs(profit) > 0 && (
                        <div className="mt-0.5 text-[10px] text-gray-400">
                          avg: ${(profit / count).toFixed(2)}
                        </div>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Month Summary Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 border-t pt-4 md:grid-cols-4 lg:grid-cols-7">
        <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
          <div className="text-xs text-gray-500">Trading Days</div>
          <div className="text-xl font-bold">{monthSummary.tradingDays}</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
          <div className="text-xs text-gray-500">Total Trades</div>
          <div className="text-xl font-bold">{monthSummary.totalTrades}</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
          <div className="text-xs text-gray-500">Total PnL</div>
          <div
            className={`text-xl font-bold ${
              monthSummary.totalProfit >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            ${monthSummary.totalProfit.toFixed(2)}
          </div>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
          <div className="text-xs text-gray-500">Win/Loss Days</div>
          <div className="text-sm font-medium">
            <span className="text-green-600">{monthSummary.winningDays}</span>
            <span className="text-gray-400"> / </span>
            <span className="text-red-600">{monthSummary.losingDays}</span>
          </div>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
          <div className="text-xs text-gray-500">Win Rate (Days)</div>
          <div className="text-xl font-bold">
            {monthSummary.winRate.toFixed(0)}%
          </div>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
          <div className="text-xs text-gray-500">Avg PnL/Day</div>
          <div
            className={`text-sm font-medium ${
              monthSummary.avgProfitPerDay >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            ${monthSummary.avgProfitPerDay.toFixed(2)}
          </div>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
          <div className="text-xs text-gray-500">Avg Trades/Day</div>
          <div className="text-sm font-medium">
            {monthSummary.avgTradesPerDay.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-green-100 dark:bg-green-950/30"></div>
          <span>$100+ profit</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-green-50 dark:bg-green-950/20"></div>
          <span>$1-100 profit</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-gray-50 dark:bg-gray-800"></div>
          <span>$0 (Breakeven)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-red-50 dark:bg-red-950/20"></div>
          <span>-$1 to -100 loss</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-red-100 dark:bg-red-950/30"></div>
          <span>-$100+ loss</span>
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && selectedDayData && (
        <div className="mt-4 rounded-lg border-2 border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                {format(new Date(selectedDate), "EEEE, MMMM d, yyyy")}
              </p>
              <div className="mt-2 flex flex-wrap gap-4">
                <div>
                  <span className="text-sm text-gray-600">Trades:</span>
                  <span className="ml-1 font-medium">
                    {selectedDayData.count}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Net Profit:</span>
                  <span
                    className={`ml-1 font-bold ${
                      selectedDayData.profit >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    ${selectedDayData.profit.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">
                    Avg Profit/Trade:
                  </span>
                  <span
                    className={`ml-1 font-medium ${
                      selectedDayData.profit / selectedDayData.count >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    $
                    {(selectedDayData.profit / selectedDayData.count).toFixed(
                      2,
                    )}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedDate(null)}
              className="rounded-full p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
