"use client";

import React, { useState } from "react";
import TradingViewWidget from "@/app/components/chart/TradingViewWidget";
import PositionCalculator from "@/app/components/chart/PositionCalculator";

interface PositionData {
  entry: number;
  tp: number;
  sl: number;
  lotSize: number;
  risk: number;
  reward: number;
  rrRatio: number;
}

export default function ChartPage() {
  const [positionData, setPositionData] = useState<PositionData | null>(null);
  const [isCalculatorVisible, setIsCalculatorVisible] = useState(true);

  const handlePositionChange = (data: PositionData) => {
    setPositionData(data);
    console.log("📊 Position Data:", data);
  };

  const toggleCalculator = () => {
    setIsCalculatorVisible(!isCalculatorVisible);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 flex flex-wrap items-center justify-between gap-2 px-3 py-2 md:px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h1 className="text-base md:text-xl font-bold text-gray-900 dark:text-white">
          📊 Chart Analysis
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Button - Header-т */}
          <button
            onClick={toggleCalculator}
            className={`
              flex items-center gap-1.5
              px-3 py-1.5 rounded-lg
              transition-all duration-300
              ${
                isCalculatorVisible
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }
              text-sm font-medium
              whitespace-nowrap
            `}
          >
            {/* Show/Hide өөр өөр icon */}
            <span>{isCalculatorVisible ? "◀" : "▶"}</span>
            <span>
              {isCalculatorVisible ? "Hide Calculator" : "Show Calculator"}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-2 md:p-4 overflow-hidden">
        <div className="w-full h-[calc(100vh-100px)] flex gap-2 transition-all duration-300">
          {/* Chart - Зүүн талд */}
          <div
            className={`
              rounded-lg shadow-sm overflow-hidden bg-white dark:bg-gray-800
              transition-all duration-300 ease-in-out
              ${isCalculatorVisible ? "flex-1" : "w-full"}
            `}
          >
            <TradingViewWidget
              height="100%"
              locale="mn"
              hide_side_toolbar={false}
              hide_top_toolbar={false}
              allow_symbol_change={true}
              hide_volume={true}
              studies={[]}
            />
          </div>

          {/* Calculator - Баруун талд */}
          <div
            className={`
              rounded-lg shadow-sm overflow-hidden bg-white dark:bg-gray-800
              transition-all duration-300 ease-in-out
              ${isCalculatorVisible ? "w-[340px] opacity-100" : "w-0 opacity-0 overflow-hidden p-0"}
              flex-shrink-0
            `}
          >
            <PositionCalculator
              symbol="XAUUSD"
              onPositionChange={handlePositionChange}
              defaultVisible={true}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
