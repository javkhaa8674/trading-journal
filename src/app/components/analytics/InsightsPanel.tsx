// src/components/analytics/InsightsPanel.tsx

"use client";

import React from "react";

interface InsightsPanelProps {
  insights: {
    problems: string[];
    recommendations: string[];
    summary: string;
  };
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  if (!insights?.problems?.length && !insights?.recommendations?.length) {
    return (
      <div className="rounded-lg border bg-gradient-to-r from-purple-50 to-blue-50 p-4 dark:from-purple-950/20 dark:to-blue-950/20 dark:border-purple-800/30">
        <h2 className="text-lg font-semibold">
          5️⃣ Insights &amp; Recommendations
        </h2>
        <p className="text-sm text-gray-500">
          Хангалттай мэдээлэл байхгүй байна.
        </p>
      </div>
    );
  }

  // If insights has patterns (new format), transform to old format
  let displayInsights = insights;
  if ("patterns" in insights) {
    const result = insights as any;
    displayInsights = {
      problems:
        result.patterns
          ?.filter(
            (p: any) =>
              p.type === "problem" ||
              p.type === "warning" ||
              p.type === "critical",
          )
          .map((p: any) => p.description) || [],
      recommendations: result.recommendations?.map((r: any) => r.action) || [],
      summary: result.summary?.description || "Анализ хийгдсэн.",
    };
  }

  return (
    <div className="rounded-lg border bg-gradient-to-r from-purple-50 to-blue-50 p-4 dark:from-purple-950/20 dark:to-blue-950/20 dark:border-purple-800/30">
      <h2 className="text-lg font-semibold">
        5️⃣ Insights &amp; Recommendations
      </h2>

      <div className="mt-3 space-y-3">
        {/* Summary */}
        {displayInsights.summary && (
          <div className="rounded-lg bg-white/50 p-3 dark:bg-black/20">
            <p className="text-sm font-medium">📊 {displayInsights.summary}</p>
          </div>
        )}

        {/* Problems */}
        {displayInsights.problems && displayInsights.problems.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-red-600 dark:text-red-400">
              🔴 Илэрсэн асуудлууд
            </h3>
            <ul className="mt-1 space-y-1">
              {displayInsights.problems.map(
                (problem: string, index: number) => (
                  <li
                    key={index}
                    className="text-sm text-red-700 dark:text-red-300 list-disc list-inside"
                  >
                    {problem}
                  </li>
                ),
              )}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {displayInsights.recommendations &&
          displayInsights.recommendations.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-green-600 dark:text-green-400">
                🟢 Зөвлөмжүүд
              </h3>
              <ul className="mt-1 space-y-1">
                {displayInsights.recommendations.map(
                  (rec: string, index: number) => (
                    <li
                      key={index}
                      className="text-sm text-green-700 dark:text-green-300 list-disc list-inside"
                    >
                      {rec}
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}

        {/* If no problems but there are trades */}
        {displayInsights.problems?.length === 0 &&
          displayInsights.recommendations?.length > 0 && (
            <div className="rounded-lg bg-green-50/50 p-3 dark:bg-green-950/20">
              <p className="text-sm text-green-700 dark:text-green-300">
                ✅ Тодорхой асуудал илрээгүй байна. Зөвлөмжүүдийг дагаж
                үргэлжлүүлэн сайжруулаарай.
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
