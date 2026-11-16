"use client";

import { Trade } from "@/types/trade";
import {
  CandlestickData,
  CandlestickSeries,
  createChart,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  LineSeries,
  LineStyle,
  Time,
  UTCTimestamp,
} from "lightweight-charts";
import { DrawingPlugin } from "lwc-plugin-drawing-tools";
import { useEffect, useMemo, useRef, useState } from "react";

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
  before: number;
  after: number;
}

interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandlesApiResponse {
  success: boolean;
  symbol?: string;
  timeframe?: Timeframe;
  requestedStart?: number;
  requestedEnd?: number;
  safeEnd?: number;
  returnedStart?: number | null;
  returnedEnd?: number | null;
  count?: number;
  candles?: Candle[];
  error?: string;
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

  drawingColor: string;
}

/* =========================================================
   CONSTANTS
========================================================= */

/**
 * Timeframe бүрт тохирсон цонх.
 *
 * D1  -> Bias
 * H4  -> Market structure / Liquidity
 * H1  -> POI zone
 * M15 -> Entry refinement
 * M5  -> Entry trigger
 */
const TIMEFRAMES: TimeframeConfig[] = [
  { label: "M5", seconds: 5 * 60, before: 120, after: 50 },
  { label: "M15", seconds: 15 * 60, before: 100, after: 40 },
  { label: "H1", seconds: 60 * 60, before: 60, after: 20 },
  { label: "H4", seconds: 4 * 60 * 60, before: 40, after: 15 },
  { label: "D1", seconds: 24 * 60 * 60, before: 40, after: 10 },
];

const CANDLES_API_URL =
  process.env.NEXT_PUBLIC_CANDLES_URL ||
  "https://getcandles-nn3pu4motq-uc.a.run.app";
// const CANDLES_API_URL =
//   "http://127.0.0.1:5001/trading-journal-backend-9f423/us-central1/getCandles";

/* =========================================================
   THEMES
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

  drawingColor: "#60a5fa",
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

  drawingColor: "#2563eb",
};

/* =========================================================
   HELPERS
========================================================= */

function getTheme(isDark: boolean): ChartTheme {
  return isDark ? DARK_THEME : LIGHT_THEME;
}

function hexToRgba(hex: string, opacity: number): string {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);

  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function toTimestampSeconds(value: string | Date): number {
  const milliseconds =
    value instanceof Date ? value.getTime() : new Date(value).getTime();

  if (!Number.isFinite(milliseconds)) {
    throw new Error(`Invalid timestamp: ${String(value)}`);
  }

  return Math.floor(milliseconds / 1000);
}

function alignTimestamp(
  timestampSeconds: number,
  intervalSeconds: number,
): number {
  return Math.floor(timestampSeconds / intervalSeconds) * intervalSeconds;
}

function formatChartUtcTime(time: Time): string {
  let timestampSeconds: number;

  if (typeof time === "number") {
    timestampSeconds = time;
  } else if (typeof time === "string") {
    timestampSeconds = Math.floor(new Date(time).getTime() / 1000);
  } else {
    timestampSeconds = Date.UTC(time.year, time.month - 1, time.day) / 1000;
  }

  if (!Number.isFinite(timestampSeconds)) {
    return "";
  }

  const date = new Date(timestampSeconds * 1000);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
}

function getPricePrecision(symbol: string): number {
  const upper = symbol.toUpperCase();

  if (upper.includes("JPY")) {
    return 3;
  }

  if (upper.includes("XAU") || upper.includes("GOLD")) {
    return 3;
  }

  return 5;
}

function getMinMove(symbol: string): number {
  const precision = getPricePrecision(symbol);

  return 1 / Math.pow(10, precision);
}

function getPipSize(symbol: string): number {
  const upper = symbol.toUpperCase();

  if (upper.includes("JPY")) {
    return 0.01;
  }

  if (upper.includes("XAU") || upper.includes("GOLD")) {
    return 0.1;
  }

  return 0.0001;
}

