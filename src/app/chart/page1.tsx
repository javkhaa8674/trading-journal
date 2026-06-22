"use client";

import React, { useState, useMemo } from "react";
import { useAccounts } from "@/lib/hooks/useAccounts";
import { useTrades } from "@/lib/hooks/useTrades";
import LightweightChart from "@/app/components/chart/LightWeightChart";
import ChartControls from "@/app/components/chart/ChartControls";
import ChartDrawingTools from "@/app/components/chart/ChartDrawingTools";
import { generateForexMockData } from "@/data/mockData";

export default function ChartPage() {
  const { accounts, loading: accountsLoading } = useAccounts();
  const [selectedAccount, setSelectedAccount] = useState<string>("all");

  const { trades, loading: tradesLoading } = useTrades(
    selectedAccount !== "all" ? selectedAccount : undefined,
  );

  const [chartType, setChartType] = useState<
    "candlestick" | "line" | "area" | "bar"
  >("candlestick");
  const [timeframe, setTimeframe] = useState<
    "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w"
  >("1d");
  const [indicators, setIndicators] = useState<string[]>([]);
  const [drawingTools, setDrawingTools] = useState<string[]>([]);

  const [useMockData, setUseMockData] = useState(true);

  const chartData = useMemo(() => {
    if (useMockData) {
      return generateForexMockData(60);
    }
    if (trades.length === 0) return [];
    return aggregateTradesToCandles(trades, timeframe);
  }, [trades, timeframe, useMockData]);

  const isLoading = accountsLoading || tradesLoading;

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading chart data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Header - compact */}
      <div className="flex-shrink-0 flex justify-between items-center px-4 py-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          📊 Chart Analysis
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setUseMockData(!useMockData)}
            className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
              useMockData
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            {useMockData ? "📊 Mock" : "📈 Real"}
          </button>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {chartData.length} candles
          </div>
        </div>
      </div>

      {/* Controls - Indicators нь ChartControls дотор байна */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-sm px-4 py-2 mx-4 rounded-lg">
        <ChartControls
          accounts={accounts}
          selectedAccount={selectedAccount}
          onAccountChange={setSelectedAccount}
          chartType={chartType}
          onChartTypeChange={setChartType}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          indicators={indicators}
          onIndicatorsChange={setIndicators}
        />
      </div>

      {/* Chart - үлдсэн бүх зайг эзлэх, overflow hidden */}
      <div className="flex-1 min-h-0 px-4 pb-4 pt-2 overflow-hidden">
        <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="flex h-full">
            {/* Drawing Tools - зүүн талд */}
            <div className="flex-shrink-0 h-full">
              <ChartDrawingTools
                tools={drawingTools}
                onToolsChange={setDrawingTools}
              />
            </div>

            {/* Chart - голд */}
            <div className="flex-1 min-w-0 h-full">
              <LightweightChart
                data={chartData}
                type={chartType}
                height="100%"
                indicators={indicators}
                drawingTools={drawingTools}
                onDrawingToolsChange={setDrawingTools}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Trades-с OHLC үүсгэх функц
function aggregateTradesToCandles(trades: any[], timeframe: string) {
  if (!trades || trades.length === 0) return [];

  const grouped: { [key: string]: any[] } = {};

  trades.forEach((trade) => {
    const date = new Date(trade.open_time);
    let key: string;

    switch (timeframe) {
      case "1d":
        key = date.toISOString().split("T")[0];
        break;
      case "1w": {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
        break;
      }
      default:
        key = date.toISOString().split("T")[0];
    }

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(trade);
  });

  return Object.keys(grouped)
    .map((key) => {
      const group = grouped[key];
      const prices = group.map((t) => t.entry_price);
      const exits = group.map((t) => t.exit_price || t.entry_price);

      return {
        time: key,
        open: group[0].entry_price,
        high: Math.max(...prices, ...exits),
        low: Math.min(...prices, ...exits),
        close:
          group[group.length - 1].exit_price ||
          group[group.length - 1].entry_price,
        volume: group.length,
      };
    })
    .sort((a, b) => a.time.localeCompare(b.time));
}
