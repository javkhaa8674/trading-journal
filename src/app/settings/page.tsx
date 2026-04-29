// app/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface PrivacySettings {
  profilePublic: boolean;
  showTradingAmounts: boolean;
  showPnL: boolean;
  showComments: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profilePublic: false,
    showTradingAmounts: true,
    showPnL: true,
    showComments: true,
  });

  useEffect(() => {
    const fetchPrivacySettings = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error("Хэрэглэгч олдсонгүй");

        // Load privacy settings from database
        const { data: settings, error: settingsError } = await supabase
          .from("user_privacy_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (settingsError && settingsError.code !== "PGRST116") {
          console.error("Error loading settings:", settingsError);
        }

        if (settings) {
          setPrivacy({
            profilePublic: settings.profile_public || false,
            showTradingAmounts: settings.show_trading_amounts !== false,
            showPnL: settings.show_pnl !== false,
            showComments: settings.show_comments !== false,
          });
        }
      } catch (err: any) {
        console.error("Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrivacySettings();
  }, []);

  const handleSavePrivacy = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Хэрэглэгч олдсонгүй");

      // Check if settings exist
      const { data: existing } = await supabase
        .from("user_privacy_settings")
        .select("id")
        .eq("user_id", user.id)
        .single();

      let result;

      if (existing) {
        result = await supabase
          .from("user_privacy_settings")
          .update({
            profile_public: privacy.profilePublic,
            show_trading_amounts: privacy.showTradingAmounts,
            show_pnl: privacy.showPnL,
            show_comments: privacy.showComments,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      } else {
        result = await supabase.from("user_privacy_settings").insert({
          user_id: user.id,
          profile_public: privacy.profilePublic,
          show_trading_amounts: privacy.showTradingAmounts,
          show_pnl: privacy.showPnL,
          show_comments: privacy.showComments,
        });
      }

      if (result.error) throw result.error;

      setSuccess("Нууцлалын тохиргоо амжилттай хадгаллаа");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error saving privacy:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Хэрэглэгч олдсонгүй");

      // Fetch all user data
      const [trades, accounts, deposits, withdrawals] = await Promise.all([
        supabase.from("trades").select("*").eq("user_id", user.id),
        supabase.from("accounts").select("*").eq("user_id", user.id),
        supabase.from("deposits").select("*").eq("user_id", user.id),
        supabase.from("withdrawals").select("*").eq("user_id", user.id),
      ]);

      const exportData = {
        user: {
          email: user.email,
          id: user.id,
        },
        trades: trades.data || [],
        accounts: accounts.data || [],
        deposits: deposits.data || [],
        withdrawals: withdrawals.data || [],
        exportDate: new Date().toISOString(),
      };

      // Create JSON file
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `trading_journal_export_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess("Өгөгдөл амжилттай экспортлогдлоо");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error exporting data:", err);
      setError("Экспортлоход алдаа гарлаа");
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Хэрэглэгч олдсонгүй");

      const { data: trades } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!trades || trades.length === 0) {
        setError("Экспортлох өгөгдөл байхгүй байна");
        return;
      }

      // Convert to CSV
      const headers = Object.keys(trades[0]);
      const csvRows = [
        headers.join(","),
        ...trades.map((row) =>
          headers
            .map((header) => {
              const value = row[header];
              if (value === null || value === undefined) return "";
              if (typeof value === "object")
                return JSON.stringify(value).replace(/,/g, ";");
              return String(value).replace(/,/g, ";");
            })
            .join(","),
        ),
      ];

      const csvString = csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `trades_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess("CSV файл амжилттай экспортлогдлоо");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error exporting CSV:", err);
      setError("CSV экспортлоход алдаа гарлаа");
    } finally {
      setExporting(false);
    }
  };

  const handleImportData = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setError(null);

      const text = await file.text();
      const importData = JSON.parse(text);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Хэрэглэгч олдсонгүй");

      // Validate import data
      if (!importData.trades || !Array.isArray(importData.trades)) {
        throw new Error("Буруу файлын формат");
      }

      // Import trades
      let importedCount = 0;
      for (const trade of importData.trades) {
        // Remove id to avoid conflicts
        delete trade.id;
        trade.user_id = user.id;

        const { error } = await supabase.from("trades").insert(trade);

        if (!error) importedCount++;
      }

      setSuccess(`${importedCount} арилжаа амжилттай импортлогдлоо`);
      setTimeout(() => setSuccess(null), 3000);

      // Reset file input
      event.target.value = "";
    } catch (err: any) {
      console.error("Error importing data:", err);
      setError("Импортлоход алдаа гарлаа: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Уншиж байна...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Тохиргоо
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Өгөгдлийн удирдлага болон нууцлалын тохиргоо
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <p className="text-sm">{success}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Export Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            📤 Өгөгдөл экспортлох
          </h2>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Таны бүх арилжаа, данс, хадгаламж, татан авалтын өгөгдлийг
            экспортлох
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span>Экспортлож байна...</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  <span>JSON экспорт</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              <span>CSV экспорт (Зөвхөн арилжаа)</span>
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            📥 Өгөгдөл импортлох
          </h2>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            JSON файлаас арилжааны өгөгдөл импортлох (өмнөх экспортын файл)
          </p>
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              disabled={importing}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-blue-900/20 dark:file:text-blue-400"
            />
            {importing && (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Импортлож байна...
              </div>
            )}
          </div>
          <div className="mt-3 rounded-md bg-yellow-50 p-3 dark:bg-yellow-900/20">
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              ⚠️ Анхааруулга: Импортлох үед давхардсан өгөгдөл үүсэх боломжтой.
              Импорт хийхээс өмнө backup хийхийг зөвлөж байна.
            </p>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            🔒 Нууцлалын тохиргоо
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Профайлыг нээлттэй болгох
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Бусад хэрэглэгчид таны профайлыг харах боломжтой
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={privacy.profilePublic}
                  onChange={(e) =>
                    setPrivacy({ ...privacy, profilePublic: e.target.checked })
                  }
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-focus:outline-none dark:bg-gray-700"></div>
              </label>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Арилжааны дүнг харуулах
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Арилжааны хэмжээ (volume) -г харуулах
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={privacy.showTradingAmounts}
                  onChange={(e) =>
                    setPrivacy({
                      ...privacy,
                      showTradingAmounts: e.target.checked,
                    })
                  }
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-focus:outline-none dark:bg-gray-700"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Ашиг/Алдагдлыг харуулах
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  P&amp;L (Profit & Loss) -г харуулах
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={privacy.showPnL}
                  onChange={(e) =>
                    setPrivacy({ ...privacy, showPnL: e.target.checked })
                  }
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-focus:outline-none dark:bg-gray-700"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Комментарийг харуулах
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Арилжааны тэмдэглэлийг олон нийтэд харуулах
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={privacy.showComments}
                  onChange={(e) =>
                    setPrivacy({ ...privacy, showComments: e.target.checked })
                  }
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-focus:outline-none dark:bg-gray-700"></div>
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSavePrivacy}
              disabled={saving}
              className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
            >
              {saving ? "Хадгалж байна..." : "Хадгалах"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
