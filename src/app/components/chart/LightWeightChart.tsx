"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  BarSeries,
  IChartApi,
  ISeriesApi,
  ColorType,
} from "lightweight-charts";

import { DrawingManager } from "lightweight-charts-drawing";

interface Props {
  data: any[];
  type?: "candlestick" | "line" | "area" | "bar";
  height?: number | string;
  indicators?: string[];
  drawingTools?: string[];
  onDrawingToolsChange?: (tools: string[]) => void;
}

export default function LightweightChart({
  data = [],
  type = "candlestick",
  height = 500,
  drawingTools = [],
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const managerRef = useRef<DrawingManager | null>(null);

  const mountedRef = useRef(false);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const colors = {
    background: isDark ? "#131722" : "#ffffff",
    text: isDark ? "#d1d4dc" : "#000",
    up: "#26a69a",
    down: "#ef5350",
  };

  // ✅ CREATE CHART ONLY ONCE
  useEffect(() => {
    if (!containerRef.current || mountedRef.current) return;

    mountedRef.current = true;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: typeof height === "number" ? height : 500,
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.text,
      },
      grid: {
        vertLines: { color: "#2a2e39" },
        horzLines: { color: "#2a2e39" },
      },
      timeScale: { timeVisible: true },
    });

    chartRef.current = chart;

    // ✅ SERIES CREATE (v5 correct)
    const series =
      type === "candlestick"
        ? chart.addSeries(CandlestickSeries)
        : type === "line"
          ? chart.addSeries(LineSeries)
          : type === "area"
            ? chart.addSeries(AreaSeries)
            : chart.addSeries(BarSeries);

    seriesRef.current = series;

    chart.timeScale().fitContent();

    // ✅ DRAWING MANAGER attach AFTER chart fully ready
    setTimeout(() => {
      if (!chartRef.current || !seriesRef.current || !containerRef.current)
        return;

      const manager = new DrawingManager();
      manager.attach(chartRef.current, seriesRef.current, containerRef.current);

      managerRef.current = manager;

      console.log("✅ DrawingManager attached");
    }, 300);

    return () => {
      mountedRef.current = false;

      managerRef.current?.detach();
      chartRef.current?.remove();

      managerRef.current = null;
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // ✅ DATA UPDATE ONLY
  useEffect(() => {
    if (!seriesRef.current || !data.length) return;

    const formatted =
      type === "candlestick"
        ? data.map((d) => ({
            time: d.time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
          }))
        : data.map((d) => ({
            time: d.time,
            value: d.close ?? d.value,
          }));

    seriesRef.current.setData(formatted);
  }, [data, type]);

  // ✅ TOOL SWITCHING
  useEffect(() => {
    if (!managerRef.current) return;

    const tool = drawingTools?.[0];

    if (tool) {
      managerRef.current.setActiveTool(tool);
      console.log("🔧 Tool set:", tool);
    } else {
      managerRef.current.setActiveTool(null);
    }
  }, [drawingTools]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: typeof height === "number" ? `${height}px` : height,
      }}
    />
  );
}
