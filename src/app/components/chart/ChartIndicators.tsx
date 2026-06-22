"use client";

import React, { useState } from "react";

interface ChartIndicatorsProps {
  indicators: string[];
  onIndicatorsChange: (indicators: string[]) => void;
}

const INDICATOR_OPTIONS = [
  { id: "SMA", label: "SMA", color: "#FF6B6B" },
  { id: "EMA", label: "EMA", color: "#4ECDC4" },
  { id: "RSI", label: "RSI", color: "#45B7D1" },
  { id: "MACD", label: "MACD", color: "#96CEB4" },
  { id: "BB", label: "BB", color: "#DDA0DD" },
];

const ChartIndicators: React.FC<ChartIndicatorsProps> = ({
  indicators,
  onIndicatorsChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleIndicator = (indId: string) => {
    if (indicators.includes(indId)) {
      onIndicatorsChange(indicators.filter((i) => i !== indId));
    } else {
      onIndicatorsChange([...indicators, indId]);
    }
  };

  const activeCount = indicators.length;
  const hasActive = activeCount > 0;

  return (
    <div className="relative">
      {/* Main button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          px-3 py-1.5 border rounded-md text-sm bg-white dark:bg-gray-800 dark:border-gray-600`}
      >
        <span>📊</span>
        <span>Indicators</span>
        {hasActive && (
          <span className="bg-white text-blue-500 text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
            {activeCount}
          </span>
        )}
        <span className="text-xs">{isOpen ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown - opens below the button */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-[180px] z-20">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">
            Select indicators
          </div>

          {INDICATOR_OPTIONS.map((ind) => {
            const isActive = indicators.includes(ind.id);
            return (
              <button
                key={ind.id}
                onClick={() => toggleIndicator(ind.id)}
                className={`
                  w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all
                  ${isActive ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "hover:bg-gray-100 dark:hover:bg-gray-700"}
                `}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: ind.color }}
                />
                <span className="flex-1 text-left">{ind.label}</span>
                {isActive && <span className="text-blue-500">✓</span>}
              </button>
            );
          })}

          {/* Clear all */}
          {hasActive && (
            <button
              onClick={() => {
                onIndicatorsChange([]);
                setIsOpen(false);
              }}
              className="w-full text-xs text-red-500 hover:text-red-600 mt-1 pt-1 border-t border-gray-200 dark:border-gray-700"
            >
              ✕ Clear All
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ChartIndicators;
