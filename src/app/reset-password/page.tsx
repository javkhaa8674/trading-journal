"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if we have a valid session from reset link
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      }
    };
    checkSession();
  }, [router]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-900">
        <div className="text-center">
          <div className="text-4xl mb-2">🔐</div>
          <h1 className="text-2xl font-bold">Шинэ нууц үг тохируулах</h1>
          <p className="text-sm text-gray-500 mt-1">
            Шинэ нууц үгийг доор оруулна уу.
          </p>
        </div>

        {!success ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Нууц үг</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
                minLength={6}
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
              {loading ? "Шинэчлэж байна..." : "Нууц үг шинэчлэх"}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="rounded-lg bg-green-50 p-4 text-green-600">
              <p className="font-medium">✓ Нууц үг шинэчлэгдсэн!</p>
              <p className="text-sm mt-1">
                Таны нууц үг амжилттай өөрчлөгдсөн.
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Нэвтрэх хуудас руу дахин чиглүүлж байна...
            </p>
          </div>
        )}

        <p className="text-center text-sm text-gray-500">
          <button
            onClick={() => router.push("/login")}
            className="text-blue-500 hover:underline"
          >
            ← Нэвтрэх рүү буцах
          </button>
        </p>
      </div>
    </div>
  );
}
