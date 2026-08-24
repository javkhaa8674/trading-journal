// src/components/analytics/SetupAnalytics.tsx

"use client";

interface SetupAnalyticsProps {
  data: {
    distribution: Array<{
      range: string;
      count: number;
      winRate: string;
      avgR: string;
    }>;
    keyInsight: string;
    recommendation: string;
  };
}

export function SetupAnalytics({ data }: SetupAnalyticsProps) {
  if (!data?.distribution?.length) {
    return (
      <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">1️⃣ Setup → Result</h2>
        <p className="text-sm text-gray-500">
          Хангалттай мэдээлэл байхгүй байна.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-lg font-semibold">1️⃣ Setup → Result</h2>
      <p className="text-sm text-gray-500 mb-4">
        Setup score-оор бүлэглэсэн гүйцэтгэл
      </p>

      <div className="space-y-3">
        {data.distribution.map((item) => (
          <div key={item.range} className="flex items-center gap-4">
            <span className="w-16 text-sm font-medium">{item.range}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${parseFloat(item.winRate) >= 50 ? "bg-green-500" : "bg-red-500"}`}
                    style={{ width: `${item.winRate}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">
                  {item.winRate}%
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{item.count} trades</span>
                <span>Avg R: {item.avgR}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.keyInsight && (
        <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            💡 {data.keyInsight}
          </p>
          {data.recommendation && (
            <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
              📌 {data.recommendation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
