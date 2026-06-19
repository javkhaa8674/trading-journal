// src/app/components/brokers/BrokerList.tsx
"use client";

import Link from "next/link";
import { Broker } from "@/types/broker";

interface BrokerListProps {
  brokers: Broker[];
  onEdit?: (broker: Broker) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

// ✅ Named export - ЗӨВ
export function BrokerList({
  brokers,
  onEdit,
  onDelete,
  loading = false,
}: BrokerListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (brokers.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <span className="text-5xl block mb-3">🏢</span>
        <p className="text-gray-500 dark:text-gray-400">
          Брокер бүртгэгдээгүй байна
        </p>
        <Link
          href="/brokers/new"
          className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          ➕ Эхний брокер нэмэх
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {brokers.map((broker) => (
        <div
          key={broker.id}
          className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all hover:border-blue-300 dark:hover:border-blue-700"
        >
          <div className="flex items-start justify-between">
            <Link
              href={`/brokers/${broker.id}`}
              className="flex items-center gap-3 min-w-0 flex-1"
            >
              {broker.logo_url ? (
                <img
                  src={broker.logo_url}
                  alt={broker.name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-gray-200 dark:border-gray-600"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "";
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {broker.name[0]}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {broker.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {broker.leverage && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                      {broker.leverage}
                    </span>
                  )}
                  {broker.is_default && (
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded">
                      ⭐ Default
                    </span>
                  )}
                </div>
              </div>
            </Link>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {broker.website && (
                <a
                  href={broker.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Вэбсайт"
                >
                  <span className="text-gray-500 dark:text-gray-400">🔗</span>
                </a>
              )}
              <Link
                href={`/brokers/${broker.id}`}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Засах"
              >
                <span className="text-blue-500">✏️</span>
              </Link>
              <button
                onClick={() => onDelete(broker.id)}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Устгах"
              >
                <span className="text-red-500">🗑️</span>
              </button>
            </div>
          </div>

          {broker.description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {broker.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
