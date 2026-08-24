// src/components/analytics/InsightsPanel.tsx

"use client";

interface InsightsPanelProps {
  insights: {
    problems: string[];
    recommendations: string[];
    summary: string;
  };
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  if (!insights?.problems?.length) {
    return (
      <div className="rounded-lg border bg-gradient-to-r from-purple-50 to-blue-50 p-4 dark:from-purple-950/20 dark:to-blue-950/20 dark:border-purple-800/30">
        <h2 className="text-lg font-semibold">5️⃣ Insights & Recommendations</h2>
        <p className="text-sm text-gray-500">
          Хангалттай мэдээлэл байхгүй байна.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-gradient-to-r from-purple-50 to-blue-50 p-4 dark:from-purple-950/20 dark:to-blue-950/20 dark:border-purple-800/30">
      <h2 className="text-lg font-semibold">5️⃣ Insights & Recommendations</h2>

      <div className="mt-3 space-y-3">
        {/* Summary */}
        <div className="rounded-lg bg-white/50 p-3 dark:bg-black/20">
          <p className="text-sm font-medium">📊 {insights.summary}</p>
        </div>

        {/* Problems */}
        {insights.problems.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-red-600 dark:text-red-400">
              🔴 Илэрсэн асуудлууд
            </h3>
            <ul className="mt-1 space-y-1">
              {insights.problems.map((problem, index) => (
                <li
                  key={index}
                  className="text-sm text-red-700 dark:text-red-300 list-disc list-inside"
                >
                  {problem}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {insights.recommendations.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-green-600 dark:text-green-400">
              🟢 Зөвлөмжүүд
            </h3>
            <ul className="mt-1 space-y-1">
              {insights.recommendations.map((rec, index) => (
                <li
                  key={index}
                  className="text-sm text-green-700 dark:text-green-300 list-disc list-inside"
                >
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
