// src/components/analytics/PsychologyAnalytics.tsx

"use client";

interface PsychologyAnalyticsProps {
  data: {
    fomoAnalysis: {
      fomo: { count: number; winRate: string; avgR: string };
      noFomo: { count: number; winRate: string; avgR: string };
    };
    calmnessImpact: Array<{
      level: number;
      count: number;
      winRate: string;
      avgR: string;
    }>;
    anxietyImpact: Array<{
      level: number;
      count: number;
      winRate: string;
      avgR: string;
    }>;
    confidenceImpact?: Array<{
      level: number;
      count: number;
      winRate: string;
      avgR: string;
    }>;
    fearImpact?: Array<{
      level: number;
      count: number;
      winRate: string;
      avgR: string;
    }>;
    greedImpact?: Array<{
      level: number;
      count: number;
      winRate: string;
      avgR: string;
    }>;
    frustrationImpact?: Array<{
      level: number;
      count: number;
      winRate: string;
      avgR: string;
    }>;
    keyInsight: string;
    recommendation: string;
  };
}

export function PsychologyAnalytics({ data }: PsychologyAnalyticsProps) {
  // ✅ Хангалттай мэдээлэл байгаа эсэхийг шалгах
  const totalFomoTrades =
    (data?.fomoAnalysis?.fomo?.count || 0) +
    (data?.fomoAnalysis?.noFomo?.count || 0);

  if (!data?.fomoAnalysis || totalFomoTrades < 3) {
    return (
      <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">2️⃣ Psychology → Result</h2>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 text-4xl">🧠</div>
          <p className="text-sm text-gray-500">
            Хангалттай сэтгэл зүйн мэдээлэл байхгүй байна.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Дор хаяж 3 trade-д psychology мэдээлэл бүртгэнэ үү.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Одоогоор {totalFomoTrades} trade бүртгэгдсэн байна.
          </p>
        </div>
      </div>
    );
  }

  const { fomo, noFomo } = data.fomoAnalysis;

  return (
    <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-lg font-semibold">2️⃣ Psychology → Result</h2>
      <p className="text-sm text-gray-500 mb-4">
        Сэтгэл зүйн төлөвийн нөлөө ({totalFomoTrades} trade)
      </p>

      {/* FOMO Analysis */}
      <div className="rounded-lg border p-3 dark:border-gray-700 mb-4">
        <h3 className="text-sm font-medium mb-2">🧠 FOMO Analysis</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">FOMO-той</span>
            <span className="text-sm font-medium text-red-600">
              {fomo.count} trades · {fomo.winRate}% · {fomo.avgR}R
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">FOMO-гүй</span>
            <span className="text-sm font-medium text-green-600">
              {noFomo.count} trades · {noFomo.winRate}% · {noFomo.avgR}R
            </span>
          </div>
        </div>
      </div>

      {/* Calmness Impact */}
      {data.calmnessImpact && data.calmnessImpact.length > 0 && (
        <div className="rounded-lg border p-3 dark:border-gray-700 mb-4">
          <h3 className="text-sm font-medium mb-2">😌 Calmness Impact</h3>
          <div className="space-y-1">
            {data.calmnessImpact.map((item) => (
              <div key={item.level} className="flex justify-between text-sm">
                <span className="text-gray-500">Level {item.level}</span>
                <span
                  className={`font-medium ${parseFloat(item.winRate) >= 50 ? "text-green-600" : "text-red-600"}`}
                >
                  {item.winRate}% · {item.avgR}R ({item.count})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insight */}
      <div className="mt-4 rounded-lg bg-purple-50 p-3 dark:bg-purple-950/30">
        <p className="text-sm text-purple-700 dark:text-purple-400">
          💡 {data.keyInsight}
        </p>
        {data.recommendation && (
          <p className="text-sm text-purple-600 dark:text-purple-300 mt-1">
            📌 {data.recommendation}
          </p>
        )}
      </div>
    </div>
  );
}
