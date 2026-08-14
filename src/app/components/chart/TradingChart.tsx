"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  UTCTimestamp,
  Time,
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
  dukascopyTimeframe: string;
  seconds: number;
}

interface HistoricalCandleResponse {
  symbol: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface HistoricalApiResponse {
  success: boolean;
  symbol?: string;
  timeframe?: Timeframe;
  dukascopyTimeframe?: string;
  startTime?: number;
  endTime?: number;
  returned?: number;
  candles?: HistoricalCandleResponse[];
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
}

interface CandleContinuityGap {
  previous: number;
  current: number;
  expectedSeconds: number;
  actualSeconds: number;
}

interface CandleContinuityResult {
  complete: boolean;
  gaps: CandleContinuityGap[];
  duplicates: number[];
}

interface HistoricalCoverageResult {
  complete: boolean;

  requestedStart: number;
  requestedEnd: number;

  returnedStart: number | null;
  returnedEnd: number | null;

  expectedFirstCandle: number | null;
  expectedLastCandle: number | null;

  missingBeforeSeconds: number;
  missingAfterSeconds: number;

  startWeekendAdjusted: boolean;
  endWeekendAdjusted: boolean;
}

interface HistoricalDebugInfo {
  requestId: number;

  symbol: string;

  timeframe: Timeframe;

  nativeTimeframe: string;

  requestedStart: number;

  requestedEnd: number;

  returnedStart: number | null;

  returnedEnd: number | null;

  requestedDurationSeconds: number;

  returnedDurationSeconds: number;

  candleCount: number;

  expectedIntervalSeconds: number;

  continuity: CandleContinuityResult;

  coverage: HistoricalCoverageResult;

