"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  createChart,
  createSeriesMarkers,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  UTCTimestamp,
  LineStyle,
  CrosshairMode,
  CandlestickSeries,
  LineSeries,
} from "lightweight-charts";

import { Trade } from "@/types/trade";

/* =========================================================
   TYPES
========================================================= */

interface TradingChartProps {
  trades?: Trade[];
  loading?: boolean;
  selectedAccountId?: string | null;
  selectedTradeId?: string | null;
}

interface TradePosition {
  id: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  profit: number;
  openTime: Date;
  closeTime: Date;
  type: "long" | "short";
}

interface RectangleData {
  type: "risk" | "reward";
  startTime: number;
  endTime: number;
  topPrice: number;
  bottomPrice: number;
}

type Timeframe = "M5" | "M15" | "H1" | "H4" | "D1";

interface TimeframeConfig {
  label: Timeframe;
  seconds: number;
}

interface ChartTheme {
  background: string;
  text: string;
  border: string;
  crosshair: string;

  bullish: string;
  bearish: string;

  entry: string;
  sl: string;
  tp: string;

  riskFill: string;
  rewardFill: string;

  entryLabelBackground: string;
  slLabelBackground: string;
  tpLabelBackground: string;

  tooltipBackground: string;
}

/* =========================================================
   CONSTANTS
========================================================= */

const TIMEFRAMES: TimeframeConfig[] = [
  {
    label: "M5",
    seconds: 5 * 60,
  },
  {
    label: "M15",
    seconds: 15 * 60,
  },
  {
    label: "H1",
    seconds: 60 * 60,
  },
  {
    label: "H4",
    seconds: 4 * 60 * 60,
  },
  {
    label: "D1",
    seconds: 24 * 60 * 60,
  },
];

const CANDLES_BEFORE_ENTRY = 50;
const CANDLES_AFTER_CLOSE = 50;

/* =========================================================
   THEME
========================================================= */

const DARK_THEME: ChartTheme = {
  background: "#0f1117",
  text: "#d1d4dc",
  border: "#2b2b43",
  crosshair: "#758696",

  bullish: "#26a69a",
  bearish: "#ef5350",

  entry: "#00ff00",
  sl: "#ff6b6b",
  tp: "#51cf66",

  riskFill: "#ff4d4f",
  rewardFill: "#26a69a",

  entryLabelBackground: "rgba(0, 150, 0, 0.94)",
  slLabelBackground: "rgba(190, 45, 50, 0.94)",
  tpLabelBackground: "rgba(35, 150, 95, 0.94)",

  tooltipBackground: "#1e222d",
};

const LIGHT_THEME: ChartTheme = {
  background: "#ffffff",
  text: "#4b5563",
  border: "#e5e7eb",
  crosshair: "#94a3b8",

  bullish: "#16a34a",
  bearish: "#dc2626",

  entry: "#16a34a",
  sl: "#dc2626",
  tp: "#16a34a",

  riskFill: "#ef4444",
  rewardFill: "#16a34a",

  entryLabelBackground: "rgba(22, 163, 74, 0.94)",
  slLabelBackground: "rgba(220, 38, 38, 0.94)",
  tpLabelBackground: "rgba(22, 163, 74, 0.94)",

  tooltipBackground: "#ffffff",
};

/* =========================================================
   HELPERS
========================================================= */

function getCurrentTheme(): ChartTheme {
  if (typeof document === "undefined") {
    return DARK_THEME;
  }

  const isDark = document.documentElement.classList.contains("dark");

  return isDark ? DARK_THEME : LIGHT_THEME;
}

