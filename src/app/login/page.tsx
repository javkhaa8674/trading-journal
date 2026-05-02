"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import logo from "@/assets/logo.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError("");

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setResetLoading(false);

    if (error) {
      setResetError(error.message);
    } else {
      setResetSent(true);
    }
  };

  const backToLogin = () => {
    setResetMode(false);
    setResetSent(false);
    setResetEmail("");
    setResetError("");
  };

  // Reset password form
  if (resetMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-900">
          <div className="text-center">
            <div className="mb-3 flex justify-center">
              <Image src={logo} alt="Logo" width={60} height={60} priority />
            </div>
            <h1 className="text-2xl font-bold dark:text-white">
              Нууц үг сэргээх
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Имэйл хаягаа оруулаад илгээх товчийг дарна уу.
            </p>
          </div>

          {!resetSent ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium dark:text-gray-300 mb-1">
                  И-мэйл
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="your@email.com"
                  required
                />
              </div>

              {resetError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
                  {resetError}
                </div>
              )}

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full rounded-lg bg-blue-500 py-2 text-white font-medium hover:bg-blue-600 disabled:opacity-50"
              >
                {resetLoading ? "Илгээж байна..." : "Илгээх"}
              </button>

              <button
                type="button"
                onClick={backToLogin}
                className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                ← Нэвтрэх рүү буцах
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="rounded-lg bg-green-50 p-4 text-green-600 dark:bg-green-950/50 dark:text-green-400">
                <p className="font-medium">✓ Check your email</p>
                <p className="text-sm mt-1">
                  Бид нууц үг шинэчлэх холбоосыг илгээсэн{" "}
                  <strong>{resetEmail}</strong>
                </p>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Имэйл хүлээн аваагүй юу? Спам хавтасаа шалгах эсвэл дахин
                оролдоно уу.
              </p>
              <button
                onClick={backToLogin}
                className="mt-2 text-blue-500 hover:underline"
              >
                Нэвтрэх рүү буцах
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Login form
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-3 flex justify-center">
            <Image src={logo} alt="Logo" width={60} height={60} priority />
          </div>
          <h1 className="text-2xl font-bold dark:text-white">
            Арилжааны журнал
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Өөрийн бүртгэлд нэвтрэх
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium dark:text-gray-300 mb-1">
              И-мэйл
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300 mb-1">
              Нууц үг
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={() => setResetMode(true)}
              className="text-sm text-blue-500 hover:underline"
            >
              Нууц үг мартсан?
            </button>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-500 py-2 text-white font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Ачааллаж байна..." : "Нэвтрэх"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Бүртгэл байхгүй юу?{" "}
          <Link href="/register" className="text-blue-500 hover:underline">
            Бүртгүүлэх
          </Link>
        </p>
      </div>
    </div>
  );
}
