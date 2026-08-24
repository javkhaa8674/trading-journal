// src/components/analytics/BehaviorAnalytics.tsx

"use client";

interface BehaviorAnalyticsProps {
  data: {
    planAdherence: Array<{
      key: string;
      count: number;
      winRate: string;
      avgR: string;
    }>;
    earlyExitAnalysis: Array<{
      key: string;
      count: number;
      winRate: string;
      avgR: string;
    }>;
    slModification: Array<{
      key: string;
      count: number;
      winRate: string;
      avgR: string;
    }>;
    keyInsight: string;
    recommendation: string;
  };
}

export function BehaviorAnalytics({ data }: BehaviorAnalyticsProps) {
  // ✅ Нийт behavior-тэй trade-ийн тоог шалгах
  const totalBehaviorTrades =
    data?.planAdherence?.reduce((sum, item) => sum + item.count, 0) || 0;

  // ✅ Хамгийн багадаа 3 trade байх ёстой
  if (!data?.planAdherence?.length || totalBehaviorTrades < 3) {
    return (
      <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">3️⃣ Behavior → Result</h2>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 text-4xl">⚡</div>
          <p className="text-sm text-gray-500">
            Хангалттай зан төлөвийн мэдээлэл байхгүй байна.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Дор хаяж 3 trade-д behavior мэдээлэл бүртгэнэ үү.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Одоогоор {totalBehaviorTrades} trade бүртгэгдсэн байна.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-lg font-semibold">3️⃣ Behavior → Result</h2>
      <p className="text-sm text-gray-500 mb-4">
        Зан төлөвийн нөлөө ({totalBehaviorTrades} trade)
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Plan Adherence */}
        <div className="rounded-lg border p-3 dark:border-gray-700">
          <h3 className="text-sm font-medium mb-2">📋 Plan Adherence</h3>
          <div className="space-y-2">
            {data.planAdherence.map((item) => (
              <div key={item.key} className="flex justify-between text-sm">
                <span className="text-gray-500">{item.key}</span>
                <span
                  className={`font-medium ${parseFloat(item.winRate) >= 50 ? "text-green-600" : "text-red-600"}`}
                >
                  {item.winRate}% · {item.avgR}R ({item.count})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Early Exit */}
        {data.earlyExitAnalysis && data.earlyExitAnalysis.length > 0 && (
          <div className="rounded-lg border p-3 dark:border-gray-700">
            <h3 className="text-sm font-medium mb-2">🚪 Early Exit</h3>
            <div className="space-y-2">
              {data.earlyExitAnalysis.map((item) => (
                <div key={item.key} className="flex justify-between text-sm">
                  <span className="text-gray-500">{item.key}</span>
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

        {/* SL Modification */}
        {data.slModification && data.slModification.length > 0 && (
          <div className="rounded-lg border p-3 dark:border-gray-700">
            <h3 className="text-sm font-medium mb-2">🛑 SL Modification</h3>
            <div className="space-y-2">
              {data.slModification.map((item) => (
                <div key={item.key} className="flex justify-between text-sm">
                  <span className="text-gray-500">{item.key}</span>
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
      </div>

      <div className="mt-4 rounded-lg bg-orange-50 p-3 dark:bg-orange-950/30">
        <p className="text-sm text-orange-700 dark:text-orange-400">
          💡 {data.keyInsight}
        </p>
        {data.recommendation && (
          <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
            📌 {data.recommendation}
          </p>
        )}
      </div>
    </div>
  );
}