function hexToRgba(hex: string, opacity: number) {
  const clean = hex.replace("#", "");

  const bigint = parseInt(clean, 16);

  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/* =========================================================
   IMPORTANT:
   LIGHTWEIGHT-CHARTS LINE DATA MUST BE ASCENDING
   AND MUST NOT CONTAIN DUPLICATE TIMESTAMPS.
========================================================= */

function createLineData(
  points: { time: number; value: number }[],
): { time: UTCTimestamp; value: number }[] {
  const sorted = [...points].sort((a, b) => a.time - b.time);

  const unique: { time: UTCTimestamp; value: number }[] = [];

  for (const point of sorted) {
    const time = point.time as UTCTimestamp;

    const last = unique[unique.length - 1];

    if (last && last.time === time) {
      last.value = point.value;
      continue;
    }

    unique.push({
      time,
      value: point.value,
    });
  }

  return unique;
}

/* =========================================================
   PRICE PRECISION
========================================================= */

function getPricePrecision(symbol: string) {
  const upper = symbol.toUpperCase();

  if (upper.includes("JPY")) {
    return 3;
  }

  if (upper.includes("XAU") || upper.includes("GOLD")) {
    return 2;
  }

  return 5;
}

function getMinMove(symbol: string) {
  const precision = getPricePrecision(symbol);

  return 1 / Math.pow(10, precision);
}

/* =========================================================
   PIP SIZE
========================================================= */

function getPipSize(symbol: string) {
  const upper = symbol.toUpperCase();

  if (upper.includes("JPY")) {
    return 0.01;
  }

  if (upper.includes("XAU") || upper.includes("GOLD")) {
    return 0.1;
  }

  return 0.0001;
}

/* =========================================================
   PIPS
========================================================= */

function calculatePips(symbol: string, distance: number) {
  const pipSize = getPipSize(symbol);

  if (pipSize <= 0) {
    return 0;
  }

  return Math.abs(distance) / pipSize;
}

/* =========================================================
   MONEY VALUE
========================================================= */

function calculateMoneyValue(
  symbol: string,
  distance: number,
  lotSize: number,
) {
  const upper = symbol.toUpperCase();

  const pips = calculatePips(symbol, distance);

  if (
    upper.includes("EUR") ||
    upper.includes("GBP") ||
    upper.includes("AUD") ||
    upper.includes("NZD") ||
    upper.includes("CAD") ||
    upper.includes("CHF") ||
    upper.includes("JPY")
  ) {
    return pips * 10 * lotSize;
  }

  if (upper.includes("XAU") || upper.includes("GOLD")) {
    return Math.abs(distance) * 100 * lotSize;
  }

  return Math.abs(distance) * 100000 * lotSize;
}

/* =========================================================
   POSITION RECTANGLE
========================================================= */

function PositionRectangle({
  containerRef,
  seriesRef,
  chartRef,
  rectangle,
  color,
  fillOpacity,
  borderColor,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  seriesRef: React.RefObject<ISeriesApi<"Candlestick"> | null>;
  chartRef: React.RefObject<IChartApi | null>;
  rectangle: RectangleData;
  color: string;
  fillOpacity: number;
  borderColor: string;
}) {
  const rectangleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const element = document.createElement("div");

    element.style.position = "absolute";
    element.style.pointerEvents = "none";
    element.style.zIndex = "5";
    element.style.boxSizing = "border-box";
    element.style.background = hexToRgba(color, fillOpacity);
    element.style.border = `1px solid ${borderColor}`;
    element.style.borderRadius = "1px";

    container.appendChild(element);

    rectangleRef.current = element;

    const updateRectangle = () => {
      const chart = chartRef.current;
      const series = seriesRef.current;
      const target = rectangleRef.current;

      if (!chart || !series || !target) {
        return;
      }

      const startX = chart
        .timeScale()
        .timeToCoordinate(rectangle.startTime as UTCTimestamp);

      const endX = chart
        .timeScale()
        .timeToCoordinate(rectangle.endTime as UTCTimestamp);

      const topY = series.priceToCoordinate(rectangle.topPrice);
      const bottomY = series.priceToCoordinate(rectangle.bottomPrice);

      if (
        startX === null ||
        endX === null ||
        topY === null ||
        bottomY === null
      ) {
        target.style.display = "none";
        return;
      }

      const left = Math.min(startX, endX);
      const right = Math.max(startX, endX);

      const top = Math.min(topY, bottomY);
      const bottom = Math.max(topY, bottomY);

      target.style.display = "block";
      target.style.left = `${left}px`;
      target.style.top = `${top}px`;
      target.style.width = `${Math.max(1, right - left)}px`;
      target.style.height = `${Math.max(1, bottom - top)}px`;
    };

    updateRectangle();

    const timeScale = chartRef.current?.timeScale();

    const handleRangeChange = () => {
      requestAnimationFrame(updateRectangle);
    };

    timeScale?.subscribeVisibleLogicalRangeChange(handleRangeChange);
    timeScale?.subscribeVisibleTimeRangeChange(handleRangeChange);

    const resizeObserver = new ResizeObserver(handleRangeChange);

    resizeObserver.observe(container);

    window.addEventListener("resize", handleRangeChange);

    let animationFrame = 0;

    const continuousUpdate = () => {
      updateRectangle();

      animationFrame = requestAnimationFrame(continuousUpdate);
    };

    animationFrame = requestAnimationFrame(continuousUpdate);

    return () => {
      cancelAnimationFrame(animationFrame);

      timeScale?.unsubscribeVisibleLogicalRangeChange(handleRangeChange);
      timeScale?.unsubscribeVisibleTimeRangeChange(handleRangeChange);

      resizeObserver.disconnect();

      window.removeEventListener("resize", handleRangeChange);

      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }

      rectangleRef.current = null;
    };
  }, [
    containerRef,
    seriesRef,
    chartRef,
    rectangle.startTime,
    rectangle.endTime,
    rectangle.topPrice,
    rectangle.bottomPrice,
    color,
    fillOpacity,
    borderColor,
  ]);

  return null;
}

