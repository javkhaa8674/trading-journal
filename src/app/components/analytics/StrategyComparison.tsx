// src/components/analytics/StrategyComparison.tsx

"use client";

interface StrategyComparisonProps {
  data: Array<{
    id: string;
    name: string;
    count: number;
    winRate: string;
    avgR: string;
    totalPnl: number;
  }>;
}

export function StrategyComparison({ data }: StrategyComparisonProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-lg font-semibold">📊 Strategy Comparison</h2>
      <p className="text-sm text-gray-500 mb-4">
        Стратеги тус бүрийн гүйцэтгэлийн харьцуулалт
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="text-left py-2 px-3 font-medium text-gray-500">
                Strategy
              </th>
              <th className="text-center py-2 px-3 font-medium text-gray-500">
                Trades
              </th>
              <th className="text-center py-2 px-3 font-medium text-gray-500">
                Win Rate
              </th>
              <th className="text-center py-2 px-3 font-medium text-gray-500">
                Avg R
              </th>
              <th className="text-right py-2 px-3 font-medium text-gray-500">
                Total P&L
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((s) => (
              <tr
                key={s.id}
                className="border-b dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td className="py-2 px-3 font-medium">{s.name}</td>
                <td className="text-center py-2 px-3">{s.count}</td>
                <td
                  className={`text-center py-2 px-3 font-medium ${parseFloat(s.winRate) >= 50 ? "text-green-600" : "text-red-600"}`}
                >
                  {s.winRate}%
                </td>
                <td
                  className={`text-center py-2 px-3 font-medium ${parseFloat(s.avgR) >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {s.avgR}
                </td>
                <td
                  className={`text-right py-2 px-3 font-medium ${s.totalPnl >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {s.totalPnl >= 0 ? "+" : ""}${s.totalPnl.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