  attempt?: number;
}

/* =========================================================
   CONSTANTS
========================================================= */

const TIMEFRAMES: TimeframeConfig[] = [
  {
    label: "M5",
    dukascopyTimeframe: "m5",
    seconds: 5 * 60,
  },
  {
    label: "M15",
    dukascopyTimeframe: "m15",
    seconds: 15 * 60,
  },
  {
    label: "H1",
    dukascopyTimeframe: "h1",
    seconds: 60 * 60,
  },
  {
    label: "H4",
    dukascopyTimeframe: "h4",
    seconds: 4 * 60 * 60,
  },
  {
    label: "D1",
    dukascopyTimeframe: "d1",
    seconds: 24 * 60 * 60,
  },
];

const CANDLES_BEFORE_ENTRY = 100;
const CANDLES_AFTER_CLOSE = 100;

/*
 * If the first request does not contain the expected
 * historical boundary, expand the request progressively.
 *
 * This is intentionally client-side only.
 *
 * Attempt 0:
 *   normal range
 *
 * Attempt 1:
 *   +64 candles on the missing side
 *
 * Attempt 2:
 *   +128 candles
 *
 * Attempt 3:
 *   +256 candles
 */
const RANGE_RETRY_EXTRA_CANDLES = [0, 64, 128, 256];

const HISTORICAL_CANDLES_URL =
  process.env.NEXT_PUBLIC_HISTORICAL_CANDLES_URL ||
  "https://gethistoricalcandles-nn3pu4motq-uc.a.run.app";

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
   THEME HELPERS
========================================================= */

function getCurrentTheme(): ChartTheme {
  if (typeof document === "undefined") {
    return DARK_THEME;
  }

  return document.documentElement.classList.contains("dark")
    ? DARK_THEME
    : LIGHT_THEME;
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
   UTC TIME HELPERS
========================================================= */

function toTimestampSeconds(value: string | Date): number {
  const milliseconds =
    value instanceof Date ? value.getTime() : new Date(value).getTime();

  if (!Number.isFinite(milliseconds)) {
    throw new Error(`Invalid timestamp: ${String(value)}`);
  }

  return Math.floor(milliseconds / 1000);
}

function alignTimestamp(timestampSeconds: number, intervalSeconds: number) {
  return Math.floor(timestampSeconds / intervalSeconds) * intervalSeconds;
}

function formatUtcTimestamp(timestampSeconds: number | null) {
  if (timestampSeconds === null) {
    return null;
  }

  return new Date(timestampSeconds * 1000).toISOString();
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

/* =========================================================
   FOREX MARKET WEEKEND
========================================================= */

/**
 * Dukascopy / Forex weekend boundary.
 *
 * This is intentionally UTC-only.
 *
 * Friday 22:00 UTC -> Sunday 22:00 UTC
 *
 * IMPORTANT:
 * Continuity does NOT simply compare Friday -> Monday.
 * Instead, it checks every expected candle timestamp inside
 * the gap. Therefore a real missing candle cannot be hidden
 * by the weekend rule.
 */

function isForexWeekendClosed(timestampSeconds: number): boolean {
  const date = new Date(timestampSeconds * 1000);

  const day = date.getUTCDay();

  const hour = date.getUTCHours();

  const minute = date.getUTCMinutes();

  const second = date.getUTCSeconds();

  const totalSeconds = hour * 3600 + minute * 60 + second;

  const fridayClose = 22 * 3600;

  const sundayOpen = 22 * 3600;

  if (day === 6) {
    return true;
  }

  if (day === 0) {
    return totalSeconds < sundayOpen;
  }

  if (day === 5) {
    return totalSeconds >= fridayClose;
  }

  return false;
}

/**
 * Returns the next valid Forex candle timestamp.
 */
function getNextForexOpenTimestamp(
  timestampSeconds: number,
  intervalSeconds: number,
): number {
  let current = alignTimestamp(timestampSeconds, intervalSeconds);

  for (let i = 0; i < 1000; i++) {
    if (!isForexWeekendClosed(current)) {
      return current;
    }

    current += intervalSeconds;
  }

  return current;
}

/**
 * Returns the last valid Forex candle timestamp before
 * requestedEnd.
 *
 * requestedEnd is exclusive.
 */
function getLastForexCandleTimestamp(
  requestedEnd: number,
  intervalSeconds: number,
): number {
  let current = alignTimestamp(requestedEnd - intervalSeconds, intervalSeconds);

  for (let i = 0; i < 1000; i++) {
    if (!isForexWeekendClosed(current)) {
      return current;
    }

    current -= intervalSeconds;
  }

  return current;
}

/* =========================================================
   WEEKEND GAP DETECTION
========================================================= */

/**
 * IMPORTANT:
 *
 * We do NOT simply say:
 *
 *   Friday -> Monday = weekend
 *
 * because that could hide a real missing Friday candle.
 *
 * Instead we walk through every expected candle timestamp.
 *
 * A gap is considered a legitimate weekend gap ONLY when
 * every expected timestamp between previous and current is
 * inside the Forex closed period.
 */
function isPureForexWeekendGap(
  previousTimestamp: number,
  currentTimestamp: number,
  intervalSeconds: number,
): boolean {
  if (currentTimestamp <= previousTimestamp) {
    return false;
  }

  const actualDifference = currentTimestamp - previousTimestamp;

  if (actualDifference <= intervalSeconds) {
    return false;
  }

  let expectedTimestamp = previousTimestamp + intervalSeconds;

  let checked = 0;

  while (expectedTimestamp < currentTimestamp) {
    if (!isForexWeekendClosed(expectedTimestamp)) {
      return false;
    }

    expectedTimestamp += intervalSeconds;

    checked++;

    /*
     * Safety guard.
     *
     * A normal weekend is tiny compared with this limit.
     * If something enormous happens, do not classify it as
     * a weekend gap automatically.
     */
    if (checked > 10000) {
      return false;
    }
  }

  return true;
}

/* =========================================================
   COVERAGE VALIDATION
========================================================= */

function validateHistoricalCoverage(
  requestedStart: number,
  requestedEnd: number,
  returnedStart: number | null,
  returnedEnd: number | null,
  intervalSeconds: number,
): HistoricalCoverageResult {
  if (returnedStart === null || returnedEnd === null) {
    return {
      complete: false,

      requestedStart,
      requestedEnd,

      returnedStart,
      returnedEnd,

      expectedFirstCandle: null,
      expectedLastCandle: null,

      missingBeforeSeconds: 0,
      missingAfterSeconds: 0,

      startWeekendAdjusted: false,
      endWeekendAdjusted: false,
    };
  }

  const expectedFirstCandle = getNextForexOpenTimestamp(
    requestedStart,
    intervalSeconds,
  );

  const expectedLastCandle = getLastForexCandleTimestamp(
    requestedEnd,
    intervalSeconds,
  );

  const startWeekendAdjusted = expectedFirstCandle > requestedStart;

  const endWeekendAdjusted =
    expectedLastCandle < requestedEnd - intervalSeconds;

  /*
   * No tolerance is used here.
   *
   * If the API returned one whole candle later than the
   * expected first candle, that is a real missing candle.
   *
   * If it returned earlier than expected, that is acceptable
   * because the server may align the requested boundary.
   */
  const missingBeforeSeconds = Math.max(0, returnedStart - expectedFirstCandle);

  const missingAfterSeconds = Math.max(0, expectedLastCandle - returnedEnd);

  const complete =
    returnedStart <= expectedFirstCandle && returnedEnd >= expectedLastCandle;

  return {
    complete,

    requestedStart,
    requestedEnd,

    returnedStart,
    returnedEnd,

    expectedFirstCandle,
    expectedLastCandle,

    missingBeforeSeconds,
    missingAfterSeconds,

    startWeekendAdjusted,
    endWeekendAdjusted,
  };
}

/* =========================================================
   CANDLE CONTINUITY
========================================================= */

function validateForexCandleContinuity(
  candles: CandlestickData[],
  expectedIntervalSeconds: number,
): CandleContinuityResult {
  const gaps: CandleContinuityGap[] = [];

  const duplicates: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const previous = Number(candles[i - 1].time);

    const current = Number(candles[i].time);

    const diff = current - previous;

    if (diff === 0) {
      duplicates.push(current);

      continue;
    }

    /*
     * Normal adjacent candles.
     */
    if (diff === expectedIntervalSeconds) {
      continue;
    }

    /*
     * A larger interval is acceptable only if EVERY expected
     * timestamp between the two candles is Forex-weekend
     * closed.
     */
    if (
      diff > expectedIntervalSeconds &&
      isPureForexWeekendGap(previous, current, expectedIntervalSeconds)
    ) {
      continue;
    }

    /*
     * Anything else is a real continuity problem.
     */
    gaps.push({
      previous,
      current,
      expectedSeconds: expectedIntervalSeconds,
      actualSeconds: diff,
    });
  }

  return {
    complete: gaps.length === 0 && duplicates.length === 0,

    gaps,
    duplicates,
  };
}

/* =========================================================
   HISTORICAL DEBUG
========================================================= */

function logHistoricalDebug(info: HistoricalDebugInfo) {
  console.groupCollapsed(
    `%c[HISTORICAL TEST] ${info.timeframe} | ${info.symbol} | request #${info.requestId}${
      typeof info.attempt === "number" ? ` | attempt ${info.attempt + 1}` : ""
    }`,
    "font-weight:700;color:#2962ff;",
  );

  console.log("Request", {
    requestId: info.requestId,

    attempt: typeof info.attempt === "number" ? info.attempt + 1 : undefined,

    symbol: info.symbol,

    timeframe: info.timeframe,

    nativeTimeframe: info.nativeTimeframe,

    requestedStart: formatUtcTimestamp(info.requestedStart),

    requestedEnd: formatUtcTimestamp(info.requestedEnd),

    requestedDurationHours: info.requestedDurationSeconds / 3600,
  });

  console.log("Response", {
    returnedStart: formatUtcTimestamp(info.returnedStart),

    returnedEnd: formatUtcTimestamp(info.returnedEnd),

    returnedDurationHours: info.returnedDurationSeconds / 3600,

    candleCount: info.candleCount,
  });

  console.log("Continuity", {
    complete: info.continuity.complete,

    expectedIntervalSeconds: info.expectedIntervalSeconds,

    gapCount: info.continuity.gaps.length,

    duplicateCount: info.continuity.duplicates.length,
  });

  console.log("Coverage", {
    complete: info.coverage.complete,

    expectedFirstCandle: formatUtcTimestamp(info.coverage.expectedFirstCandle),

    expectedLastCandle: formatUtcTimestamp(info.coverage.expectedLastCandle),

    returnedStart: formatUtcTimestamp(info.coverage.returnedStart),

    returnedEnd: formatUtcTimestamp(info.coverage.returnedEnd),

    missingBeforeSeconds: info.coverage.missingBeforeSeconds,

    missingAfterSeconds: info.coverage.missingAfterSeconds,

    missingBeforeHours: info.coverage.missingBeforeSeconds / 3600,

    missingAfterHours: info.coverage.missingAfterSeconds / 3600,

    startWeekendAdjusted: info.coverage.startWeekendAdjusted,

    endWeekendAdjusted: info.coverage.endWeekendAdjusted,
  });

  if (info.continuity.gaps.length > 0) {
    console.warn(
      "Unexpected candle gaps:",
      info.continuity.gaps.map((gap) => ({
        previous: formatUtcTimestamp(gap.previous),

        current: formatUtcTimestamp(gap.current),

        expectedSeconds: gap.expectedSeconds,

        actualSeconds: gap.actualSeconds,

        actualHours: gap.actualSeconds / 3600,
      })),
    );
  }

  if (info.continuity.duplicates.length > 0) {
    console.warn(
      "Duplicate candle timestamps:",
      info.continuity.duplicates.map(formatUtcTimestamp),
    );
  }

  if (info.continuity.complete) {
    console.log("%cCANDLE CONTINUITY: PASS", "font-weight:700;color:#16a34a;");
  } else {
    console.error(
      "%cCANDLE CONTINUITY: FAIL",
      "font-weight:700;color:#dc2626;",
    );
  }

  if (info.coverage.complete) {
    if (
      info.coverage.startWeekendAdjusted ||
      info.coverage.endWeekendAdjusted
    ) {
      console.log(
        "%cHISTORICAL COVERAGE: PASS (WEEKEND-ADJUSTED)",
        "font-weight:700;color:#16a34a;",
      );
    } else {
      console.log(
        "%cHISTORICAL COVERAGE: PASS",
        "font-weight:700;color:#16a34a;",
      );
    }
  } else {
    console.error(
      "%cHISTORICAL COVERAGE: FAIL",
      "font-weight:700;color:#dc2626;",
    );
  }

  console.groupEnd();
}

/* =========================================================
   LINE DATA
========================================================= */

function createLineData(
  points: {
    time: number;
    value: number;
  }[],
): {
  time: UTCTimestamp;
  value: number;
}[] {
  const sorted = [...points].sort((a, b) => a.time - b.time);

  const unique: {
    time: UTCTimestamp;
    value: number;
  }[] = [];

  for (const point of sorted) {
    const time = point.time as UTCTimestamp;

    const last = unique[unique.length - 1];

    if (last && Number(last.time) === Number(time)) {
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
    return 3;
  }

  return 5;
}

function getMinMove(symbol: string) {
  const precision = getPricePrecision(symbol);

  return 1 / Math.pow(10, precision);
}

/* =========================================================
   PIP
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

  const lineSeriesRefs = useRef<ISeriesApi<"Line">[]>([]);

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

  const trades = externalTrades || [];

  const loading = externalLoading !== undefined ? externalLoading : false;

  /* =======================================================
     THEME
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

    const observer = new MutationObserver(updateTheme);

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
     LATEST TRADE
  ======================================================= */

  const getLatestTrade = (): Trade | null => {
    if (trades.length === 0) {
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
     MAP API CANDLES
  ======================================================= */

  const mapHistoricalCandles = (
    candles: HistoricalCandleResponse[],
  ): CandlestickData[] => {
    return candles
      .map((candle) => ({
        time: Math.floor(Number(candle.timestamp) / 1000) as UTCTimestamp,

        open: Number(candle.open),

        high: Number(candle.high),

        low: Number(candle.low),

        close: Number(candle.close),
      }))
      .filter(
        (candle) =>
          Number.isFinite(Number(candle.time)) &&
          Number.isFinite(candle.open) &&
          Number.isFinite(candle.high) &&
          Number.isFinite(candle.low) &&
          Number.isFinite(candle.close),
      )
      .sort((a, b) => Number(a.time) - Number(b.time));
  };

  /* =======================================================
     REMOVE DUPLICATES
  ======================================================= */

  const removeDuplicateCandles = (
    candles: CandlestickData[],
  ): CandlestickData[] => {
    const unique: CandlestickData[] = [];

    for (const candle of candles) {
      const last = unique[unique.length - 1];

      if (last && Number(last.time) === Number(candle.time)) {
        unique[unique.length - 1] = candle;

        continue;
      }

      unique.push(candle);
    }

    return unique;
  };

  /* =======================================================
     FETCH HISTORICAL
  ======================================================= */

  const fetchHistoricalCandles = async (
    position: TradePosition,
    signal: AbortSignal,
    requestId: number,
  ): Promise<CandlestickData[]> => {
    const interval = timeframeConfig.seconds;

    const entryTime = toTimestampSeconds(position.openTime);

    const closeTime = toTimestampSeconds(position.closeTime);

    const alignedEntry = alignTimestamp(entryTime, interval);

    const alignedClose = alignTimestamp(closeTime, interval);

    /*
     * Base range remains exactly the same as before.
     */
    const baseStartTime = alignedEntry - CANDLES_BEFORE_ENTRY * interval;

    const baseEndTime = alignedClose + CANDLES_AFTER_CLOSE * interval;

    let bestCandles: CandlestickData[] = [];

    let bestCoverage: HistoricalCoverageResult | null = null;

    let bestContinuity: CandleContinuityResult | null = null;

    for (
      let attempt = 0;
      attempt < RANGE_RETRY_EXTRA_CANDLES.length;
      attempt++
    ) {
      if (signal.aborted || requestId !== requestIdRef.current) {
        throw new DOMException("Stale historical request", "AbortError");
      }

      const extraCandles = RANGE_RETRY_EXTRA_CANDLES[attempt];

      let requestStartTime = baseStartTime;

      let requestEndTime = baseEndTime;

      /*
       * Expand both sides on retry.
       *
       * This is intentionally conservative.
       * The API still receives the same native timeframe.
       */
      if (attempt > 0) {
        const extraSeconds = extraCandles * interval;

        requestStartTime = baseStartTime - extraSeconds;

        requestEndTime = baseEndTime + extraSeconds;
      }

      console.groupCollapsed(
        `%c[HISTORICAL REQUEST] #${requestId} | ${timeframe} | ${position.symbol} | attempt ${
          attempt + 1
        }`,
        "font-weight:700;color:#f59e0b;",
      );

      console.log({
        requestId,

        attempt: attempt + 1,

        symbol: position.symbol.toUpperCase(),

        applicationTimeframe: timeframe,

        nativeTimeframe: timeframeConfig.dukascopyTimeframe,

        exactTradeOpenUTC: new Date(entryTime * 1000).toISOString(),

        exactTradeCloseUTC: new Date(closeTime * 1000).toISOString(),

        requestStartUTC: new Date(requestStartTime * 1000).toISOString(),

        requestEndUTC: new Date(requestEndTime * 1000).toISOString(),

        requestDurationHours: (requestEndTime - requestStartTime) / 3600,

        candlesBeforeEntry: CANDLES_BEFORE_ENTRY,

        candlesAfterClose: CANDLES_AFTER_CLOSE,

        retryExtraCandles: extraCandles,

        expectedIntervalSeconds: interval,
      });

      console.groupEnd();

      const params = new URLSearchParams({
        symbol: position.symbol.toUpperCase(),

        timeframe,

        startTime: String(requestStartTime * 1000),

        endTime: String(requestEndTime * 1000),
      });

      const url = `${HISTORICAL_CANDLES_URL}?${params.toString()}`;

      const response = await fetch(url, {
        method: "GET",

        signal,

        headers: {
          Accept: "application/json",
        },

        cache: "no-store",
      });

      if (signal.aborted || requestId !== requestIdRef.current) {
        throw new DOMException("Stale historical request", "AbortError");
      }

      if (!response.ok) {
        let message = `Historical data request failed (${response.status})`;

        try {
          const body = (await response.json()) as HistoricalApiResponse;

          if (body.error) {
            message = body.error;
          }
        } catch {}

        throw new Error(message);
      }

      const json = (await response.json()) as HistoricalApiResponse;

      if (signal.aborted || requestId !== requestIdRef.current) {
        throw new DOMException("Stale historical request", "AbortError");
      }

      if (!json.success) {
        throw new Error(json.error || "Historical data request failed");
      }

      if (!Array.isArray(json.candles)) {
        throw new Error("Historical API returned invalid candle data");
      }

      /* ===================================================
         VERIFY TIMEFRAME
      =================================================== */

      if (json.timeframe && json.timeframe.toUpperCase() !== timeframe) {
        throw new Error(
          `Historical API returned timeframe ${json.timeframe}, expected ${timeframe}.`,
        );
      }

      const expectedNativeTimeframe = timeframeConfig.dukascopyTimeframe;

      if (
        json.dukascopyTimeframe &&
        json.dukascopyTimeframe.toLowerCase() !==
          expectedNativeTimeframe.toLowerCase()
      ) {
        throw new Error(
          `Historical API returned native timeframe ${json.dukascopyTimeframe}, expected ${expectedNativeTimeframe}.`,
        );
      }

      /* ===================================================
         MAP CANDLES
      =================================================== */

      const mapped = mapHistoricalCandles(json.candles);

      /*
       * Continuity is checked BEFORE duplicate removal
       * so duplicates remain visible in diagnostics.
       */
      const rawContinuity = validateForexCandleContinuity(mapped, interval);

      /* ===================================================
         REMOVE EXACT DUPLICATES
      =================================================== */

      const unique = removeDuplicateCandles(mapped);

      const returnedStart = unique.length > 0 ? Number(unique[0].time) : null;

      const returnedEnd =
        unique.length > 0 ? Number(unique[unique.length - 1].time) : null;

      /* ===================================================
         WEEKEND-AWARE COVERAGE
      =================================================== */

      const coverage = validateHistoricalCoverage(
        requestStartTime,
        requestEndTime,
        returnedStart,
        returnedEnd,
        interval,
      );

      const debugInfo: HistoricalDebugInfo = {
        requestId,

        attempt,

        symbol: position.symbol.toUpperCase(),

        timeframe,

        nativeTimeframe: json.dukascopyTimeframe || expectedNativeTimeframe,

        requestedStart: requestStartTime,

        requestedEnd: requestEndTime,

        returnedStart,

        returnedEnd,

        requestedDurationSeconds: requestEndTime - requestStartTime,

        returnedDurationSeconds:
          returnedStart !== null && returnedEnd !== null
            ? returnedEnd - returnedStart
            : 0,

        candleCount: unique.length,

        expectedIntervalSeconds: interval,

        continuity: rawContinuity,

        coverage,
      };

      logHistoricalDebug(debugInfo);

      console.log(
        `%c[LONG RANGE TEST] #${requestId} ${timeframe} attempt ${
          attempt + 1
        }: ${coverage.complete ? "PASS" : "CHECK"}`,
        coverage.complete
          ? "font-weight:700;color:#16a34a;"
          : "font-weight:700;color:#f59e0b;",
      );

      if (coverage.startWeekendAdjusted) {
        console.log(
          `[LONG RANGE TEST] ${timeframe}: start boundary is Forex-weekend adjusted.`,
          {
            requestedStart: formatUtcTimestamp(requestStartTime),

            expectedFirstCandle: formatUtcTimestamp(
              coverage.expectedFirstCandle,
            ),

            returnedStart: formatUtcTimestamp(returnedStart),
          },
        );
      }

      if (coverage.endWeekendAdjusted) {
        console.log(
          `[LONG RANGE TEST] ${timeframe}: end boundary is Forex-weekend adjusted.`,
          {
            requestedEnd: formatUtcTimestamp(requestEndTime),

            expectedLastCandle: formatUtcTimestamp(coverage.expectedLastCandle),

            returnedEnd: formatUtcTimestamp(returnedEnd),
          },
        );
      }

      if (!coverage.complete) {
        console.warn(
          "[LONG RANGE TEST] Historical range is still incomplete.",
          {
            requestedStart: formatUtcTimestamp(requestStartTime),

            requestedEnd: formatUtcTimestamp(requestEndTime),

            expectedFirstCandle: formatUtcTimestamp(
              coverage.expectedFirstCandle,
            ),

            expectedLastCandle: formatUtcTimestamp(coverage.expectedLastCandle),

            returnedStart: formatUtcTimestamp(returnedStart),

            returnedEnd: formatUtcTimestamp(returnedEnd),

            missingBeforeSeconds: coverage.missingBeforeSeconds,

            missingAfterSeconds: coverage.missingAfterSeconds,

            missingBeforeHours: coverage.missingBeforeSeconds / 3600,

            missingAfterHours: coverage.missingAfterSeconds / 3600,
          },
        );
      }

      bestCandles = unique;

      bestCoverage = coverage;

      bestContinuity = rawContinuity;

      /*
       * If coverage is complete, there is no reason to
       * hit Dukascopy/API again.
       */
      if (coverage.complete) {
        console.log(
          `%c[HISTORICAL RANGE COMPLETE] ${timeframe} on attempt ${
            attempt + 1
          }`,
          "font-weight:700;color:#16a34a;",
        );

        /*
         * If continuity also passes, this is the ideal case.
         */
        if (rawContinuity.complete) {
          console.log(
            `%c[HISTORICAL DATA VALID] ${timeframe}`,
            "font-weight:700;color:#16a34a;",
          );
        }

        break;
      }

      /*
       * If this is not the final attempt, retry with
       * a larger request.
       */
      if (attempt < RANGE_RETRY_EXTRA_CANDLES.length - 1) {
        console.warn(
          `[HISTORICAL RANGE RETRY] ${timeframe}: expanding request because coverage is incomplete.`,
          {
            nextAttempt: attempt + 2,

            currentMissingBeforeHours: coverage.missingBeforeSeconds / 3600,

            currentMissingAfterHours: coverage.missingAfterSeconds / 3600,
          },
        );
      }
    }

    /*
     * Final diagnostics after all retries.
     */
    if (bestCoverage && !bestCoverage.complete) {
      console.error(
        `%c[HISTORICAL RANGE FINAL FAIL] ${timeframe}`,
        "font-weight:700;color:#dc2626;",
        {
          expectedFirstCandle: formatUtcTimestamp(
            bestCoverage.expectedFirstCandle,
          ),

          expectedLastCandle: formatUtcTimestamp(
            bestCoverage.expectedLastCandle,
          ),

          returnedStart: formatUtcTimestamp(bestCoverage.returnedStart),

          returnedEnd: formatUtcTimestamp(bestCoverage.returnedEnd),

          missingBeforeHours: bestCoverage.missingBeforeSeconds / 3600,

          missingAfterHours: bestCoverage.missingAfterSeconds / 3600,
        },
      );
    }

    if (bestContinuity && !bestContinuity.complete) {
      console.error(
        `%c[CANDLE CONTINUITY FINAL FAIL] ${timeframe}`,
        "font-weight:700;color:#dc2626;",
        bestContinuity,
      );
    }

    return bestCandles;
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

    const entryTime = toTimestampSeconds(trade.openTime);

    const closeTime = toTimestampSeconds(trade.closeTime);

    const alignedEntry = alignTimestamp(entryTime, interval);

    const alignedClose = alignTimestamp(closeTime, interval);

    const chartStartTime = alignedEntry - CANDLES_BEFORE_ENTRY * interval;

    const chartEndTime = alignedClose + CANDLES_AFTER_CLOSE * interval;

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

    /* ===================================================
       ENTRY LINE
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

    entryLine.setData(
      createLineData([
        {
          time: chartStartTime,

          value: entryPrice,
        },

        {
          time: entryTime,

          value: entryPrice,
        },

        {
          time: closeTime,

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
       SL LINE
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
          time: entryTime,

          value: sl,
        },

        {
          time: closeTime,

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
       TP LINE
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
          time: entryTime,

          value: tp,
        },

        {
          time: closeTime,

          value: tp,
        },

        {
          time: chartEndTime,

          value: tp,
        },
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
    if (!chartContainerRef.current || loading) {
      return;
    }

    const currentRequestId = ++requestIdRef.current;

    const abortController = new AbortController();

    console.log(
      `%c[CHART REQUEST START] #${currentRequestId}`,
      "font-weight:700;color:#7c3aed;",
      {
        timeframe,

        selectedTradeId: selectedTradeId || null,
      },
    );

    /* ===================================================
       CLEAN OLD CHART
    =================================================== */

    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch {}

      chartRef.current = null;
    }

    seriesRef.current = null;

    lineSeriesRefs.current = [];

    setRectangles([]);

    setHistoricalError(null);

    /* ===================================================
       CREATE CHART
    =================================================== */

    try {
      const container = chartContainerRef.current;

      const width = container.clientWidth || 900;

      const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

      const height = isFullscreen
        ? Math.max(300, window.innerHeight - 110)
        : isMobile
          ? 330
          : 400;

      const currentTheme = getCurrentTheme();

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

        /*
         * IMPORTANT:
         *
         * Explicitly enable the right price scale.
         *
         * This is especially important for M5/M15 where
         * the chart is recreated frequently.
         */
        rightPriceScale: {
          borderColor: currentTheme.border,

          autoScale: true,

          scaleMargins: {
            top: 0.08,

            bottom: 0.08,
          },

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

          borderColor: currentTheme.border,
        },

        localization: {
          timeFormatter: formatChartUtcTime,
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

          horzTouchDrag: true,

          vertTouchDrag: true,
        },

        /*
         * IMPORTANT:
         *
         * Price-axis vertical scaling is explicitly enabled.
         *
         * Drag the right price axis vertically to expand/
         * compress the price scale.
         *
         * Time-axis scaling remains enabled as well.
         */
        handleScale: {
          axisPressedMouseMove: {
            time: true,
            price: true,
          },

          mouseWheel: true,

          pinch: true,
        },
      });

      chartRef.current = chart;

      /* =================================================
         SELECT TRADE
      ================================================= */

      const selectedTradeFromList = getSelectedTrade();

      const latestTrade = selectedTradeFromList || getLatestTrade();

      if (!latestTrade) {
        setSelectedTrade(null);

        return;
      }

      if (!latestTrade.close_time) {
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

        priceScaleId: "right",

        priceFormat: {
          type: "price",

          precision,

          minMove: getMinMove(position.symbol),
        },
      });

      seriesRef.current = candlestickSeries;

      /* =================================================
         LOAD HISTORICAL
      ================================================= */

      const loadHistoricalData = async () => {
        setHistoricalLoading(true);

        setHistoricalError(null);

        try {
          const candleData = await fetchHistoricalCandles(
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
            throw new Error(
              "No historical candles were returned for this trade.",
            );
          }

          candlestickSeries.setData(candleData);

          /*
           * Force price scale back to automatic mode
           * after data is applied.
           *
           * This is particularly useful when changing
           * M5 <-> M15 because the entire chart instance
           * is recreated.
           */
          chart.priceScale("right").applyOptions({
            autoScale: true,

            scaleMargins: {
              top: 0.08,

              bottom: 0.08,
            },
          });

          console.log(
            `%c[CHART DATA APPLIED] #${currentRequestId}`,
            "font-weight:700;color:#16a34a;",
            {
              timeframe,

              nativeTimeframe: timeframeConfig.dukascopyTimeframe,

              candleCount: candleData.length,

              firstCandleUTC: formatUtcTimestamp(Number(candleData[0].time)),

              lastCandleUTC: formatUtcTimestamp(
                Number(candleData[candleData.length - 1].time),
              ),
            },
          );

          /* ===========================================
               POSITION LINES
            =========================================== */

          const range = drawPositionLines(chart, position, currentTheme);

          /*
           * After lines are added, keep auto scale enabled.
           */
          chart.priceScale("right").applyOptions({
            autoScale: true,

            scaleMargins: {
              top: 0.08,

              bottom: 0.08,
            },
          });

          /* ===========================================
               VISIBLE RANGE
            =========================================== */

          if (range) {
            chart.timeScale().setVisibleRange({
              from: range.chartStartTime as UTCTimestamp,
              to: range.chartEndTime as UTCTimestamp,
            });
          }

          /*
           * Re-apply autoScale after visible logical range
           * has been changed.
           */
          chart.priceScale("right").applyOptions({
            autoScale: true,
          });
        } catch (error) {
          if (abortController.signal.aborted) {
            return;
          }

          if (currentRequestId !== requestIdRef.current) {
            return;
          }

          console.error("Historical candle error:", error);

          setHistoricalError(
            error instanceof Error
              ? error.message
              : "Failed to load historical market data.",
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

      void loadHistoricalData();

      /* =================================================
         RESIZE
      ================================================= */

      const handleResize = () => {
        if (!chartContainerRef.current || !chartRef.current) {
          return;
        }

        const newWidth = chartContainerRef.current.clientWidth;

        if (newWidth <= 0) {
          return;
        }

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

          /*
           * Keep the price scale interactive after resize.
           */
          rightPriceScale: {
            autoScale: true,
          },
        });
      };

      const resizeObserver = new ResizeObserver(handleResize);

      resizeObserver.observe(container);

      window.addEventListener("resize", handleResize);

      return () => {
        abortController.abort();

        console.log(
          `%c[CHART REQUEST CLEANUP] #${currentRequestId}`,
          "font-weight:700;color:#64748b;",
        );

        window.removeEventListener("resize", handleResize);

        resizeObserver.disconnect();

        if (chartRef.current) {
          try {
            chartRef.current.remove();
          } catch {}

          chartRef.current = null;
        }

        seriesRef.current = null;

        lineSeriesRefs.current = [];

        setRectangles([]);

        setHistoricalLoading(false);
      };
    } catch (error) {
      console.error("Error creating chart:", error);

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
  ]);

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

    const entryTime = toTimestampSeconds(selectedTrade.openTime);

    const closeTime = toTimestampSeconds(selectedTrade.closeTime);

    return {
      rr,
      slPips,
      tpPips,
      slAmount,
      tpAmount,
      entryTime,
      closeTime,
    };
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
      {/* ===================================================
          FULLSCREEN CLOSE
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

          minHeight: isFullscreen ? undefined : "380px",
        }}
      >
        {/* HISTORICAL LOADING */}

        {historicalLoading && (
          <div
            className="
              absolute
              top-2
              left-1/2
              -translate-x-1/2
              z-[100]
              px-3
              py-1.5
              rounded-md
              text-[11px]
              font-medium
              bg-white/90
              dark:bg-[#161922]/90
              text-gray-600
              dark:text-gray-300
              border
              border-gray-200
              dark:border-[#2b2b43]
              shadow-sm
              backdrop-blur-sm
            "
          >
            Loading historical data...
          </div>
        )}

        {/* HISTORICAL ERROR */}

        {historicalError && (
          <div
            className="
              absolute
              inset-x-2
              top-2
              z-[100]
              flex
              items-center
              justify-center
              pointer-events-none
            "
          >
            <div
              className="
                max-w-[90%]
                px-3
                py-2
                rounded-md
                text-[11px]
                bg-red-50
                dark:bg-red-950/80
                text-red-600
                dark:text-red-300
                border
                border-red-200
                dark:border-red-900
                shadow-sm
              "
            >
              {historicalError}
            </div>
          </div>
        )}

        {/* RISK / REWARD */}

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

        {/* ENTRY INFO */}

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

        {/* SL INFO */}

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

        {/* TP INFO */}

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
