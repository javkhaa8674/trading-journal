// src/app/brokers/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useBrokers } from "@/lib/hooks/useBrokers";
import { BrokerForm } from "@/app/components/brokers/BrokerForm";
import { Broker } from "@/types/broker";

// ✅ Default export - React Component
export default function EditBrokerPage() {
  const router = useRouter();
  const params = useParams();
  const brokerId = params.id as string;
  const { updateBroker, brokers } = useBrokers();

  const [broker, setBroker] = useState<Broker | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Брокерын мэдээллийг татах
  useEffect(() => {
    const fetchBroker = async () => {
      try {
        setLoading(true);
        setError(null);

        // Эхлээд hook-оос хайх
        const existing = brokers.find((b) => b.id === brokerId);
        if (existing) {
          setBroker(existing);
          setLoading(false);
          return;
        }

        // Хэрэв hook-д байхгүй бол шууд татах
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("brokers")
          .select("*")
          .eq("id", brokerId)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        if (!data) {
          throw new Error("Брокер олдсонгүй");
        }

        setBroker(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Алдаа гарлаа");
        console.error("Error fetching broker:", err);
      } finally {
        setLoading(false);
      }
    };

    if (brokerId) {
      fetchBroker();
    }
  }, [brokerId, brokers, router]);

  const handleSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      setError(null);

      const result = await updateBroker(brokerId, data);

      if (result.error) {
        setError(result.error);
        return;
      }

      // Амжилттай зассан бол брокерын жагсаалт руу буцах
      router.push("/brokers");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !broker) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
          <span className="text-4xl block mb-3">😕</span>
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
            Алдаа гарлаа
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {error || "Брокер олдсонгүй"}
          </p>
          <button
            onClick={() => router.push("/brokers")}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Брокерын жагсаалт руу буцах
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Буцах
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
          ✏️ Брокер засах: {broker.name}
        </h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          ❌ {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <BrokerForm
          initialData={broker}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          loading={submitting}
          submitLabel="Брокер засах"
        />
      </div>
    </div>
  );
}
