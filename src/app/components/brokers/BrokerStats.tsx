// src/app/components/brokers/BrokerStats.tsx
"use client";

import { useBrokers } from "@/lib/hooks/useBrokers";
import { useAccounts } from "@/lib/hooks/useAccounts";

export function BrokerStats() {
  const { brokers, loading: brokersLoading } = useBrokers();
  const accounts = useAccounts(); // Массив буцаана

  // Loading state
  if (brokersLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Safe calculation with null checks
  const stats = {
    totalBrokers: brokers?.length || 0,
    activeBrokers:
      brokers?.filter((b) =>
        accounts?.some(
          (a: any) => a.broker_id === b.id && a.status === "active",
        ),
      ).length || 0,
    totalBalance:
      accounts
        ?.filter((a: any) => a.broker_id)
        ?.reduce((sum: number, a: any) => sum + (Number(a.balance) || 0), 0) ||
      0,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <span className="text-xl">🏦</span>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Нийт брокер
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {stats.totalBrokers}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <span className="text-xl">📈</span>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Идэвхтэй брокер
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {stats.activeBrokers}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <span className="text-xl">💰</span>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Нийт үлдэгдэл
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              ${stats.totalBalance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
