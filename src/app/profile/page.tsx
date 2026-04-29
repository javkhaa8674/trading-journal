// app/profile/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface TradingPreferences {
  favoritePairs: string[];
  experienceLevel: string;
  tradingStyle: string;
  defaultStopLoss: number;
  defaultTakeProfit: number;
}

interface NotificationSettings {
  emailNotifications: boolean;
  dailyReport: boolean;
  weeklyReport: boolean;
  monthlyReport: boolean;
  stopLossAlert: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tradingPrefs, setTradingPrefs] = useState<TradingPreferences>({
    favoritePairs: ["EUR/USD", "GBP/USD"],
    experienceLevel: "Intermediate",
    tradingStyle: "Day trading",
    defaultStopLoss: 2,
    defaultTakeProfit: 4,
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    dailyReport: true,
    weeklyReport: false,
    monthlyReport: false,
    stopLossAlert: true,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user email
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error("Хэрэглэгч олдсонгүй");

        setUserEmail(user.email || "");

        // Load avatar URL
        const { data: avatarData } = await supabase.storage
          .from("avatars")
          .getPublicUrl(`${user.id}/avatar.jpg`);

        // Check if avatar exists
        const { data: fileExists } = await supabase.storage
          .from("avatars")
          .list(`${user.id}/`);

        if (fileExists && fileExists.length > 0) {
          setAvatarUrl(avatarData.publicUrl);
        }

        // Load saved preferences from database
        const { data: preferences, error: prefError } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (prefError && prefError.code !== "PGRST116") {
          console.error("Error loading preferences:", prefError);
        }

        if (preferences) {
          setTradingPrefs(preferences.trading_preferences || tradingPrefs);
          setNotifications(preferences.notification_settings || notifications);
        }
      } catch (err: any) {
        console.error("Error fetching user data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Зөвхөн JPG, PNG, WEBP форматтай зураг оруулна уу");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Зургийн хэмжээ 2MB-с бага байх ёстой");
      return;
    }

    try {
      setUploadingAvatar(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("Хэрэглэгч олдсонгүй");

      // Upload avatar to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Delete old avatar if exists
      const { data: existingFiles } = await supabase.storage
        .from("avatars")
        .list(`${user.id}/`);

      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage
          .from("avatars")
          .remove(existingFiles.map((f) => `${user.id}/${f.name}`));
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrlData.publicUrl);

      // Update user metadata with avatar URL (optional)
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrlData.publicUrl },
      });
    } catch (err: any) {
      console.error("Error uploading avatar:", err);
      setError("Зураг оруулахад алдаа гарлаа: " + err.message);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm("Та профайл зургаа устгахдаа итгэлтэй байна уу?")) return;

    try {
      setUploadingAvatar(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("Хэрэглэгч олдсонгүй");

      // Delete avatar from storage
      const { data: existingFiles } = await supabase.storage
        .from("avatars")
        .list(`${user.id}/`);

      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage
          .from("avatars")
          .remove(existingFiles.map((f) => `${user.id}/${f.name}`));
      }

      setAvatarUrl(null);

      // Update user metadata
      await supabase.auth.updateUser({
        data: { avatar_url: null },
      });
    } catch (err: any) {
      console.error("Error deleting avatar:", err);
      setError("Зураг устгахад алдаа гарлаа");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("Хэрэглэгч олдсонгүй");

      // First, check if preferences exist
      const { data: existingPref, error: checkError } = await supabase
        .from("user_preferences")
        .select("id")
        .eq("user_id", user.id)
        .single();

      let result;

      if (existingPref) {
        // Update existing
        result = await supabase
          .from("user_preferences")
          .update({
            trading_preferences: tradingPrefs,
            notification_settings: notifications,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      } else {
        // Insert new
        result = await supabase.from("user_preferences").insert({
          user_id: user.id,
          trading_preferences: tradingPrefs,
          notification_settings: notifications,
        });
      }

      if (result.error) {
        console.error("Supabase error details:", result.error);
        throw new Error(result.error.message);
      }

      alert("Амжилттай хадгаллаа");
    } catch (err: any) {
      console.error("Error saving preferences:", err);
      setError(err.message || "Хадгалахад алдаа гарлаа");
      alert(`Хадгалахад алдаа гарлаа: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getUserInitial = () => {
    if (!userEmail) return "👤";
    return userEmail.charAt(0).toUpperCase();
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
          Профайл
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Хувийн мэдээлэл болон тохиргоо
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <p className="font-medium">Алдаа гарлаа:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Avatar & Email Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Профайл зураг
          </h2>

          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="relative">
              {avatarUrl ? (
                <div className="relative h-24 w-24 overflow-hidden rounded-full">
                  <Image
                    src={avatarUrl}
                    alt="Profile"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-4xl text-white shadow-lg">
                  {getUserInitial()}
                </div>
              )}

              {/* Upload button overlay */}
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                </div>
              )}
            </div>

            {/* Avatar actions */}
            <div className="flex-1 space-y-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {userEmail}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Хэрэглэгчийн имэйл хаяг
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer rounded-lg bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600"
                >
                  Зураг солих
                </label>

                {avatarUrl && (
                  <button
                    onClick={handleDeleteAvatar}
                    disabled={uploadingAvatar}
                    className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Устгах
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                JPG, PNG, WEBP формат. Хамгийн ихдээ 2MB.
              </p>
            </div>
          </div>
        </div>

        {/* Trading Preferences */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Арилжааны тохиргоо
          </h2>

          <div className="space-y-4">
            {/* Favorite Pairs */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Дуртай валютын хосууд
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  "EUR/USD",
                  "GBP/USD",
                  "USD/JPY",
                  "AUD/USD",
                  "USD/CAD",
                  "XAU/USD",
                ].map((pair) => (
                  <button
                    key={pair}
                    type="button"
                    onClick={() => {
                      if (tradingPrefs.favoritePairs.includes(pair)) {
                        setTradingPrefs({
                          ...tradingPrefs,
                          favoritePairs: tradingPrefs.favoritePairs.filter(
                            (p) => p !== pair,
                          ),
                        });
                      } else if (tradingPrefs.favoritePairs.length < 5) {
                        setTradingPrefs({
                          ...tradingPrefs,
                          favoritePairs: [...tradingPrefs.favoritePairs, pair],
                        });
                      }
                    }}
                    className={`rounded-full px-3 py-1 text-sm transition-colors ${
                      tradingPrefs.favoritePairs.includes(pair)
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {pair}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Та хамгийн ихдээ 5 хос сонгох боломжтой
              </p>
            </div>

            {/* Experience Level */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Арилжааны туршлага
              </label>
              <select
                value={tradingPrefs.experienceLevel}
                onChange={(e) =>
                  setTradingPrefs({
                    ...tradingPrefs,
                    experienceLevel: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 bg-white p-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="Beginner">Эхлэгч (1 жилээс бага)</option>
                <option value="Intermediate">Дунд шат (1-3 жил)</option>
                <option value="Advanced">Мэргэжлийн (3-5 жил)</option>
                <option value="Expert">Эксперт (5+ жил)</option>
              </select>
            </div>

            {/* Trading Style */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Арилжааны стиль
              </label>
              <select
                value={tradingPrefs.tradingStyle}
                onChange={(e) =>
                  setTradingPrefs({
                    ...tradingPrefs,
                    tradingStyle: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 bg-white p-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="Scalping">Scalping (минутын хугацаатай)</option>
                <option value="Day trading">
                  Day trading (өдрийн хугацаатай)
                </option>
                <option value="Swing trading">
                  Swing trading (хэдэн өдөр)
                </option>
                <option value="Position trading">
                  Position trading (удаан хугацаатай)
                </option>
              </select>
            </div>

            {/* Default Stop Loss & Take Profit */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Default Stop-Loss (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={tradingPrefs.defaultStopLoss}
                    onChange={(e) =>
                      setTradingPrefs({
                        ...tradingPrefs,
                        defaultStopLoss: parseFloat(e.target.value),
                      })
                    }
                    className="flex-1"
                  />
                  <span className="w-12 text-center text-gray-900 dark:text-white">
                    {tradingPrefs.defaultStopLoss}%
                  </span>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Default Take-Profit (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={tradingPrefs.defaultTakeProfit}
                    onChange={(e) =>
                      setTradingPrefs({
                        ...tradingPrefs,
                        defaultTakeProfit: parseFloat(e.target.value),
                      })
                    }
                    className="flex-1"
                  />
                  <span className="w-12 text-center text-gray-900 dark:text-white">
                    {tradingPrefs.defaultTakeProfit}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Мэдэгдлийн тохиргоо
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Имэйлээр мэдэгдэл
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Имэйл хаяг руу мэдэгдэл илгээх
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={notifications.emailNotifications}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      emailNotifications: e.target.checked,
                    })
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
                  Өдөр тутмын тайлан
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Өдөр бүр арилжааны гүйцэтгэлийн тайлан
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={notifications.dailyReport}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      dailyReport: e.target.checked,
                    })
                  }
                  className="peer sr-only"
                  disabled={!notifications.emailNotifications}
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-focus:outline-none peer-disabled:opacity-50 dark:bg-gray-700"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Долоо хоног тутмын тайлан
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Долоо хоног бүр арилжааны гүйцэтгэлийн тайлан
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={notifications.weeklyReport}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      weeklyReport: e.target.checked,
                    })
                  }
                  className="peer sr-only"
                  disabled={!notifications.emailNotifications}
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-focus:outline-none peer-disabled:opacity-50 dark:bg-gray-700"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Сарын арилжааны тайлан
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Сар бүр арилжааны гүйцэтгэлийн тайлан
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={notifications.monthlyReport}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      monthlyReport: e.target.checked,
                    })
                  }
                  className="peer sr-only"
                  disabled={!notifications.emailNotifications}
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-focus:outline-none peer-disabled:opacity-50 dark:bg-gray-700"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Stop-Loss хүрэх үед мэдэгдэл
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Stop-loss түвшинд хүрэх үед мэдэгдэл илгээх
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={notifications.stopLossAlert}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      stopLossAlert: e.target.checked,
                    })
                  }
                  className="peer sr-only"
                  disabled={!notifications.emailNotifications}
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-focus:outline-none peer-disabled:opacity-50 dark:bg-gray-700"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Буцах
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Хадгалж байна..." : "Хадгалах"}
          </button>
        </div>
      </div>
    </div>
  );
}
