"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface TradingViewWidgetProps {
  symbol?: string;
  interval?: string;
  height?: number | string;
  locale?: string;
  containerId?: string;
  hide_side_toolbar?: boolean;
  hide_top_toolbar?: boolean;
  allow_symbol_change?: boolean;
  hide_volume?: boolean;
  studies?: string[];
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export default function TradingViewWidget({
  symbol = "XAUUSD",
  interval = "1",
  height = "100%",
  locale = "mn",
  containerId = "tradingview_chart",
  hide_side_toolbar = false,
  hide_top_toolbar = false,
  allow_symbol_change = true,
  hide_volume = true,
  studies = [],
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const scriptLoadedRef = useRef(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const initWidget = () => {
    if (!containerRef.current || !window.TradingView) return;

    if (widgetRef.current) {
      try {
        widgetRef.current.remove();
      } catch (e) {}
      widgetRef.current = null;
    }

    try {
      const widget = new window.TradingView.widget({
        container_id: containerId,
        symbol: symbol,
        interval: interval,
        timezone: "Asia/Ulaanbaatar",
        theme: isDark ? "dark" : "light",
        style: "1",
        locale: locale,
        toolbar_bg: isDark ? "#1e222d" : "#f5f5f5",
        enable_publishing: false,
        hide_side_toolbar: hide_side_toolbar,
        hide_top_toolbar: hide_top_toolbar,
        allow_symbol_change: allow_symbol_change,
        withdateranges: true,
        hide_volume: hide_volume,
        autosize: true,
        studies: studies,
        save_image: false,
        details: false,
        hotlist: false,
        calendar: false,
        news: [],
        popup_width: "1000",
        popup_height: "650",
        widgetbar: {
          watchlist: false,
          details: false,
          news: false,
        },
      });

      widgetRef.current = widget;
      console.log("✅ TradingView widget initialized");
    } catch (error) {
      console.error("TradingView widget error:", error);
    }
  };

  // Script ачаалах
  useEffect(() => {
    if (window.TradingView) {
      scriptLoadedRef.current = true;
      initWidget();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      scriptLoadedRef.current = true;
      if (window.TradingView && containerRef.current) {
        initWidget();
      }
    };
    script.onerror = () => {
      console.error("Failed to load TradingView script");
    };
    document.head.appendChild(script);

    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {}
        widgetRef.current = null;
      }
    };
  }, []);

  // Symbol өөрчлөгдөхөд
  useEffect(() => {
    if (widgetRef.current && symbol) {
      try {
        widgetRef.current.setSymbol(symbol, () => {
          console.log(`Symbol changed to: ${symbol}`);
        });
      } catch (e) {
        initWidget();
      }
    }
  }, [symbol]);

  // Interval өөрчлөгдөхөд
  useEffect(() => {
    if (widgetRef.current && interval) {
      try {
        widgetRef.current.setInterval(interval, () => {});
      } catch (e) {
        initWidget();
      }
    }
  }, [interval]);

  // Theme өөрчлөгдөхөд
  useEffect(() => {
    if (widgetRef.current) {
      const timeout = setTimeout(() => {
        initWidget();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isDark]);

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: typeof height === "number" ? `${height}px` : height,
    minHeight: "400px",
    position: "relative",
  };

  return (
    <div
      ref={containerRef}
      id={containerId}
      style={containerStyle}
      className="tradingview-widget-container"
    >
      <div className="tradingview-widget-container__widget" />
    </div>
  );
}
