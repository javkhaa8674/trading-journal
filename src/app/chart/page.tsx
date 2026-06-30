"use client";

import React, { useRef, useState, useEffect } from "react";
import TradingViewWidget from "@/app/components/chart/TradingViewWidget";
import PositionCalculator from "@/app/components/chart/PositionCalculator";

export default function ChartPage() {
  const [width, setWidth] = useState(340);

  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(340);

  const MIN_SHOW = 60; // threshold before full hide
  const MAX = 600;

  // ================= START DRAG =================
  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;

    document.body.style.userSelect = "none";
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  // ================= MOVE =================
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!isDragging.current) return;

      const deltaX = startX.current - e.clientX;
      let newWidth = startWidth.current + deltaX;

      // 🔥 FULL HIDE LOGIC
      if (newWidth < MIN_SHOW) {
        setWidth(0);
        return;
      }

      if (newWidth > MAX) newWidth = MAX;

      setWidth(newWidth);
    };

    const onUp = () => {
      isDragging.current = false;
      document.body.style.userSelect = "auto";
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("touchend", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* ================= CHART ================= */}
      <div className="flex-1 min-w-0">
        <TradingViewWidget />
      </div>

      {/* ================= RESIZE HANDLE ================= */}
      <div
        onPointerDown={onPointerDown}
        className="
          w-2 md:w-1
          bg-gray-300 hover:bg-blue-500
          cursor-col-resize
          touch-none
          z-50
        "
      />

      {/* ================= RIGHT PANEL ================= */}
      <div
        className="h-full overflow-hidden transition-all duration-150"
        style={{
          width: width,
          minWidth: 0,
          flexShrink: 0,
        }}
      >
        {width > 0 && <PositionCalculator symbol="XAUUSD" />}
      </div>
    </div>
  );
}
