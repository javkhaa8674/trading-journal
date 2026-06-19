// src/app/brokers/new/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useBrokers } from "@/lib/hooks/useBrokers";
import { BrokerForm } from "@/app/components/brokers/BrokerForm";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// ✅ Default export - React Component
export default function NewBrokerPage() {
  const router = useRouter();
  const { addBroker } = useBrokers();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      setError(null);

      // Хэрэглэгч нэвтэрсэн эсэхийг шалгах
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error("Нэвтрэлтийн алдаа: " + userError.message);
      }

      if (!user) {
        throw new Error("Та нэвтрээгүй байна. Эхлээд нэвтрэх шаардлагатай.");
      }

      const result = await addBroker(data);

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push("/brokers");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

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
          ➕ Шинэ брокер нэмэх
        </h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          ❌ {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <BrokerForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          loading={loading}
          submitLabel="Брокер үүсгэх"
        />
      </div>
    </div>
  );
}
