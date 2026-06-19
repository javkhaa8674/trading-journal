// src/app/accounts/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import Link from "next/link";

type Broker = {
  id: string;
  name: string;
  logo_url?: string | null;
  leverage?: string | null;
  website?: string | null;
  is_default?: boolean;
};

export default function CreateAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [brokersLoading, setBrokersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    broker_id: "",
    broker_name: "",
    mode: "demo",
    balance: 10000,
    status: "active",
  });

  // Брокеруудыг татах
  useEffect(() => {
    const fetchBrokers = async () => {
      try {
        setBrokersLoading(true);
        const user = await getCurrentUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("brokers")
          .select("id, name, logo_url, leverage, website, is_default")
          .eq("user_id", user.id)
          .order("is_default", { ascending: false })
          .order("name", { ascending: true });

        if (error) throw error;
        setBrokers(data || []);

        // Анхдагч брокер сонгох
        const defaultBroker = data?.find((b) => b.is_default);
        if (defaultBroker) {
          setFormData((prev) => ({
            ...prev,
            broker_id: defaultBroker.id,
            broker_name: defaultBroker.name,
          }));
        }
      } catch (err) {
        console.error("Error fetching brokers:", err);
      } finally {
        setBrokersLoading(false);
      }
    };

    fetchBrokers();
  }, [router]);

  // Generate account name automatically
  const generateAccountName = () => {
    const timestamp = new Date().toLocaleString();
    const modeText = formData.mode;
    const brokerName = formData.broker_name || "Брокергүй";
    return `${brokerName} ${modeText} $${formData.balance.toLocaleString()} ${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const user = await getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // Сонгосон брокерын мэдээлэл
    const selectedBroker = brokers.find((b) => b.id === formData.broker_id);
    const brokerName =
      selectedBroker?.name || formData.broker_name || "Брокергүй";

    const accountName = generateAccountName();

    const { error: insertError } = await supabase.from("accounts").insert({
      name: accountName,
      broker: brokerName,
      broker_id: formData.broker_id || null,
      mode: formData.mode,
      balance: formData.balance,
      status: formData.status,
      start_balance: formData.balance,
      user_id: user.id,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
    } else {
      router.push("/accounts");
    }
  };

  // Preview account name
  const previewName = formData.broker_name ? generateAccountName() : "";

  // Get selected broker
  const selectedBroker = brokers.find((b) => b.id === formData.broker_id);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">
        📊 Шинэ данс үүсгэх
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Broker Select */}
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">
            Брокер сонгох *
          </label>

          {brokersLoading ? (
            <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mt-1"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Broker dropdown */}
              <select
                value={formData.broker_id}
                onChange={(e) => {
                  const brokerId = e.target.value;
                  const broker = brokers.find((b) => b.id === brokerId);
                  setFormData({
                    ...formData,
                    broker_id: brokerId,
                    broker_name: broker?.name || "",
                  });
                }}
                className="w-full rounded-lg border p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                required
              >
                <option value="">Брокер сонгох</option>
                {brokers.map((broker) => (
                  <option key={broker.id} value={broker.id}>
                    {broker.name}{" "}
                    {broker.leverage ? `(${broker.leverage})` : ""}{" "}
                    {broker.is_default ? "⭐" : ""}
                  </option>
                ))}
              </select>

              {/* Selected broker info */}
              {selectedBroker && (
                <div className="flex items-center gap-3 p-3 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  {selectedBroker.logo_url ? (
                    <img
                      src={selectedBroker.logo_url}
                      alt={selectedBroker.name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                      {selectedBroker.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedBroker.name}
                      </span>
                      {selectedBroker.is_default && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded">
                          ⭐ Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {selectedBroker.leverage && (
                        <span>Хөшүүрэг: {selectedBroker.leverage}</span>
                      )}
                      {selectedBroker.website && (
                        <a
                          href={selectedBroker.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          🔗 Вэбсайт
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Add new broker link */}
              <Link
                href="/brokers/new"
                className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span>➕</span> Шинэ брокер нэмэх
              </Link>
            </div>
          )}
        </div>

        {/* Mode */}
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">
            Төрөл *
          </label>
          <select
            value={formData.mode}
            onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
            className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="demo">💻 Demo</option>
            <option value="live">💰 Live</option>
            <option value="backtest">📊 Backtest</option>
            <option value="challengeStep1">🚀 Challenge Step 1</option>
            <option value="challengeStep2">🚀 Challenge Step 2</option>
            <option value="highStakeStep1">🏔️ HighStake Step 1</option>
            <option value="highStakeStep2">🏔️ HighStake Step 2</option>
            <option value="bootcampStep1">🏕️ Bootcamp Step 1</option>
            <option value="bootcampStep2">🏕️ Bootcamp Step 2</option>
            <option value="bootcampStep3">🏕️ Bootcamp Step 3</option>
            <option value="funded">🏆 Funded</option>
          </select>
        </div>

        {/* Balance */}
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">
            Эхлэлийн баланс ($) *
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.balance}
            onChange={(e) =>
              setFormData({
                ...formData,
                balance: parseFloat(e.target.value) || 0,
              })
            }
            className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            placeholder="10000"
            required
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">
            Төлөв
          </label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="active">🟢 Active</option>
            <option value="achieved">🟡 Achieved</option>
            <option value="closed">🔴 Closed</option>
          </select>
        </div>

        {/* Preview Account Name */}
        {previewName && (
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30 dark:border dark:border-blue-800/50">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Дансны нэр харагдах байдал:
            </p>
            <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
              {previewName}
            </p>
            <p className="mt-2 text-xs text-blue-500 dark:text-blue-400/70">
              ℹ️ Дансны нэр автоматаар дараах байдлаар үүсгэгдэх болно: Брокер +
              Горим + Үлдэгдэл + Цагийн тэмдэг
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
            ❌ Алдаа: {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push("/accounts")}
            className="rounded-lg border px-4 py-2 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            Цуцлах
          </button>
          <button
            type="submit"
            disabled={loading || !formData.broker_id || brokersLoading}
            className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Үүсгэж байна..." : "💾 Данс үүсгэх"}
          </button>
        </div>
      </form>
    </div>
  );
}
