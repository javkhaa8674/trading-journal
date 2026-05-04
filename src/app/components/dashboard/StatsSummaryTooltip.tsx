"use client";

import { useState } from "react";

type Props = {
  metrics: any;
};

export function StatsSummaryTooltip({ metrics }: Props) {
  const [open, setOpen] = useState(false);

  const messages: string[] = [];

  // ---------------- AI LOGIC ----------------
  if (metrics.profitFactor < 1) {
    messages.push("❌ Алдагдалтай систем (PF < 1)");
  } else if (metrics.profitFactor < 1.5) {
    messages.push("⚠ Profit Factor сул");
  } else {
    messages.push("✅ Profit Factor сайн");
  }

  if (metrics.calmarRatio < 1) {
    messages.push("⚠ Drawdown өндөр");
  } else {
    messages.push("🔥 Drawdown сайн control");
  }

  if (metrics.sharpeRatio < 0.5) {
    messages.push("⚠ Тогтворгүй (Sharpe бага)");
  }

  if (metrics.consistency > 75) {
    messages.push("📈 Тогтвортой стратеги");
  }

  let overall = "⚖ Balanced";
  if (metrics.profitFactor > 1.5 && metrics.calmarRatio > 1.5) {
    overall = "🔥 Strong Strategy";
  }
  if (metrics.profitFactor < 1) {
    overall = "❌ Weak Strategy";
  }

  return (
    <div className="relative inline-block">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-gray-500 hover:text-blue-500"
      >
        🧠 AI Дүгнэлт
      </button>

      {/* FLOAT PANEL */}
      {open && (
        <div
          className="
            absolute right-0 mt-2 w-72 p-3
            bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700
            rounded-lg shadow-xl z-[9999]
          "
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-sm">{overall}</span>

            <button
              onClick={() => setOpen(false)}
              className="text-xs text-gray-400"
            >
              ✕
            </button>
          </div>

          {/* Summary */}
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
            {messages.slice(0, 2).map((m, i) => (
              <div key={i}>{m}</div>
            ))}
          </div>

          {/* Expand */}
          {open && (
            <div className="mt-2 pt-2 border-t text-xs text-gray-500 space-y-1">
              {messages.map((m, i) => (
                <div key={i}>{m}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
