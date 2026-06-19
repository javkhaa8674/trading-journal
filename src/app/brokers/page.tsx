// src/app/brokers/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useBrokers } from "@/lib/hooks/useBrokers";
import { BrokerList } from "@/app/components/brokers/BrokerList";
import { BrokerStats } from "@/app/components/brokers/BrokerStats";

export default function BrokersPage() {
  const { brokers, loading, deleteBroker } = useBrokers();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Энэ брокерыг устгах уу?")) return;

    try {
      setError(null);
      await deleteBroker(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          📊 Брокерууд
        </h1>
        <Link
          href="/brokers/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
        >
          <span>➕</span>
          Шинэ брокер
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Stats */}
      <BrokerStats />

      {/* List */}
      <div className="mt-6">
        <BrokerList
          brokers={brokers}
          onEdit={(broker) => {
            window.location.href = `/brokers/${broker.id}`;
          }}
          onDelete={handleDelete}
          loading={loading}
        />
      </div>
    </div>
  );
}