/* =========================================================
   POSITION LABEL
========================================================= */

function PositionInfoLabel({
  containerRef,
  seriesRef,
  chartRef,
  time,
  price,
  text,
  background,
  borderColor,
  textColor,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  seriesRef: React.RefObject<ISeriesApi<"Candlestick"> | null>;
  chartRef: React.RefObject<IChartApi | null>;
  time: number;
  price: number;
  text: string;
  background: string;
  borderColor: string;
  textColor: string;
}) {
  const labelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const label = document.createElement("div");

    label.style.position = "absolute";
    label.style.pointerEvents = "none";
    label.style.zIndex = "30";
    label.style.padding = "4px 7px";
    label.style.borderRadius = "4px";
    label.style.background = background;
    label.style.border = `1px solid ${borderColor}`;
    label.style.color = textColor;
    label.style.fontSize = "11px";
    label.style.fontWeight = "600";
    label.style.lineHeight = "14px";
    label.style.whiteSpace = "nowrap";
    label.style.boxShadow = "0 1px 4px rgba(0,0,0,0.25)";
    label.textContent = text;

    container.appendChild(label);

    labelRef.current = label;

    const update = () => {
      const chart = chartRef.current;
      const series = seriesRef.current;
      const element = labelRef.current;
      const currentContainer = containerRef.current;

      if (!chart || !series || !element || !currentContainer) {
        return;
      }

      const x = chart.timeScale().timeToCoordinate(time as UTCTimestamp);

      const y = series.priceToCoordinate(price);

      if (x === null || y === null) {
        element.style.display = "none";
        return;
      }

      const containerWidth = currentContainer.clientWidth;
      const labelWidth = element.offsetWidth;

      /*
       * Desktop:
       *   label -> line-ийн баруун талд
       *
       * Mobile:
       *   дэлгэцээс гарахгүй байхаар автоматаар зүүн тал руу шилжинэ.
       */

      let left = x + 8;

      if (left + labelWidth > containerWidth - 4) {
        left = x - labelWidth - 8;
      }

      if (left < 4) {
        left = 4;
      }

      element.style.display = "block";
      element.style.left = `${left}px`;
      element.style.top = `${y}px`;
      element.style.transform = "translateY(-50%)";
    };

    update();

    const timeScale = chartRef.current?.timeScale();

    const handleRangeChange = () => {
      requestAnimationFrame(update);
    };

    timeScale?.subscribeVisibleLogicalRangeChange(handleRangeChange);
    timeScale?.subscribeVisibleTimeRangeChange(handleRangeChange);

    const resizeObserver = new ResizeObserver(handleRangeChange);

    resizeObserver.observe(container);

    window.addEventListener("resize", handleRangeChange);

    let animationFrame = 0;

    const continuousUpdate = () => {
      update();

      animationFrame = requestAnimationFrame(continuousUpdate);
    };

    animationFrame = requestAnimationFrame(continuousUpdate);

    return () => {
      cancelAnimationFrame(animationFrame);

      timeScale?.unsubscribeVisibleLogicalRangeChange(handleRangeChange);
      timeScale?.unsubscribeVisibleTimeRangeChange(handleRangeChange);

      resizeObserver.disconnect();

      window.removeEventListener("resize", handleRangeChange);

      if (label.parentNode) {
        label.parentNode.removeChild(label);
      }

      labelRef.current = null;
    };
  }, [
    containerRef,
    seriesRef,
    chartRef,
    time,
    price,
    text,
    background,
    borderColor,
    textColor,
  ]);

  return null;
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export function TradingChart({
  trades: externalTrades,
  loading: externalLoading,
  selectedAccountId,
  selectedTradeId,
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const chartRef = useRef<IChartApi | null>(null);

  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const markersRef = useRef<ReturnType<typeof createSeriesMarkers> | null>(
    null,
  );

  const lineSeriesRefs = useRef<ISeriesApi<"Line">[]>([]);

  const [selectedTrade, setSelectedTrade] = useState<TradePosition | null>(
    null,
  );

  const [rectangles, setRectangles] = useState<RectangleData[]>([]);

  const [timeframe, setTimeframe] = useState<Timeframe>("M5");

  const [isFullscreen, setIsFullscreen] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(false);

  const trades = externalTrades || [];

  const loading = externalLoading !== undefined ? externalLoading : false;

  /* =======================================================
     THEME DETECTION
  ======================================================= */

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;

    const updateTheme = () => {
      setIsDarkMode(root.classList.contains("dark"));
    };

    updateTheme();

    const observer = new MutationObserver(() => {
      updateTheme();
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;

  /* =======================================================
     TIMEFRAME
  ======================================================= */

  const timeframeConfig = useMemo(
    () => TIMEFRAMES.find((item) => item.label === timeframe) || TIMEFRAMES[0],
    [timeframe],
  );

  /* =======================================================
     LATEST TRADE
  ======================================================= */

  const getLatestTrade = (): Trade | null => {
    if (!trades || trades.length === 0) {
      return null;
    }

    const sorted = [...trades].sort((a, b) => {
      const aTime = a.close_time || a.open_time;
      const bTime = b.close_time || b.open_time;

      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return sorted[0];
  };

  /* =======================================================
     SELECTED TRADE
  ======================================================= */

  const getSelectedTrade = (): Trade | null => {
    if (!selectedTradeId) {
      return null;
    }

    return trades.find((trade) => trade.id === selectedTradeId) || null;
  };

  /* =======================================================
     CREATE POSITION
  ======================================================= */

  const createTradePosition = (trade: Trade): TradePosition => {
    const entryPrice = Number(trade.entry_price) || 0;

    const stopLoss = Number(trade.stop_loss) || entryPrice * 0.99;

    const takeProfit = Number(trade.take_profit) || entryPrice * 1.01;

    return {
      id: trade.id,
      symbol: trade.symbol,
      entryPrice,
      exitPrice: Number(trade.exit_price) || 0,
      stopLoss,
      takeProfit,
      lotSize: Number(trade.lot_size) || 1,
      profit: Number(trade.profit) || 0,
      openTime: new Date(trade.open_time),
      closeTime: new Date(trade.close_time),
      type: trade.type === "long" ? "long" : "short",
    };
  };

  /* =======================================================
     DEMO CANDLE DATA
  ======================================================= */

  const generateCandlestickData = (
    position: TradePosition,
  ): CandlestickData[] => {
    const interval = timeframeConfig.seconds;

    const entryTime = Math.floor(position.openTime.getTime() / 1000);

    const closeTime = Math.floor(position.closeTime.getTime() / 1000);

    const alignedEntry = Math.floor(entryTime / interval) * interval;

    const alignedClose = Math.floor(closeTime / interval) * interval;

    const startTime = alignedEntry - CANDLES_BEFORE_ENTRY * interval;

    const endTime = alignedClose + CANDLES_AFTER_CLOSE * interval;

    const data: CandlestickData[] = [];

    const basePrice = position.entryPrice;

    let previousClose = basePrice;

    let index = 0;

    const symbol = position.symbol.toUpperCase();

    let volatility = basePrice * 0.001;

    if (symbol.includes("JPY")) {
      volatility = basePrice * 0.0012;
    }

    if (symbol.includes("XAU") || symbol.includes("GOLD")) {
      volatility = Math.max(0.8, basePrice * 0.0015);
    }

    for (
      let timestamp = startTime;
      timestamp <= endTime;
      timestamp += interval
    ) {
      const distanceFromEntry = Math.floor(
        (timestamp - alignedEntry) / interval,
      );

      const wave = Math.sin(distanceFromEntry * 0.37);

      const wave2 = Math.sin(distanceFromEntry * 0.11);

      let open = previousClose;

      let close = open + (wave * 0.55 + wave2 * 0.35) * volatility;

      if (timestamp === alignedEntry) {
        open = basePrice - volatility * 0.1;
        close = basePrice;
      }

      if (timestamp === alignedClose) {
        const exitPrice = position.exitPrice || previousClose;

        /*
         * Хэрэв entry болон close нэг candle дээр
         * таарсан ч энд асуудалгүй.
         */
        open = previousClose;
        close = exitPrice;
      }

      const wick = volatility * (0.35 + Math.abs(Math.sin(index * 0.29)) * 0.5);

      const high = Math.max(open, close) + wick;

      const low = Math.min(open, close) - wick;

      data.push({
        time: timestamp as UTCTimestamp,
        open,
        high,
        low,
        close,
      });

      previousClose = close;

      index++;
    }

    return data;
  };

  /* =======================================================
     DRAW POSITION LINES
  ======================================================= */

  const drawPositionLines = (
    chart: IChartApi,
    trade: TradePosition,
    currentTheme: ChartTheme,
  ) => {
    const entryPrice = trade.entryPrice;

    const sl = trade.stopLoss;

    const tp = trade.takeProfit;

    const risk = Math.abs(entryPrice - sl);

    const reward = Math.abs(tp - entryPrice);

    const rr = risk > 0 ? reward / risk : 0;

    const interval = timeframeConfig.seconds;

    const entryTime = Math.floor(trade.openTime.getTime() / 1000);

    const closeTime = Math.floor(trade.closeTime.getTime() / 1000);

    const alignedEntry = Math.floor(entryTime / interval) * interval;

    const alignedClose = Math.floor(closeTime / interval) * interval;

    const chartStartTime = alignedEntry - CANDLES_BEFORE_ENTRY * interval;

    const chartEndTime = alignedClose + CANDLES_AFTER_CLOSE * interval;

    /* ===================================================
       RECTANGLES
    =================================================== */

    setRectangles([
      {
        type: "risk",
        startTime: alignedEntry,
        endTime: alignedClose,
        topPrice: Math.max(entryPrice, sl),
        bottomPrice: Math.min(entryPrice, sl),
      },
      {
        type: "reward",
        startTime: alignedEntry,
        endTime: alignedClose,
        topPrice: Math.max(entryPrice, tp),
        bottomPrice: Math.min(entryPrice, tp),
      },
    ]);

    const lineSeries: ISeriesApi<"Line">[] = [];

    const priceFormat = {
      type: "price" as const,
      precision: getPricePrecision(trade.symbol),
      minMove: getMinMove(trade.symbol),
    };

    /* ===================================================
       ENTRY
    =================================================== */

    const entryLine = chart.addSeries(LineSeries, {
      color: currentTheme.entry,
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,

      priceLineVisible: true,
      priceLineColor: currentTheme.entry,

      lastValueVisible: true,

      priceFormat,
    });

    /*
     * IMPORTANT:
     * createLineData() нь duplicate timestamp
     * автоматаар арилгана.
     */
    entryLine.setData(
      createLineData([
        {
          time: chartStartTime,
          value: entryPrice,
        },
        {
          time: alignedEntry,
          value: entryPrice,
        },
        {
          time: alignedClose,
          value: entryPrice,
        },
        {
          time: chartEndTime,
          value: entryPrice,
        },
      ]),
    );

    lineSeries.push(entryLine);

    /* ===================================================
       SL
    =================================================== */

    const slLine = chart.addSeries(LineSeries, {
      color: currentTheme.sl,
      lineWidth: 1,
      lineStyle: LineStyle.Solid,

      priceLineVisible: true,
      priceLineColor: currentTheme.sl,

      lastValueVisible: true,

      priceFormat,
    });

    slLine.setData(
      createLineData([
        {
          time: chartStartTime,
          value: sl,
        },
        {
          time: alignedEntry,
          value: sl,
        },
        {
          time: alignedClose,
          value: sl,
        },
        {
          time: chartEndTime,
          value: sl,
        },
      ]),
    );

    lineSeries.push(slLine);

    /* ===================================================
       TP
    =================================================== */

    const tpLine = chart.addSeries(LineSeries, {
      color: currentTheme.tp,
      lineWidth: 1,
      lineStyle: LineStyle.Solid,

      priceLineVisible: true,
      priceLineColor: currentTheme.tp,

      lastValueVisible: true,

      priceFormat,
    });

    tpLine.setData(
      createLineData([
        {
          time: chartStartTime,
          value: tp,
        },
        {
          time: alignedEntry,
          value: tp,
        },
        {
          time: alignedClose,
          value: tp,
        },
        {
          time: chartEndTime,
          value: tp,
        },
      ]),
    );

    lineSeries.push(tpLine);

    /* ===================================================
       R:R REFERENCE
    =================================================== */

    lineSeriesRefs.current.push(...lineSeries);

    return {
      chartStartTime,
      chartEndTime,
      alignedEntry,
      alignedClose,
      rr,
    };
  };

  /* =======================================================
     MAIN CHART EFFECT
  ======================================================= */

  useEffect(() => {
    if (!chartContainerRef.current || loading) {
      return;
    }

    /* ===================================================
       CLEAN OLD CHART
    =================================================== */

    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch {
        // ignore
      }

      chartRef.current = null;
    }

    seriesRef.current = null;

    markersRef.current = null;

    lineSeriesRefs.current = [];

    setRectangles([]);

    try {
      const container = chartContainerRef.current;

      const width = container.clientWidth || 900;

      /*
       * Mobile дээр 400px хэт өндөр харагдахаас
       * сэргийлнэ.
       */
      const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

      const height = isFullscreen
        ? Math.max(300, window.innerHeight - 110)
        : isMobile
          ? 330
          : 400;

      const currentTheme = getCurrentTheme();

      /* =================================================
         CREATE CHART
      ================================================= */

      const chart = createChart(container, {
        width,
        height,

        layout: {
          background: {
            color: "transparent",
          },

          textColor: currentTheme.text,
        },

        grid: {
          vertLines: {
            visible: false,
          },

          horzLines: {
            visible: false,
          },
        },

        rightPriceScale: {
          borderColor: currentTheme.border,

          scaleMargins: {
            top: 0.08,
            bottom: 0.08,
          },
        },

        timeScale: {
          timeVisible: true,

          secondsVisible: false,

          rightOffset: isMobile ? 2 : 3,

          barSpacing: isMobile ? 6 : 8,

          minBarSpacing: 3,

          borderColor: currentTheme.border,
        },

        crosshair: {
          mode: CrosshairMode.Normal,

          vertLine: {
            color: currentTheme.crosshair,

            labelBackgroundColor: currentTheme.tooltipBackground,
          },

          horzLine: {
            color: currentTheme.crosshair,

            labelBackgroundColor: currentTheme.tooltipBackground,
          },
        },

        handleScroll: {
          mouseWheel: true,

          pressedMouseMove: true,
        },

        handleScale: {
          axisPressedMouseMove: true,

          mouseWheel: true,

          pinch: true,
        },
      });

      chartRef.current = chart;

      /* =================================================
         TRADE SELECTION
      ================================================= */

      const selectedTradeFromList = getSelectedTrade();

      const latestTrade = selectedTradeFromList || getLatestTrade();

      if (!latestTrade) {
        setSelectedTrade(null);

        return;
      }

      if (!latestTrade.close_time) {
        console.error("Trade close_time is required.");

        setSelectedTrade(null);

        return;
      }

      const position = createTradePosition(latestTrade);

      setSelectedTrade(position);

      /* =================================================
         CANDLE SERIES
      ================================================= */

      const precision = getPricePrecision(position.symbol);

      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: currentTheme.bullish,

        downColor: currentTheme.bearish,

        borderVisible: false,

        wickUpColor: currentTheme.bullish,

        wickDownColor: currentTheme.bearish,

        priceFormat: {
          type: "price",

          precision,

          minMove: getMinMove(position.symbol),
        },
      });

      seriesRef.current = candlestickSeries;

      /* =================================================
         MARKERS
      ================================================= */

      markersRef.current = createSeriesMarkers(candlestickSeries);

      /* =================================================
         DEMO CANDLES
      ================================================= */

      const candleData = generateCandlestickData(position);

      candlestickSeries.setData(candleData);

      /* =================================================
         POSITION LINES
      ================================================= */

      const range = drawPositionLines(chart, position, currentTheme);

      /* =================================================
         VISIBLE RANGE
      ================================================= */

      if (range) {
        const startIndex = -CANDLES_BEFORE_ENTRY;

        const totalTradeCandles = Math.max(
          1,
          Math.floor(
            (range.alignedClose - range.alignedEntry) / timeframeConfig.seconds,
          ),
        );

        const endIndex = totalTradeCandles + CANDLES_AFTER_CLOSE;

        chart.timeScale().setVisibleLogicalRange({
          from: startIndex - 0.5,

          to: endIndex + 0.5,
        });
      }

      /* =================================================
         RESIZE
      ================================================= */

      const handleResize = () => {
        if (!chartContainerRef.current || !chartRef.current) {
          return;
        }

        const newWidth = chartContainerRef.current.clientWidth;

        if (newWidth > 0) {
          const mobile = window.innerWidth < 640;

          chartRef.current.applyOptions({
            width: newWidth,

            height: isFullscreen
              ? Math.max(300, window.innerHeight - 110)
              : mobile
                ? 330
                : 400,

            timeScale: {
              barSpacing: mobile ? 6 : 8,
            },
          });
        }
      };

      const resizeObserver = new ResizeObserver(handleResize);

      resizeObserver.observe(container);

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);

        resizeObserver.disconnect();

        if (markersRef.current) {
          try {
            markersRef.current.detach();
          } catch {
            // ignore
          }

          markersRef.current = null;
        }

        if (chartRef.current) {
          try {
            chartRef.current.remove();
          } catch {
            // ignore
          }

          chartRef.current = null;
        }

        seriesRef.current = null;

        lineSeriesRefs.current = [];

        setRectangles([]);
      };
    } catch (error) {
      console.error("Error creating chart:", error);
    }
  }, [trades, loading, timeframe, isDarkMode, isFullscreen, selectedTradeId]);

  /* =======================================================
     LABEL DATA
  ======================================================= */

  const labelData = useMemo(() => {
    if (!selectedTrade) {
      return null;
    }

    const risk = Math.abs(selectedTrade.entryPrice - selectedTrade.stopLoss);

    const reward = Math.abs(
      selectedTrade.takeProfit - selectedTrade.entryPrice,
    );

    const rr = risk > 0 ? reward / risk : 0;

    const slPips = calculatePips(selectedTrade.symbol, risk);

    const tpPips = calculatePips(selectedTrade.symbol, reward);

    const slAmount = calculateMoneyValue(
      selectedTrade.symbol,
      risk,
      selectedTrade.lotSize,
    );

    const tpAmount = calculateMoneyValue(
      selectedTrade.symbol,
      reward,
      selectedTrade.lotSize,
    );

    const interval = timeframeConfig.seconds;

    const entryTime = Math.floor(selectedTrade.openTime.getTime() / 1000);

    const closeTime = Math.floor(selectedTrade.closeTime.getTime() / 1000);

    const alignedEntry = Math.floor(entryTime / interval) * interval;

    const alignedClose = Math.floor(closeTime / interval) * interval;

    return {
      rr,

      slPips,

      tpPips,

      slAmount,

      tpAmount,

      entryTime: alignedEntry,

      closeTime: alignedClose,
    };
  }, [selectedTrade, timeframeConfig.seconds]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="p-3 sm:p-4">
        <div className="animate-pulse">
          <div className="h-[330px] sm:h-96 rounded bg-gray-700 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className={[
        "text-gray-900",
        "dark:text-gray-100",
        "transition-colors",
        "duration-200",

        isFullscreen
          ? [
              "fixed",
              "inset-0",
              "z-[9999]",
              "w-screen",
              "h-screen",
              "p-2",
              "sm:p-4",
              "bg-white",
              "dark:bg-[#0f1117]",
            ].join(" ")
          : ["p-2", "sm:p-4", "bg-white", "dark:bg-[#0f1117]"].join(" "),
      ].join(" ")}
    >
      {/* ===================================================
          FULL SCREEN CLOSE BUTTON
      =================================================== */}

      {isFullscreen && (
        <button
          type="button"
          onClick={() => setIsFullscreen(false)}
          className="
            fixed
            top-2
            right-2
            sm:top-4
            sm:right-4
            z-[10001]
            inline-flex
            items-center
            justify-center
            w-8
            h-8
            sm:w-9
            sm:h-9
            rounded-md
            border
            border-gray-200
            dark:border-[#2b2b43]
            bg-white/90
            dark:bg-[#161922]/90
            text-gray-600
            dark:text-gray-300
            hover:bg-gray-100
            dark:hover:bg-[#2b2b43]
            hover:text-gray-900
            dark:hover:text-white
            shadow-lg
            backdrop-blur-sm
            transition-colors
          "
          title="Exit full screen"
          aria-label="Exit full screen"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 3 9 9 3 9" />
            <polyline points="15 3 15 9 21 9" />
            <polyline points="9 21 9 15 3 15" />
            <polyline points="15 21 15 15 21 15" />
          </svg>
        </button>
      )}

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex flex-col gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
              📈 <span className="hidden sm:inline">Price Chart</span>
              <span className="sm:hidden">Chart</span>
            </span>

            {selectedTrade && (
              <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                {selectedTrade.symbol} • {selectedTrade.type}
              </span>
            )}

            {selectedAccountId && (
              <span className="hidden md:inline text-xs text-gray-500 dark:text-gray-400">
                Account: {selectedAccountId.slice(0, 8)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* TIMEFRAME */}

            <div
              className="
                flex
                items-center
                gap-0.5
                sm:gap-1
                bg-gray-100
                dark:bg-[#161922]
                border
                border-gray-200
                dark:border-[#2b2b43]
                rounded-md
                p-0.5
                sm:p-1
              "
            >
              {TIMEFRAMES.map((item) => {
                const active = timeframe === item.label;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setTimeframe(item.label)}
                    className={[
                      "px-2",
                      "sm:px-3",
                      "py-1",
                      "sm:py-1.5",
                      "text-[10px]",
                      "sm:text-xs",
                      "font-medium",
                      "rounded",
                      "transition-colors",

                      active
                        ? "bg-[#2962ff] text-white"
                        : [
                            "text-gray-500",
                            "dark:text-gray-400",
                            "hover:text-gray-900",
                            "dark:hover:text-white",
                            "hover:bg-gray-200",
                            "dark:hover:bg-[#2b2b43]",
                          ].join(" "),
                    ].join(" ")}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* FULLSCREEN */}

            {!isFullscreen && (
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className="
                  inline-flex
                  items-center
                  justify-center
                  w-8
                  h-8
                  sm:w-9
                  sm:h-9
                  rounded-md
                  border
                  border-gray-200
                  dark:border-[#2b2b43]
                  bg-gray-100
                  dark:bg-[#161922]
                  text-gray-600
                  dark:text-gray-300
                  hover:bg-gray-200
                  dark:hover:bg-[#2b2b43]
                  hover:text-gray-900
                  dark:hover:text-white
                  transition-colors
                "
                title="Full screen"
                aria-label="Full screen"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* =================================================
            TRADE INFO
        ================================================= */}

        {selectedTrade && (
          <div
            className="
              flex
              items-center
              gap-3
              sm:gap-5
              text-[10px]
              sm:text-xs
              border-t
              border-gray-200
              dark:border-[#2b2b43]
              pt-1.5
              sm:pt-2
              overflow-x-auto
              scrollbar-none
              whitespace-nowrap
            "
          >
            {/* ENTRY */}

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <span className="text-gray-500 dark:text-gray-400">Entry</span>

              <span className="text-green-600 dark:text-green-400 font-medium">
                {selectedTrade.entryPrice.toFixed(
                  getPricePrecision(selectedTrade.symbol),
                )}
              </span>
            </div>

            {/* SL */}

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <span className="text-gray-500 dark:text-gray-400">SL</span>

              <span className="text-red-600 dark:text-red-400 font-medium">
                {selectedTrade.stopLoss.toFixed(
                  getPricePrecision(selectedTrade.symbol),
                )}
              </span>
            </div>

            {/* TP */}

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <span className="text-gray-500 dark:text-gray-400">TP</span>

              <span className="text-green-600 dark:text-green-400 font-medium">
                {selectedTrade.takeProfit.toFixed(
                  getPricePrecision(selectedTrade.symbol),
                )}
              </span>
            </div>

            {/* RR */}

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <span className="text-gray-500 dark:text-gray-400">R:R</span>

              <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                {labelData?.rr.toFixed(2)}
              </span>
            </div>

            {/* LOT */}

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <span className="text-gray-500 dark:text-gray-400">Lot</span>

              <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                {selectedTrade.lotSize}
              </span>
            </div>

            {/* PROFIT */}

            <span
              className={
                selectedTrade.profit >= 0
                  ? "text-green-600 dark:text-green-400 font-medium shrink-0"
                  : "text-red-600 dark:text-red-400 font-medium shrink-0"
              }
            >
              {selectedTrade.profit >= 0 ? "+" : ""}$
              {selectedTrade.profit.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* ===================================================
          CHART
      =================================================== */}

      <div
        ref={chartContainerRef}
        className="
          relative
          overflow-hidden
          bg-white
          dark:bg-[#0f1117]
          transition-colors
          duration-200
          rounded-none
        "
        style={{
          width: "100%",

          height: isFullscreen ? "calc(100vh - 110px)" : undefined,

          minHeight: isFullscreen ? undefined : "330px",
        }}
      >
        {/* =================================================
            RISK / REWARD RECTANGLES
        ================================================= */}

        {rectangles.map((rectangle, index) => {
          if (rectangle.type === "risk") {
            return (
              <PositionRectangle
                key={`risk-${index}`}
                containerRef={chartContainerRef}
                seriesRef={seriesRef}
                chartRef={chartRef}
                rectangle={rectangle}
                color={theme.riskFill}
                fillOpacity={isDarkMode ? 0.16 : 0.1}
                borderColor={
                  isDarkMode ? "rgba(255,77,79,0.55)" : "rgba(220,38,38,0.45)"
                }
              />
            );
          }

          return (
            <PositionRectangle
              key={`reward-${index}`}
              containerRef={chartContainerRef}
              seriesRef={seriesRef}
              chartRef={chartRef}
              rectangle={rectangle}
              color={theme.rewardFill}
              fillOpacity={isDarkMode ? 0.16 : 0.1}
              borderColor={
                isDarkMode ? "rgba(38,166,154,0.55)" : "rgba(22,163,74,0.45)"
              }
            />
          );
        })}

        {/* =================================================
            ENTRY LABEL
        ================================================= */}

        {selectedTrade && labelData && (
          <PositionInfoLabel
            containerRef={chartContainerRef}
            seriesRef={seriesRef}
            chartRef={chartRef}
            time={labelData.closeTime}
            price={selectedTrade.entryPrice}
            text={`Lots ${selectedTrade.lotSize} • R:R ${labelData.rr.toFixed(
              2,
            )}`}
            background={theme.entryLabelBackground}
            borderColor={theme.entry}
            textColor="#ffffff"
          />
        )}

        {/* =================================================
            SL LABEL
        ================================================= */}

        {selectedTrade && labelData && (
          <PositionInfoLabel
            containerRef={chartContainerRef}
            seriesRef={seriesRef}
            chartRef={chartRef}
            time={labelData.closeTime}
            price={selectedTrade.stopLoss}
            text={`SL -$${labelData.slAmount.toFixed(
              2,
            )} • ${labelData.slPips.toFixed(1)} pips`}
            background={theme.slLabelBackground}
            borderColor={theme.sl}
            textColor="#ffffff"
          />
        )}

        {/* =================================================
            TP LABEL
        ================================================= */}

        {selectedTrade && labelData && (
          <PositionInfoLabel
            containerRef={chartContainerRef}
            seriesRef={seriesRef}
            chartRef={chartRef}
            time={labelData.closeTime}
            price={selectedTrade.takeProfit}
            text={`TP +$${labelData.tpAmount.toFixed(
              2,
            )} • ${labelData.tpPips.toFixed(1)} pips`}
            background={theme.tpLabelBackground}
            borderColor={theme.tp}
            textColor="#ffffff"
          />
        )}
      </div>
    </div>
  );
}
