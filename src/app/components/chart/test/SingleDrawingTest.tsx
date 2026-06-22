"use client";

import React, { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CandlestickSeries } from "lightweight-charts";
import {
  DrawingManager,
  TrendLine,
  Rectangle,
  HorizontalLine,
  TextAnnotation,
} from "lightweight-charts-drawing";

type Point = { time: any; price: number };

// ==========================
// RANDOM 500 CANDLES (ASC SAFE)
// ==========================
const generateMockData = (length = 500) => {
  let price = 100;
  const result = [];

  for (let i = 0; i < length; i++) {
    const trend = Math.sin(i / 40) * 0.8;
    const noise = (Math.random() - 0.5) * 2;

    const change = trend + noise;

    const open = price;
    const close = price + change;

    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;

    price = close;

    result.push({
      time: 1704067200 + i * 86400, // 👈 STRICT ASC TIME
      open,
      high,
      low,
      close,
    });
  }

  return result;
};

export default function SingleDrawingTest() {
  const ref = useRef<HTMLDivElement | null>(null);

  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const managerRef = useRef<any>(null);

  const previewRef = useRef<any>(null);

  const [tool, setTool] = useState<
    "trend" | "rectangle" | "horizontal" | "text" | null
  >(null);
  const [start, setStart] = useState<Point | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const chart = createChart(ref.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#131722" },
        textColor: "#d1d4dc",
      },
      width: ref.current.clientWidth,
      height: 500,
    });

    const series = chart.addSeries(CandlestickSeries as any);
    series.setData(generateMockData(500) as any);

    const manager = new DrawingManager();
    manager.attach(chart, series, ref.current);

    chartRef.current = chart;
    seriesRef.current = series;
    managerRef.current = manager;

    chart.timeScale().fitContent();

    return () => chart.remove();
  }, []);

  // =========================
  // CLICK + PREVIEW + MOVE
  // =========================
  useEffect(() => {
    const container = ref.current;
    const chart = chartRef.current;
    const series = seriesRef.current;

    if (!container || !chart || !series) return;

    const getPoint = (e: MouseEvent): Point | null => {
      const rect = container.getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const time = chart.timeScale().coordinateToTime(x);
      const price = series.coordinateToPrice(y);

      if (!time || !price) return null;

      return { time, price };
    };

    // =========================
    // CLICK (final draw)
    // =========================
    const onClick = (e: MouseEvent) => {
      if (!tool) return;

      const point = getPoint(e);
      if (!point) return;

      if ((tool === "trend" || tool === "rectangle") && !start) {
        setStart(point);
        return;
      }

      let drawing: any;

      if (tool === "trend") {
        drawing = new TrendLine(`tl-${Date.now()}`, [start!, point], {
          lineColor: "#00e5ff",
          lineWidth: 2,
        });
      }

      if (tool === "rectangle") {
        drawing = new Rectangle(`rect-${Date.now()}`, [start!, point], {
          fillColor: "rgba(0,229,255,0.15)",
          lineColor: "#00e5ff",
          lineWidth: 2,
        });
      }

      if (tool === "horizontal") {
        drawing = new HorizontalLine(`hl-${Date.now()}`, [point], {
          lineColor: "#26a69a",
          lineWidth: 2,
        });
      }

      if (tool === "text") {
        drawing = new TextAnnotation(
          `text-${Date.now()}`,
          [point],
          {
            lineColor: "#FFD93D",
            lineWidth: 1,
            fillColor: "rgba(0,0,0,0.7)",
          },
          { text: "Note", fontSize: 14 },
        );
      }

      if (drawing) managerRef.current.addDrawing(drawing);

      setStart(null);

      // remove preview
      if (previewRef.current) {
        managerRef.current.removeDrawing(previewRef.current.id);
        previewRef.current = null;
      }
    };

    // =========================
    // MOUSE MOVE (🔥 PREVIEW FIX)
    // =========================
    const onMove = (e: MouseEvent) => {
      if (!tool || !start) return;

      const point = getPoint(e);
      if (!point) return;

      if (previewRef.current) {
        managerRef.current.removeDrawing(previewRef.current.id);
      }

      if (tool === "trend") {
        previewRef.current = new TrendLine("preview", [start, point], {
          lineColor: "rgba(0,229,255,0.4)",
          lineWidth: 1,
        });
      }

      if (tool === "rectangle") {
        previewRef.current = new Rectangle("preview", [start, point], {
          fillColor: "rgba(0,229,255,0.08)",
          lineColor: "rgba(0,229,255,0.4)",
          lineWidth: 1,
        });
      }

      managerRef.current.addDrawing(previewRef.current);
    };

    container.addEventListener("click", onClick);
    container.addEventListener("mousemove", onMove);

    return () => {
      container.removeEventListener("click", onClick);
      container.removeEventListener("mousemove", onMove);
    };
  }, [tool, start]);

  return (
    <div style={{ background: "#131722", color: "white", padding: 10 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        {["trend", "rectangle", "horizontal", "text"].map((t) => (
          <button
            key={t}
            onClick={() => {
              setTool(t as any);
              setStart(null);
            }}
            style={{
              padding: "6px 10px",
              background: tool === t ? "#00e5ff" : "#222",
              color: "white",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div ref={ref} style={{ width: "100%", height: 500 }} />
    </div>
  );
}
