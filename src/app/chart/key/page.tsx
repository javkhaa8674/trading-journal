"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HelpTooltip } from "@/app/components/dashboard/HelpTooltip";
import { ApiKeyService } from "@/lib/apiKeyService";

export default function ApiKeyManagementPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingKey, setIsLoadingKey] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [keyStatus, setKeyStatus] = useState<{
    status: "active" | "expiring_soon" | "expired" | "not_found";
    daysRemaining?: number;
    expiresAt?: string | null;
    message?: string;
  } | null>(null);
  const [isKeySaved, setIsKeySaved] = useState(false);

  // Load existing API key
  useEffect(() => {
    const loadApiKey = async () => {
      setIsLoadingKey(true);
      try {
        const result = await ApiKeyService.getApiKey("itick");
        if (result.success && result.data) {
          setApiKey(result.data.api_key);
          if (result.data.expires_at) {
            setExpiresAt(result.data.expires_at.split("T")[0]);
          }
          setIsKeySaved(true);

          const status = await ApiKeyService.getKeyStatus("itick");
          setKeyStatus(status);
        } else {
          setIsKeySaved(false);
        }
      } catch (err) {
        console.error("Error loading API key:", err);
      } finally {
        setIsLoadingKey(false);
      }
    };

    loadApiKey();
  }, []);

  // Test API key
  const testApiKey = async (key: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `https://api.itick.org/v1/market/kline?symbol=EURUSD&interval=1h&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${key}`,
          },
        },
      );
      return response.ok;
    } catch {
      return false;
    }
  };

  // Save API key
  const handleSaveApiKey = async () => {
    if (apiKey.trim().length === 0) {
      setError("API key оруулна уу");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Test API key
      const isValid = await testApiKey(apiKey.trim());
      if (!isValid) {
        setError("API key хүчингүй байна. Зөв түлхүүр оруулна уу.");
        setIsLoading(false);
        return;
      }

      // Save with expire date
      const result = await ApiKeyService.saveApiKey(
        "itick",
        apiKey.trim(),
        expiresAt || null,
      );

      if (result.success) {
        setSuccess("✅ API key амжилттай хадгалагдлаа");
        setIsKeySaved(true);

        const status = await ApiKeyService.getKeyStatus("itick");
        setKeyStatus(status);

        // 2 секундын дараа chart хуудас руу буцах
        setTimeout(() => {
          router.push("/chart");
        }, 2000);
      } else {
        setError(result.error || "API key хадгалахад алдаа гарлаа");
      }
    } catch (err) {
      setError("API key хадгалахад алдаа гарлаа");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete API key
  const handleDeleteApiKey = async () => {
    if (!confirm("API key устгах уу?")) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await ApiKeyService.deleteApiKey("itick");
      if (result.success) {
        setSuccess("✅ API key амжилттай устгагдлаа");
        setIsKeySaved(false);
        setApiKey("");
        setExpiresAt("");
        setKeyStatus(null);
      } else {
        setError(result.error || "API key устгахад алдаа гарлаа");
      }
    } catch (err) {
      setError("API key устгахад алдаа гарлаа");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← Буцах
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          🔑 API Key удирдлага
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            iTick API түлхүүрээ удирдах хэсэг.
            <a
              href="https://itick.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline ml-1"
            >
              https://itick.org
            </a>
            -ээс үнэгүй бүртгүүлж API key авах
          </p>
        </div>

        {/* Key Status */}
        {isKeySaved && keyStatus && !isLoadingKey && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              keyStatus.status === "expired"
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700"
                : keyStatus.status === "expiring_soon"
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700"
                  : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {keyStatus.status === "expired" && "❌"}
                {keyStatus.status === "expiring_soon" && "⚠️"}
                {keyStatus.status === "active" && "✅"}
              </span>
              <div>
                <p
                  className={`font-medium ${
                    keyStatus.status === "expired"
                      ? "text-red-700 dark:text-red-300"
                      : keyStatus.status === "expiring_soon"
                        ? "text-yellow-700 dark:text-yellow-300"
                        : "text-green-700 dark:text-green-300"
                  }`}
                >
                  {keyStatus.message}
                </p>
                {keyStatus.daysRemaining !== undefined &&
                  keyStatus.daysRemaining > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {keyStatus.daysRemaining} хоног үлдсэн
                    </p>
                  )}
                {keyStatus.expiresAt && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Дуусах огноо:{" "}
                    {new Date(keyStatus.expiresAt).toLocaleDateString("mn-MN")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoadingKey && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin text-4xl">⏳</div>
          </div>
        )}

        {/* Form */}
        {!isLoadingKey && (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  🔑 API Key
                  <HelpTooltip
                    title="API Key"
                    description="iTick-ээс авсан API түлхүүрээ оруулна уу"
                    className="ml-1"
                  />
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="iTick API түлхүүрээ оруулна уу..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  📅 Хүчинтэй хугацаа (Expire Date)
                  <HelpTooltip
                    title="Хүчинтэй хугацаа"
                    description="API key-ийн хүчинтэй хугацаа. Хэрэв мэдэхгүй бол хоосон үлдээгээрэй."
                    className="ml-1"
                  />
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  💡 Хэрэв түлхүүрийн хүчинтэй хугацаа мэдэхгүй бол хоосон
                  үлдээгээрэй
                </p>
              </div>

              {/* Messages */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {success}
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSaveApiKey}
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? "⏳ Хадгалж байна..." : "💾 Хадгалах"}
                </button>

                {isKeySaved && (
                  <button
                    onClick={handleDeleteApiKey}
                    disabled={isLoading}
                    className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    🗑️ Устгах
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
        <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
          ℹ️ Мэдээлэл
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>
            • API key-г хадгалсны дараа Chart хуудас руу автоматаар шилжинэ
          </li>
          <li>
            • Хүчинтэй хугацаа оруулсан тохиолдолд хугацаа дуусахад автоматаар
            мэдэгдэнэ
          </li>
          <li>• Хугацаа дууссаны дараа шинэ түлхүүр оруулах шаардлагатай</li>
        </ul>
      </div>
    </div>
  );
}