function calculatePips(symbol: string, distance: number): number {
  const pipSize = getPipSize(symbol);

  if (pipSize <= 0) {
    return 0;
  }

  return Math.abs(distance) / pipSize;
}

function calculateMoneyValue(
  symbol: string,
  distance: number,
  lotSize: number,
): number {
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

function createLineData(
  points: { time: number; value: number }[],
): { time: UTCTimestamp; value: number }[] {
  const sorted = [...points].sort((a, b) => a.time - b.time);

  const unique: { time: UTCTimestamp; value: number }[] = [];

  for (const point of sorted) {
    const time = point.time as UTCTimestamp;
    const last = unique[unique.length - 1];

    if (last && Number(last.time) === Number(time)) {
      last.value = point.value;
      continue;
    }

    unique.push({ time, value: point.value });
  }

  return unique;
}

/**
 * Backend-с ирсэн candles-ийг Lightweight Charts-д тохируулах.
 *
 * duplicate, invalid, эрэмбэлэх — бүгдийг энд хийнэ.
 */
function mapCandles(candles: Candle[]): CandlestickData[] {
  const byTime = new Map<number, CandlestickData>();

  for (const candle of candles) {
    const time = Math.floor(Number(candle.timestamp) / 1000);

    if (!Number.isFinite(time)) continue;

    if (
      !Number.isFinite(candle.open) ||
      !Number.isFinite(candle.high) ||
      !Number.isFinite(candle.low) ||
      !Number.isFinite(candle.close)
    ) {
      continue;
    }

    byTime.set(time, {
      time: time as UTCTimestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    });
  }

  return Array.from(byTime.values()).sort(
    (a, b) => Number(a.time) - Number(b.time),
  );
}

/* =========================================================
   OVERLAY SYNC
========================================================= */

function createOverlaySync(
  container: HTMLDivElement,
  update: () => void,
  chartRef: React.RefObject<IChartApi | null>,
) {
  let frame = 0;

  const schedule = () => {
    if (frame !== 0) cancelAnimationFrame(frame);

    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        update();
        frame = 0;
      });
    });
  };

  const timeScale = chartRef.current?.timeScale();

  timeScale?.subscribeVisibleLogicalRangeChange(schedule);
  timeScale?.subscribeVisibleTimeRangeChange(schedule);

  const resizeObserver = new ResizeObserver(schedule);
  resizeObserver.observe(container);

  container.addEventListener("pointermove", schedule, true);
  container.addEventListener("pointerdown", schedule, true);
  container.addEventListener("wheel", schedule, true);
  container.addEventListener("touchmove", schedule, true);
  container.addEventListener("touchstart", schedule, true);

  window.addEventListener("resize", schedule);

  schedule();

  return () => {
    timeScale?.unsubscribeVisibleLogicalRangeChange(schedule);
    timeScale?.unsubscribeVisibleTimeRangeChange(schedule);

    resizeObserver.disconnect();

    container.removeEventListener("pointermove", schedule, true);
    container.removeEventListener("pointerdown", schedule, true);
    container.removeEventListener("wheel", schedule, true);
    container.removeEventListener("touchmove", schedule, true);
    container.removeEventListener("touchstart", schedule, true);

    window.removeEventListener("resize", schedule);

    if (frame !== 0) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };
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

    if (!container) return;

    const element = document.createElement("div");

    element.style.position = "absolute";
    element.style.pointerEvents = "none";
    element.style.zIndex = "5";
    element.style.boxSizing = "border-box";
    element.style.background = hexToRgba(color, fillOpacity);
    element.style.border = `1px solid ${borderColor}`;
    element.style.borderRadius = "1px";
    element.style.willChange = "left, top, width, height";

    container.appendChild(element);
    rectangleRef.current = element;

    const updateRectangle = () => {
      const chart = chartRef.current;
      const series = seriesRef.current;
      const target = rectangleRef.current;

      if (!chart || !series || !target) return;

      const timeScale = chart.timeScale();

      const startX = timeScale.timeToCoordinate(
        rectangle.startTime as UTCTimestamp,
      );
      const endX = timeScale.timeToCoordinate(
        rectangle.endTime as UTCTimestamp,
      );
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
    const handleRangeChange = () => updateRectangle();

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

    if (!container) return;

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

      if (!chart || !series || !element || !currentContainer) return;

      const x = chart.timeScale().timeToCoordinate(time as UTCTimestamp);
      const y = series.priceToCoordinate(price);

      if (x === null || y === null) {
        element.style.display = "none";
        return;
      }

      const containerWidth = currentContainer.clientWidth;
      const labelWidth = element.offsetWidth;

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

    const cleanupSync = createOverlaySync(container, update, chartRef);

    return () => {
      cleanupSync();

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
   EXIT MARK
========================================================= */

function PositionExitMark({
  containerRef,
  seriesRef,
  chartRef,
  time,
  price,
  color,
  textColor,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  seriesRef: React.RefObject<ISeriesApi<"Candlestick"> | null>;
  chartRef: React.RefObject<IChartApi | null>;
  time: number;
  price: number;
  color: string;
  textColor: string;
}) {
  const markRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || !Number.isFinite(time) || !Number.isFinite(price)) {
      return;
    }

    const mark = document.createElement("div");

    mark.style.position = "absolute";
    mark.style.pointerEvents = "none";
    mark.style.zIndex = "35";
    mark.style.display = "none";
    mark.style.alignItems = "center";
    mark.style.gap = "5px";
    mark.style.transform = "translate(-50%, -50%)";
    mark.style.whiteSpace = "nowrap";

    const label = document.createElement("div");

    label.style.padding = "3px 6px";
    label.style.borderRadius = "4px";
    label.style.background = color;
    label.style.color = textColor;
    label.style.fontSize = "10px";
    label.style.fontWeight = "600";
    label.style.lineHeight = "13px";
    label.style.boxShadow = "0 1px 4px rgba(0,0,0,0.25)";
    label.textContent = "x";

    mark.appendChild(label);

    container.appendChild(mark);
    markRef.current = mark;

    const update = () => {
      const chart = chartRef.current;
      const series = seriesRef.current;
      const element = markRef.current;

      if (!chart || !series || !element) return;

      const timestamp = Math.floor(time);

      const x = chart.timeScale().timeToCoordinate(timestamp as UTCTimestamp);
      const y = series.priceToCoordinate(price);

      if (x === null || y === null) {
        element.style.display = "none";
        return;
      }

      element.style.display = "flex";
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
    };

    const cleanupSync = createOverlaySync(container, update, chartRef);

    update();

    return () => {
      cleanupSync();

      if (mark.parentNode) {
        mark.parentNode.removeChild(mark);
      }

      markRef.current = null;
    };
  }, [containerRef, seriesRef, chartRef, time, price, color, textColor]);

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
  const lineSeriesRefs = useRef<ISeriesApi<"Line">[]>([]);
  const drawingPluginRef = useRef<DrawingPlugin | null>(null);
  const requestIdRef = useRef(0);

  const [selectedTrade, setSelectedTrade] = useState<TradePosition | null>(
    null,
  );
  const [rectangles, setRectangles] = useState<RectangleData[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>("M5");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [historicalError, setHistoricalError] = useState<string | null>(null);
  const [candleCount, setCandleCount] = useState(0);

  const trades = externalTrades || [];
  const loading = externalLoading !== undefined ? externalLoading : false;

  /* =======================================================
     THEME OBSERVER
  ======================================================= */

  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;

    const updateTheme = () => {
      setIsDarkMode(root.classList.contains("dark"));
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const theme = useMemo(() => getTheme(isDarkMode), [isDarkMode]);

  const timeframeConfig = useMemo(
    () => TIMEFRAMES.find((item) => item.label === timeframe) || TIMEFRAMES[0],
    [timeframe],
  );

  /* =======================================================
     TRADE SIGNATURE
  ======================================================= */

  const tradeSignature = useMemo(() => {
    return JSON.stringify(
      trades.map((trade) => ({
        id: trade.id,
        symbol: trade.symbol,
        type: trade.type,
        entry_price: trade.entry_price,
        exit_price: trade.exit_price,
        stop_loss: trade.stop_loss,
        take_profit: trade.take_profit,
        lot_size: trade.lot_size,
        profit: trade.profit,
        open_time: trade.open_time,
        close_time: trade.close_time,
      })),
    );
  }, [trades]);

  /* =======================================================
     TRADE HELPERS
  ======================================================= */

  const getLatestTrade = (): Trade | null => {
    if (trades.length === 0) return null;

    const sorted = [...trades].sort((a, b) => {
      const aTime = a.close_time || a.open_time;
      const bTime = b.close_time || b.open_time;

      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return sorted[0];
  };

  const getSelectedTrade = (): Trade | null => {
    if (!selectedTradeId) return null;

    return trades.find((trade) => trade.id === selectedTradeId) || null;
  };

  const createTradePosition = (trade: Trade): TradePosition => {
    const entryPrice = Number(trade.entry_price) || 0;
    const stopLoss = Number(trade.stop_loss) || entryPrice * 0.99;
    const takeProfit = Number(trade.take_profit) || entryPrice * 1.01;

    if (!trade.open_time || !trade.close_time) {
      throw new Error(`Trade ${trade.id} is missing open_time or close_time`);
    }

    const openTime = new Date(trade.open_time);
    const closeTime = new Date(trade.close_time);

    if (
      !Number.isFinite(openTime.getTime()) ||
      !Number.isFinite(closeTime.getTime())
    ) {
      throw new Error(
        `Trade ${trade.id} contains invalid open_time or close_time`,
      );
    }

    return {
      id: trade.id,
      symbol: trade.symbol,
      entryPrice,
      exitPrice: Number(trade.exit_price) || 0,
      stopLoss,
      takeProfit,
      lotSize: Number(trade.lot_size) || 1,
      profit: Number(trade.profit) || 0,
      openTime,
      closeTime,
      type: trade.type === "buy" ? "long" : "short",
    };
  };

  /* =======================================================
     FETCH CANDLES
  ======================================================= */

  const fetchCandles = async (
    position: TradePosition,
    signal: AbortSignal,
    requestId: number,
  ): Promise<CandlestickData[]> => {
    const interval = timeframeConfig.seconds;

    const entryTime = toTimestampSeconds(position.openTime);
    const closeTime = toTimestampSeconds(position.closeTime);

    const alignedEntry = alignTimestamp(entryTime, interval);
    const alignedClose = alignTimestamp(closeTime, interval);

    const startTime = alignedEntry - timeframeConfig.before * interval;
    const endTime = alignedClose + timeframeConfig.after * interval;

    const params = new URLSearchParams({
      symbol: position.symbol.toUpperCase(),
      timeframe,
      startTime: String(startTime * 1000),
      endTime: String(endTime * 1000),
    });

    const url = `${CANDLES_API_URL}?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (signal.aborted || requestId !== requestIdRef.current) {
      throw new DOMException("Stale request", "AbortError");
    }

    if (!response.ok) {
      let message = `Candles request failed (${response.status})`;

      try {
        const body = (await response.json()) as CandlesApiResponse;
        if (body.error) message = body.error;
      } catch {
        // ignore
      }

      throw new Error(message);
    }

    const json = (await response.json()) as CandlesApiResponse;

    if (signal.aborted || requestId !== requestIdRef.current) {
      throw new DOMException("Stale request", "AbortError");
    }

    if (!json.success) {
      throw new Error(json.error || "Candles request failed");
    }

    if (!Array.isArray(json.candles)) {
      throw new Error("API returned invalid candle data");
    }

    const mapped = mapCandles(json.candles);

    console.log(
      `%c[CANDLES] ${timeframe} | ${position.symbol}`,
      "font-weight:700;color:#2962ff;",
      {
        requestedStart: new Date(startTime * 1000).toISOString(),
        requestedEnd: new Date(endTime * 1000).toISOString(),
        safeEnd: json.safeEnd
          ? new Date(json.safeEnd * 1000).toISOString()
          : null,
        returned:
          json.returnedStart && json.returnedEnd
            ? {
                start: new Date(json.returnedStart * 1000).toISOString(),
                end: new Date(json.returnedEnd * 1000).toISOString(),
              }
            : null,
        count: mapped.length,
      },
    );

    return mapped;
  };

  /* =======================================================
     POSITION LINES
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

    const entryTime = toTimestampSeconds(trade.openTime);
    const closeTime = toTimestampSeconds(trade.closeTime);

    const alignedEntry = alignTimestamp(entryTime, interval);
    const alignedClose = alignTimestamp(closeTime, interval);

    const chartStartTime = alignedEntry - timeframeConfig.before * interval;
    const chartEndTime = alignedClose + timeframeConfig.after * interval;

    setRectangles([
      {
        type: "risk",
        startTime: entryTime,
        endTime: closeTime,
        topPrice: Math.max(entryPrice, sl),
        bottomPrice: Math.min(entryPrice, sl),
      },
      {
        type: "reward",
        startTime: entryTime,
        endTime: closeTime,
        topPrice: Math.max(entryPrice, tp),
        bottomPrice: Math.min(entryPrice, tp),
      },
    ]);

    const priceFormat = {
      type: "price" as const,
      precision: getPricePrecision(trade.symbol),
      minMove: getMinMove(trade.symbol),
    };

    const lineSeries: ISeriesApi<"Line">[] = [];

    const entryLine = chart.addSeries(LineSeries, {
      color: currentTheme.entry,
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: true,
      priceLineColor: currentTheme.entry,
      lastValueVisible: true,
      priceFormat,
    });

    entryLine.setData(
      createLineData([
        { time: chartStartTime, value: entryPrice },
        { time: entryTime, value: entryPrice },
        { time: closeTime, value: entryPrice },
        { time: chartEndTime, value: entryPrice },
      ]),
    );

    lineSeries.push(entryLine);

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
        { time: chartStartTime, value: sl },
        { time: entryTime, value: sl },
        { time: closeTime, value: sl },
        { time: chartEndTime, value: sl },
      ]),
    );

    lineSeries.push(slLine);

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
        { time: chartStartTime, value: tp },
        { time: entryTime, value: tp },
        { time: closeTime, value: tp },
        { time: chartEndTime, value: tp },
      ]),
    );

    lineSeries.push(tpLine);

    lineSeriesRefs.current.push(...lineSeries);

    return {
      chartStartTime,
      chartEndTime,
      entryTime,
      closeTime,
      alignedEntry,
      alignedClose,
      rr,
    };
  };

  /* =======================================================
     MAIN CHART EFFECT
  ======================================================= */

  useEffect(() => {
    if (!chartContainerRef.current || loading) return;

    const currentRequestId = ++requestIdRef.current;
    const abortController = new AbortController();
    const container = chartContainerRef.current;

    /* CLEAN OLD */
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
    drawingPluginRef.current = null;

    setRectangles([]);
    setHistoricalError(null);
    setCandleCount(0);

    /* CREATE CHART */
    try {
      const width = container.clientWidth || 900;
      const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

      const height = isFullscreen
        ? Math.max(300, window.innerHeight - 110)
        : isMobile
          ? 360
          : 450;

      const chart = createChart(container, {
        width,
        height,
        layout: {
          background: { color: theme.background },
          textColor: theme.text,
        },
        grid: {
          vertLines: { visible: false },
          horzLines: { visible: false },
        },
        rightPriceScale: {
          borderColor: theme.border,
          autoScale: true,
          scaleMargins: { top: 0.08, bottom: 0.08 },
          alignLabels: true,
          entireTextOnly: false,
        },
        timeScale: {
          tickMarkFormatter: formatChartUtcTime,
          timeVisible: true,
          secondsVisible: false,
          rightOffset: isMobile ? 2 : 3,
          barSpacing: isMobile ? 6 : 8,
          minBarSpacing: 0.1,
          maxBarSpacing: 50,
          borderColor: theme.border,
        },
        localization: {
          timeFormatter: formatChartUtcTime,
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: {
            color: theme.crosshair,
            labelBackgroundColor: theme.tooltipBackground,
          },
          horzLine: {
            color: theme.crosshair,
            labelBackgroundColor: theme.tooltipBackground,
          },
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true,
        },
        handleScale: {
          axisPressedMouseMove: { time: true, price: true },
          mouseWheel: true,
          pinch: true,
        },
      });

      chartRef.current = chart;

      /* SELECT TRADE */
      const selectedTradeFromList = getSelectedTrade();
      const latestTrade = selectedTradeFromList || getLatestTrade();

      if (!latestTrade || !latestTrade.close_time) {
        setSelectedTrade(null);
        return;
      }

      const position = createTradePosition(latestTrade);

      setSelectedTrade(position);

      /* CANDLE SERIES */
      const precision = getPricePrecision(position.symbol);

      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: theme.bullish,
        downColor: theme.bearish,
        borderVisible: false,
        wickUpColor: theme.bullish,
        wickDownColor: theme.bearish,
        priceScaleId: "right",
        priceFormat: {
          type: "price",
          precision,
          minMove: getMinMove(position.symbol),
        },
      });

      seriesRef.current = candlestickSeries;

      /* DRAWING PLUGIN */
      const drawingTools = new DrawingPlugin({
        color: theme.drawingColor,
        lineWidth: 2,
        showEndpoints: true,
        toolBoxOffset: { x: 10, y: 10 },
      });

      candlestickSeries.attachPrimitive(drawingTools);
      drawingPluginRef.current = drawingTools;

      /* LOAD DATA */
      const loadData = async () => {
        setHistoricalLoading(true);
        setHistoricalError(null);

        try {
          const candleData = await fetchCandles(
            position,
            abortController.signal,
            currentRequestId,
          );

          if (
            abortController.signal.aborted ||
            currentRequestId !== requestIdRef.current
          ) {
            return;
          }

          if (candleData.length === 0) {
            setHistoricalError(
              "No candles returned. Trade may be too recent or symbol unavailable.",
            );
            return;
          }

          candlestickSeries.setData(candleData);

          setCandleCount(candleData.length);

          chart.priceScale("right").applyOptions({
            autoScale: true,
            scaleMargins: { top: 0.08, bottom: 0.08 },
          });

          const range = drawPositionLines(chart, position, theme);

          if (range) {
            chart.timeScale().setVisibleRange({
              from: range.chartStartTime as UTCTimestamp,
              to: range.chartEndTime as UTCTimestamp,
            });
          }

          chart.priceScale("right").applyOptions({ autoScale: true });
        } catch (error) {
          if (abortController.signal.aborted) return;
          if (currentRequestId !== requestIdRef.current) return;

          console.error("Candles error:", error);

          setHistoricalError(
            error instanceof Error ? error.message : "Failed to load candles.",
          );
        } finally {
          if (
            !abortController.signal.aborted &&
            currentRequestId === requestIdRef.current
          ) {
            setHistoricalLoading(false);
          }
        }
      };

      void loadData();

      /* RESIZE */
      const handleResize = () => {
        if (!chartContainerRef.current || !chartRef.current) return;

        const newWidth = chartContainerRef.current.clientWidth;
        if (newWidth <= 0) return;

        const mobile = window.innerWidth < 640;

        chartRef.current.applyOptions({
          width: newWidth,
          height: isFullscreen
            ? Math.max(300, window.innerHeight - 110)
            : mobile
              ? 360
              : 450,
          timeScale: {
            barSpacing: mobile ? 6 : 8,
          },
          rightPriceScale: {
            autoScale: true,
          },
        });
      };

      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);
      window.addEventListener("resize", handleResize);

      /* CLEANUP */
      return () => {
        abortController.abort();

        window.removeEventListener("resize", handleResize);
        resizeObserver.disconnect();

        drawingPluginRef.current = null;
        lineSeriesRefs.current = [];
        seriesRef.current = null;

        setRectangles([]);
        setHistoricalLoading(false);

        if (chartRef.current) {
          try {
            chartRef.current.remove();
          } catch {
            // ignore
          }
          chartRef.current = null;
        }
      };
    } catch (error) {
      console.error("Chart creation failed:", error);

      if (currentRequestId === requestIdRef.current) {
        setHistoricalError(
          error instanceof Error ? error.message : "Failed to create chart.",
        );
      }
    }
  }, [
    tradeSignature,
    loading,
    timeframe,
    isDarkMode,
    isFullscreen,
    selectedTradeId,
    theme,
  ]);

  /* =======================================================
     LABEL DATA
  ======================================================= */

  const labelData = useMemo(() => {
    if (!selectedTrade) return null;

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

    const entryTime = toTimestampSeconds(selectedTrade.openTime);
    const closeTime = toTimestampSeconds(selectedTrade.closeTime);

    return { rr, slPips, tpPips, slAmount, tpAmount, entryTime, closeTime };
  }, [selectedTrade]);

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
      {/* FULLSCREEN CLOSE */}
      {isFullscreen && (
        <button
          type="button"
          onClick={() => setIsFullscreen(false)}
          className="
            fixed top-2 right-2 sm:top-4 sm:right-4 z-[10001]
            inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9
            rounded-md border border-gray-200 dark:border-[#2b2b43]
            bg-white/90 dark:bg-[#161922]/90
            text-gray-600 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-[#2b2b43]
            hover:text-gray-900 dark:hover:text-white
            shadow-lg backdrop-blur-sm transition-colors
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

      {/* HEADER */}
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

            {candleCount > 0 && (
              <span className="hidden md:inline text-[11px] sm:text-xs text-gray-400 dark:text-gray-500">
                {candleCount} candles
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
                flex items-center gap-0.5 sm:gap-1
                bg-gray-100 dark:bg-[#161922]
                border border-gray-200 dark:border-[#2b2b43]
                rounded-md p-0.5 sm:p-1
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
                      "px-2 sm:px-3 py-1 sm:py-1.5",
                      "text-[10px] sm:text-xs font-medium rounded",
                      "transition-colors",
                      active
                        ? "bg-[#2962ff] text-white"
                        : [
                            "text-gray-500 dark:text-gray-400",
                            "hover:text-gray-900 dark:hover:text-white",
                            "hover:bg-gray-200 dark:hover:bg-[#2b2b43]",
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
                  inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9
                  rounded-md border border-gray-200 dark:border-[#2b2b43]
                  bg-gray-100 dark:bg-[#161922]
                  text-gray-600 dark:text-gray-300
                  hover:bg-gray-200 dark:hover:bg-[#2b2b43]
                  hover:text-gray-900 dark:hover:text-white
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

        {/* TRADE INFO */}
        {selectedTrade && (
          <div
            className="
              flex items-center gap-3 sm:gap-5
              text-[10px] sm:text-xs
              border-t border-gray-200 dark:border-[#2b2b43]
              pt-1.5 sm:pt-2
              overflow-x-auto scrollbar-none whitespace-nowrap
            "
          >
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <span className="text-gray-500 dark:text-gray-400">Entry</span>
              <span className="text-green-600 dark:text-green-400 font-medium">
                {selectedTrade.entryPrice.toFixed(
                  getPricePrecision(selectedTrade.symbol),
                )}
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <span className="text-gray-500 dark:text-gray-400">SL</span>
              <span className="text-red-600 dark:text-red-400 font-medium">
                {selectedTrade.stopLoss.toFixed(
                  getPricePrecision(selectedTrade.symbol),
                )}
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <span className="text-gray-500 dark:text-gray-400">TP</span>
              <span className="text-green-600 dark:text-green-400 font-medium">
                {selectedTrade.takeProfit.toFixed(
                  getPricePrecision(selectedTrade.symbol),
                )}
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <span className="text-gray-500 dark:text-gray-400">R:R</span>
              <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                {labelData?.rr.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <span className="text-gray-500 dark:text-gray-400">Lot</span>
              <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                {selectedTrade.lotSize}
              </span>
            </div>

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

      {/* CHART */}
      <div
        ref={chartContainerRef}
        className="
          relative overflow-hidden
          bg-white dark:bg-[#0f1117]
          transition-colors duration-200 rounded-none
        "
        style={{
          width: "100%",
          height: isFullscreen ? "calc(100vh - 110px)" : undefined,
          minHeight: isFullscreen ? undefined : "380px",
        }}
      >
        {historicalLoading && (
          <div
            className="
              absolute top-2 left-1/2 -translate-x-1/2 z-[100]
              px-3 py-1.5 rounded-md text-[11px] font-medium
              bg-white/90 dark:bg-[#161922]/90
              text-gray-600 dark:text-gray-300
              border border-gray-200 dark:border-[#2b2b43]
              shadow-sm backdrop-blur-sm
            "
          >
            Loading candles...
          </div>
        )}

        {historicalError && (
          <div className="absolute inset-x-2 top-2 z-[100] flex items-center justify-center pointer-events-none">
            <div
              className="
                max-w-[90%] px-3 py-2 rounded-md text-[11px]
                bg-red-50 dark:bg-red-950/80
                text-red-600 dark:text-red-300
                border border-red-200 dark:border-red-900
                shadow-sm
              "
            >
              {historicalError}
            </div>
          </div>
        )}

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

        {selectedTrade && labelData && (
          <PositionInfoLabel
            containerRef={chartContainerRef}
            seriesRef={seriesRef}
            chartRef={chartRef}
            time={labelData.closeTime}
            price={selectedTrade.entryPrice}
            text={`Lots ${selectedTrade.lotSize} • R:R ${labelData.rr.toFixed(2)}`}
            background={theme.entryLabelBackground}
            borderColor={theme.entry}
            textColor="#ffffff"
          />
        )}

        {selectedTrade && labelData && (
          <PositionInfoLabel
            containerRef={chartContainerRef}
            seriesRef={seriesRef}
            chartRef={chartRef}
            time={labelData.closeTime}
            price={selectedTrade.stopLoss}
            text={`SL -$${labelData.slAmount.toFixed(2)} • ${labelData.slPips.toFixed(1)} pips`}
            background={theme.slLabelBackground}
            borderColor={theme.sl}
            textColor="#ffffff"
          />
        )}

        {selectedTrade && labelData && (
          <PositionInfoLabel
            containerRef={chartContainerRef}
            seriesRef={seriesRef}
            chartRef={chartRef}
            time={labelData.closeTime}
            price={selectedTrade.takeProfit}
            text={`TP +$${labelData.tpAmount.toFixed(2)} • ${labelData.tpPips.toFixed(1)} pips`}
            background={theme.tpLabelBackground}
            borderColor={theme.tp}
            textColor="#ffffff"
          />
        )}

        {selectedTrade && labelData && selectedTrade.exitPrice != null && (
          <PositionExitMark
            containerRef={chartContainerRef}
            seriesRef={seriesRef}
            chartRef={chartRef}
            time={labelData.closeTime}
            price={selectedTrade.exitPrice}
            color={
              selectedTrade.profit >= 0
                ? theme.tpLabelBackground
                : theme.slLabelBackground
            }
            textColor="#ffffff"
          />
        )}
      </div>
    </div>
  );
}
