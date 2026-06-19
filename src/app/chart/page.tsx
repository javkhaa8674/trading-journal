"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createChart, CandlestickSeries } from "lightweight-charts";
import { HelpTooltip } from "@/app/components/dashboard/HelpTooltip";
import { ApiKeyService } from "@/lib/apiKeyService";
import { ForexSymbolService, ForexSymbol } from "@/lib/forexSymbolService";

// Types
interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface MarketData {
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
  timestamp: string;
}

// Timeframes
const TIMEFRAMES = [
  { label: "1m", value: "1" },
  { label: "5m", value: "5" },
  { label: "15m", value: "15" },
  { label: "30m", value: "30" },
  { label: "1h", value: "60" },
  { label: "4h", value: "240" },
  { label: "1d", value: "D" },
  { label: "1w", value: "W" },
  { label: "1M", value: "M" },
];

export default function ChartPage() {
  const [apiKey, setApiKey] = useState<string>("");
  const [isApiKeySaved, setIsApiKeySaved] = useState(false);
  const [isLoadingKey, setIsLoadingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<{
    status: "active" | "expiring_soon" | "expired" | "not_found";
    daysRemaining?: number;
    expiresAt?: string | null;
    message?: string;
  } | null>(null);
  const [symbols, setSymbols] = useState<ForexSymbol[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<ForexSymbol | null>(
    null,
  );
  const [timeframe, setTimeframe] = useState("60");
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showApiInput, setShowApiInput] = useState(false);
  const [isLoadingSymbols, setIsLoadingSymbols] = useState(true);

  // Chart refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Supabase-аас Forex symbols авах
  useEffect(() => {
    const loadSymbols = async () => {
      setIsLoadingSymbols(true);
      try {
        const result = await ForexSymbolService.getActiveSymbols();
        if (result.success && result.data && result.data.length > 0) {
          setSymbols(result.data);
          setSelectedSymbol(result.data[0]);
        } else {
          setError("Forex symbols олдсонгүй");
        }
      } catch (err) {
        console.error("Error loading forex symbols:", err);
        setError("Forex symbols ачаалахад алдаа гарлаа");
      } finally {
        setIsLoadingSymbols(false);
      }
    };

    loadSymbols();
  }, []);

  // ✅ API key ачаалах
  useEffect(() => {
    const loadApiKey = async () => {
      if (!selectedSymbol) return;

      setIsLoadingKey(true);
      try {
        const result = await ApiKeyService.getApiKey("itick");
        if (result.success && result.data) {
          setApiKey(result.data.api_key);
          setIsApiKeySaved(true);
          setShowApiInput(false);

          const status = await ApiKeyService.getKeyStatus("itick");
          setKeyStatus(status);

          if (status.status !== "expired") {
            fetchHistoricalData(
              selectedSymbol.symbol,
              timeframe,
              result.data.api_key,
            );
          } else {
            setError("API key-ийн хугацаа дууссан. Шинэ түлхүүр оруулна уу.");
          }
        } else {
          setShowApiInput(true);
          setKeyStatus({
            status: "not_found",
            message: "API key олдсонгүй. Эхлээд түлхүүрээ оруулна уу.",
          });
        }
      } catch (err) {
        console.error("Error loading API key:", err);
        setShowApiInput(true);
      } finally {
        setIsLoadingKey(false);
      }
    };

    loadApiKey();
  }, [selectedSymbol]);

  // Fetch historical data from iTick API
  const fetchHistoricalData = async (
    symbol: string,
    interval: string,
    key?: string,
  ) => {
    const currentKey = key || apiKey;

    if (!currentKey) {
      setError("API key оруулна уу");
      setShowApiInput(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const intervalMap: { [key: string]: string } = {
        "1": "1m",
        "5": "5m",
        "15": "15m",
        "30": "30m",
        "60": "1h",
        "240": "4h",
        D: "1d",
        W: "1w",
        M: "1M",
      };

      const params = new URLSearchParams({
        symbol: symbol,
        interval: intervalMap[interval] || "1h",
        limit: "200",
      });

      const response = await fetch(
        `https://api.itick.org/v1/market/kline?${params}`,
        {
          headers: {
            Authorization: `Bearer ${currentKey}`,
          },
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "API key хүчингүй эсвэл хугацаа нь дууссан. Шинэ key оруулна уу.",
          );
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.data && data.data.length > 0) {
        const formattedData: ChartData[] = data.data.map((item: any[]) => ({
          time: item[0],
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseInt(item[5]) || 0,
        }));

        setChartData(formattedData);

        const lastCandle = formattedData[formattedData.length - 1];
        const previousCandle =
          formattedData[formattedData.length - 2] || lastCandle;
        const change = lastCandle.close - previousCandle.close;
        const changePercent = (change / previousCandle.close) * 100;

        setMarketData({
          price: lastCandle.close,
          change: change,
          changePercent: changePercent,
          high: Math.max(...formattedData.map((d) => d.high)),
          low: Math.min(...formattedData.map((d) => d.low)),
          open: formattedData[0].open,
          previousClose: previousCandle.close,
          volume: Math.floor(Math.random() * 1000) + 100,
          timestamp: new Date().toISOString(),
        });

        setLastUpdate(new Date());
      } else {
        throw new Error("Data олдсонгүй");
      }
    } catch (err) {
      console.error("Error fetching chart data:", err);
      setError(err instanceof Error ? err.message : "Data авахад алдаа гарлаа");
      const mockData = generateMockCandlestickData(symbol, interval, 200);
      setChartData(mockData);
    } finally {
      setLoading(false);
    }
  };

  // Mock data generator (fallback)
  const generateMockCandlestickData = (
    symbol: string,
    interval: string,
    count: number,
  ): ChartData[] => {
    const data: ChartData[] = [];
    let basePrice =
      symbol === "EURUSD"
        ? 1.085
        : symbol === "GBPUSD"
          ? 1.265
          : symbol === "USDJPY"
            ? 148.5
            : symbol === "AUDUSD"
              ? 0.655
              : symbol === "USDCAD"
                ? 1.365
                : symbol === "NZDUSD"
                  ? 0.605
                  : symbol === "USDCHF"
                    ? 0.885
                    : symbol === "EURGBP"
                      ? 0.855
                      : symbol === "EURAUD"
                        ? 1.655
                        : 1.085;

    const volatility = symbol === "USDJPY" ? 0.5 : 0.002;
    let currentPrice = basePrice;

    const now = new Date();
    const intervalMinutes =
      interval === "D"
        ? 1440
        : interval === "W"
          ? 10080
          : interval === "M"
            ? 43200
            : parseInt(interval);

    for (let i = count; i > 0; i--) {
      const time = new Date(now.getTime() - i * intervalMinutes * 60 * 1000);

      const change = (Math.random() - 0.5) * volatility * 2;
      const open = currentPrice;
      const close = currentPrice + change;
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;

      data.push({
        time: time.toISOString(),
        open: Number(open.toFixed(5)),
        high: Number(high.toFixed(5)),
        low: Number(low.toFixed(5)),
        close: Number(close.toFixed(5)),
        volume: Math.floor(Math.random() * 500) + 50,
      });

      currentPrice = close;
    }

    return data;
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || chartData.length === 0) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#9CA3AF",
      },
      grid: {
        vertLines: { color: "#374151" },
        horzLines: { color: "#374151" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    candlestickSeriesRef.current = candlestickSeries;

    const candleData = chartData.map((d) => ({
      time: new Date(d.time).getTime() / 1000,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candlestickSeries.setData(candleData);

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [chartData]);

  // Fetch data on symbol/timeframe change
  useEffect(() => {
    if (isApiKeySaved && selectedSymbol) {
      fetchHistoricalData(selectedSymbol.symbol, timeframe);
    }
  }, [selectedSymbol, timeframe]);

  // Auto-refresh
  useEffect(() => {
    if (
      autoRefresh &&
      isApiKeySaved &&
      selectedSymbol &&
      keyStatus?.status !== "expired"
    ) {
      autoRefreshIntervalRef.current = setInterval(() => {
        fetchHistoricalData(selectedSymbol.symbol, timeframe);
      }, 30000);
    } else if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
    }

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [autoRefresh, selectedSymbol, timeframe, isApiKeySaved, keyStatus]);

  // Format price based on symbol
  const formatPrice = (price: number, symbol: string) => {
    const decimals = symbol.includes("JPY") ? 3 : 5;
    return price.toFixed(decimals);
  };

  // Loading state
  if (isLoadingSymbols) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-center h-[600px]">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-500 dark:text-gray-400">
              Forex symbols ачаалж байна...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedSymbol) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-center h-[600px]">
          <div className="text-center text-red-500">
            <div className="text-4xl mb-4">⚠️</div>
            <p>Forex symbols олдсонгүй. Админ дээр нэмнэ үү.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header with API Key Management Link */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            📈 Chart
            <HelpTooltip
              title="Chart"
              description="Forex ханшийн график. Бодит цагийн үнийн хөдөлгөөнийг харж, шинжилгээ хийх боломжтой."
              className="ml-1"
            />
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selectedSymbol.name} • {selectedSymbol.exchange}
          </p>
        </div>

        {/* API Key Status & Management */}
        <div className="flex items-center gap-3">
          {isApiKeySaved && keyStatus && (
            <div
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                keyStatus.status === "expired"
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                  : keyStatus.status === "expiring_soon"
                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                    : keyStatus.status === "active"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              {keyStatus.status === "expired" && "❌ Хугацаа дууссан"}
              {keyStatus.status === "expiring_soon" &&
                `⚠️ ${keyStatus.daysRemaining} хоног үлдсэн`}
              {keyStatus.status === "active" && "✅ Хүчинтэй"}
              {keyStatus.status === "not_found" && "🔑 API key оруулах"}
            </div>
          )}

          <Link
            href="/chart/key"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔑 API Key
          </Link>
        </div>
      </div>

      {/* Market Data */}
      {marketData && (
        <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-2 mb-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPrice(marketData.price, selectedSymbol.symbol)}
            </div>
            <div
              className={`text-sm font-medium ${marketData.change >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              {marketData.change >= 0 ? "+" : ""}
              {marketData.change.toFixed(5)} (
              {marketData.changePercent.toFixed(2)}%)
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <div>⬆ {formatPrice(marketData.high, selectedSymbol.symbol)}</div>
            <div>⬇ {formatPrice(marketData.low, selectedSymbol.symbol)}</div>
          </div>
          <div className="ml-auto text-xs text-gray-400 dark:text-gray-500">
            🕐 {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Controls - Symbol selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {symbols.map((symbol) => (
          <button
            key={symbol.id}
            onClick={() => setSelectedSymbol(symbol)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              selectedSymbol.id === symbol.id
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {symbol.symbol}
          </button>
        ))}
      </div>

      {/* Timeframe selector */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex flex-wrap gap-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                timeframe === tf.value
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() =>
              selectedSymbol &&
              fetchHistoricalData(selectedSymbol.symbol, timeframe)
            }
            disabled={
              loading || !isApiKeySaved || keyStatus?.status === "expired"
            }
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            🔄 {loading ? "..." : ""}
          </button>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
              autoRefresh
                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            {autoRefresh ? "🔴 Auto" : "⏸️ Paused"}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        {!isApiKeySaved ? (
          <div className="flex flex-col items-center justify-center h-[500px] text-yellow-500">
            <div className="text-4xl mb-4">🔑</div>
            <p className="text-center">API key оруулна уу</p>
            <Link
              href="/chart/key"
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              API key оруулах
            </Link>
          </div>
        ) : keyStatus?.status === "expired" ? (
          <div className="flex flex-col items-center justify-center h-[500px] text-red-500">
            <div className="text-6xl mb-4">🚫</div>
            <h3 className="text-xl font-bold mb-2">
              API Key-ийн хугацаа дууссан
            </h3>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-4">
              Таны iTick API түлхүүрийн хүчинтэй хугацаа дууссан байна.
              <br />
              Шинэ түлхүүр авахын тулд доорх товчийг дарна уу.
            </p>
            <Link
              href="/chart/key"
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔑 Шинэ API key оруулах
            </Link>
          </div>
        ) : loading && chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[500px]">
            <div className="animate-spin text-4xl">⏳</div>
          </div>
        ) : (
          <div ref={chartContainerRef} className="w-full h-[500px]" />
        )}
      </div>

      {/* Quick Stats */}
      {marketData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              📈 Өндөр
            </div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {formatPrice(marketData.high, selectedSymbol.symbol)}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              📉 Бага
            </div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {formatPrice(marketData.low, selectedSymbol.symbol)}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              💰 Нээлт
            </div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {formatPrice(marketData.open, selectedSymbol.symbol)}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              🕐 Шинэчлэлт
            </div>
            <div className="font-semibold text-gray-900 dark:text-white text-xs">
              {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
