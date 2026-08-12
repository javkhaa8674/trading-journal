"use client";

import React, { useEffect, useRef, useState } from "react";
import TradingViewWidget from "@/app/components/chart/TradingViewWidget";
import PositionCalculator from "@/app/components/chart/PositionCalculator";

export default function ChartPage() {
  const [width, setWidth] = useState(280);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(280);

  const MIN_SHOW = 60;
  const MAX = 600;

  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;

    document.body.style.userSelect = "none";

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!isDragging.current) return;

      const delta = startX.current - e.clientX;
      let newWidth = startWidth.current + delta;

      if (newWidth < MIN_SHOW) {
        setWidth(0);
        return;
      }

      if (newWidth > MAX) {
        newWidth = MAX;
      }

      setWidth(newWidth);
    };

    const onUp = () => {
      isDragging.current = false;
      document.body.style.userSelect = "auto";
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden relative">
      {/* CHART */}
      <div className="flex-1 min-w-0">
        <TradingViewWidget />
      </div>

      {/* DESKTOP RESIZE HANDLE */}
      <div
        onPointerDown={onPointerDown}
        className="
          hidden md:block
          w-1
          bg-gray-300
          hover:bg-blue-500
          cursor-col-resize
          touch-none
          z-30
        "
      />

      {/* DESKTOP PANEL */}
      <div
        className="hidden md:block h-full overflow-hidden"
        style={{
          width,
          minWidth: 0,
          flexShrink: 0,
        }}
      >
        {width > 0 && <PositionCalculator symbol="XAUUSD" />}
      </div>

      {/* MOBILE OPEN BUTTON */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="
            md:hidden
            absolute
            right-4
            bottom-4
            w-11
            h-11
            rounded-full
            bg-blue-600
            text-white
            shadow-xl
            z-40
          "
        >
          📐
        </button>
      )}

      {/* MOBILE DRAWER */}
      <div
        className={`
          md:hidden
          fixed
          left-0
          right-0
          bottom-0
          h-[210px]
          rounded-t-2xl
          bg-white
          dark:bg-gray-950
          shadow-xl
          z-50
          transition-transform
          duration-300
          ${mobileOpen ? "translate-y-0" : "translate-y-full"}
        `}
      >
        <PositionCalculator symbol="XAUUSD" />
      </div>
    </div>
  );
}
