"use client";

import React, { useState } from "react";
import { HelpTooltip } from "@/app/components/dashboard/HelpTooltip"; // ✅ зөв path
import { Account } from "@/types/accounts";
import ChartIndicators from "./ChartIndicators";

interface ChartControlsProps {
  accounts: Account[];
  selectedAccount: string;
  onAccountChange: (id: string) => void;
  chartType: "candlestick" | "line" | "area" | "bar";
  onChartTypeChange: (type: "candlestick" | "line" | "area" | "bar") => void;
  timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w";
  onTimeframeChange: (
    tf: "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w",
  ) => void;
  indicators: string[];
  onIndicatorsChange: (indicators: string[]) => void;
}

const ChartControls: React.FC<ChartControlsProps> = ({
  accounts,
  selectedAccount,
  onAccountChange,
  chartType,
  onChartTypeChange,
  timeframe,
  onTimeframeChange,
  indicators,
  onIndicatorsChange,
}) => {
  const [isChartTypeOpen, setIsChartTypeOpen] = useState(false);
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);

  const chartTypes = [
    { value: "candlestick", label: "📊 Candlestick" },
    { value: "line", label: "📈 Line" },
    { value: "area", label: "📉 Area" },
    { value: "bar", label: "📊 Bar" },
  ];

  const timeframes = [
    { value: "1m", label: "1m" },
    { value: "5m", label: "5m" },
    { value: "15m", label: "15m" },
    { value: "1h", label: "1h" },
    { value: "4h", label: "4h" },
    { value: "1d", label: "1D" },
    { value: "1w", label: "1W" },
  ];

  const getChartTypeLabel = () => {
    const found = chartTypes.find((t) => t.value === chartType);
    return found ? found.label : "Chart Type";
  };

  const getTimeframeLabel = () => {
    const found = timeframes.find((t) => t.value === timeframe);
    return found ? found.label : "Timeframe";
  };

  // Account status-ийн өнгө
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "achieved":
        return "bg-blue-500";
      case "closed":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Account Selector */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Account:
        </label>
        <select
          value={selectedAccount}
          onChange={(e) => onAccountChange(e.target.value)}
          className="px-3 py-1.5 border rounded-md text-sm bg-white dark:bg-gray-800 dark:border-gray-600 min-w-[150px]"
        >
          <option value="all">📊 All Accounts</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name} ({acc.broker})
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          {selectedAccount !== "all" && (
            <div className="flex items-center gap-1">
              <span
                className={`inline-block w-2 h-2 rounded-full ${getStatusColor(
                  accounts.find((a) => a.id === selectedAccount)?.status ||
                    "active",
                )}`}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {accounts.find((a) => a.id === selectedAccount)?.status}
              </span>
            </div>
          )}
        </div>
        <HelpTooltip
          title="Данс"
          description="Арилжааны дансаа сонгох. 'All Accounts' сонголтоор бүх дансны арилжааг харуулна"
          position="top"
        />
      </div>

      {/* Chart Type Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsChartTypeOpen(!isChartTypeOpen)}
          className="px-3 py-1.5 border rounded-md text-sm bg-white dark:bg-gray-800 dark:border-gray-600 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <span>{getChartTypeLabel()}</span>
          <span className="text-xs">{isChartTypeOpen ? "▲" : "▼"}</span>
        </button>
        <HelpTooltip
          title="Chart төрөл"
          description="Chart-ийн төрлийг сонгох: Candlestick (лаа), Line (шугам), Area (дүүргэлт), Bar (баар)"
          position="top"
        />

        {isChartTypeOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 min-w-[160px] z-20">
            {chartTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  onChartTypeChange(type.value as any);
                  setIsChartTypeOpen(false);
                }}
                className={`
                  w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all
                  ${
                    chartType === type.value
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }
                `}
              >
                <span>{type.label}</span>
                {chartType === type.value && (
                  <span className="ml-auto text-blue-500">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Timeframe Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsTimeframeOpen(!isTimeframeOpen)}
          className="px-3 py-1.5 border rounded-md text-sm bg-white dark:bg-gray-800 dark:border-gray-600 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <span>{getTimeframeLabel()}</span>
          <span className="text-xs">{isTimeframeOpen ? "▲" : "▼"}</span>
        </button>
        <HelpTooltip
          title="Хугацаа"
          description="Хугацааны интервалыг сонгох. 1м (1 минут) - 1W (1 долоо хоног)"
          position="top"
        />

        {isTimeframeOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 min-w-[100px] z-20">
            {timeframes.map((tf) => (
              <button
                key={tf.value}
                onClick={() => {
                  onTimeframeChange(tf.value as any);
                  setIsTimeframeOpen(false);
                }}
                className={`
                  w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all
                  ${
                    timeframe === tf.value
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }
                `}
              >
                <span>{tf.label}</span>
                {timeframe === tf.value && (
                  <span className="ml-auto text-blue-500">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Indicators */}
      <div className="flex items-center gap-2">
        <ChartIndicators
          indicators={indicators}
          onIndicatorsChange={onIndicatorsChange}
        />
        <HelpTooltip
          title="Индикаторууд"
          description="Техникийн шинжилгээний индикаторууд. SMA, EMA, RSI, MACD, BB гэх мэт"
          position="top"
        />
      </div>
    </div>
  );
};

export default ChartControls;
