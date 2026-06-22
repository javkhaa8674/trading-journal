// src/app/components/brokers/BrokerForm.tsx
"use client";

import { useState } from "react";
import { Broker, BrokerFormData } from "@/types/broker";

interface BrokerFormProps {
  initialData?: Broker | null;
  onSubmit: (data: BrokerFormData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  submitLabel?: string;
}

export function BrokerForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = "Хадгалах",
}: BrokerFormProps) {
  const [formData, setFormData] = useState<BrokerFormData>({
    name: initialData?.name || "",
    logo_url: initialData?.logo_url || "",
    leverage: initialData?.leverage || "",
    website: initialData?.website || "",
    description: initialData?.description || "",
    is_default: initialData?.is_default || false,
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(
    initialData?.logo_url || null,
  );

  const leverageOptions = [
    "1:10",
    "1:20",
    "1:30",
    "1:50",
    "1:100",
    "1:200",
    "1:300",
    "1:400",
    "1:500",
    "1:1000",
    "1:2000",
    "1:3000",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData({ ...formData, logo_url: url });
    setLogoPreview(url);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Брокерын нэр <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
          placeholder="Жишээ: IC Markets"
          required
          disabled={loading}
        />
      </div>

      {/* Logo URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Лого зураг (URL)
        </label>
        <div className="flex gap-3">
          <input
            type="url"
            value={formData.logo_url || ""}
            onChange={handleLogoChange}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            placeholder="https://example.com/logo.png"
            disabled={loading}
          />
          {logoPreview && (
            <div className="flex items-center">
              <img
                src={logoPreview}
                alt="Logo preview"
                className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                onError={() => setLogoPreview(null)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Leverage */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Хөшүүрэг
        </label>
        <select
          value={formData.leverage || ""}
          onChange={(e) =>
            setFormData({ ...formData, leverage: e.target.value || undefined })
          }
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
          disabled={loading}
        >
          <option value="">Сонгох</option>
          {leverageOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Website */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Вэбсайт
        </label>
        <input
          type="url"
          value={formData.website || ""}
          onChange={(e) =>
            setFormData({ ...formData, website: e.target.value || undefined })
          }
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
          placeholder="https://broker.com"
          disabled={loading}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Тайлбар
        </label>
        <textarea
          value={formData.description || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              description: e.target.value || undefined,
            })
          }
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-colors resize-none"
          rows={3}
          placeholder="Брокерын тухай дэлгэрэнгүй..."
          disabled={loading}
        />
      </div>

      {/* Default checkbox */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.is_default}
          onChange={(e) =>
            setFormData({ ...formData, is_default: e.target.checked })
          }
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          disabled={loading}
        />
        <label className="text-sm text-gray-700 dark:text-gray-300">
          ⭐ Анхдагч брокер болгох
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || !formData.name.trim()}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin">⟳</span>
              Хадгалах...
            </>
          ) : (
            `💾 ${submitLabel}`
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
          >
            ❌ Цуцлах
          </button>
        )}
      </div>
    </form>
  );
}
