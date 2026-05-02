"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import logo from "@/assets/logo.png";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // app/register/page.tsx
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      // ✅ Hook-оос буцаасан алдааны мессежийг монгол хэлээр харуулах
      if (
        error.message.includes("Зөвшөөрөхгүй") ||
        error.message.includes("Таны имэйл хаяг бүртгүүлэх эрхгүй байна.")
      ) {
        setError(
          "✉️ Таны имэйл хаяг бүртгүүлэх эрхгүй байна. Админ-аас зөвшөөрөл аваарай.",
        );
      } else if (error.message.includes("User already registered")) {
        setError("👤 Энэ имэйл хаяг аль хэдийн бүртгүүлсэн байна.");
      } else if (error.message.includes("Password")) {
        setError(
          "🔒 Нууц үг хангалттай нууцлалтай биш байна (хамгийн багадаа 6 тэмдэгт)",
        );
      } else {
        setError(`❌ Алдаа гарлаа: ${error.message}`);
      }
    } else {
      alert("✅ Бүртгэл амжилттай үүслээ!");
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-3 flex justify-center">
            <Image src={logo} alt="Logo" width={60} height={60} priority />
          </div>
          <h1 className="text-2xl font-bold">Бүртгэл үүсгэх</h1>
          <p className="text-sm text-gray-500 mt-1">Арилжаагаа хянаж эхэл</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">И-мэйл</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Нууц үг</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Нууц үг давтан оруулах
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-500 py-2 text-white font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Бүртгэл үүсгэж байна..." : "Бүртгүүлэх"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Та аль хэдийн бүртгэлтэй юу?{" "}
          <Link href="/login" className="text-blue-500 hover:underline">
            Нэвтрэх
          </Link>
        </p>
      </div>
    </div>
  );
}
