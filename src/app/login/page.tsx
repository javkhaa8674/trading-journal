"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔐 Login
  const handleLogin = async () => {
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
    }
  };

  // 🆕 Register
  const handleSignup = async () => {
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      alert("Check your email to confirm your account");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-4 border p-6 rounded-xl">
        <h1 className="text-xl font-bold text-center">Trading Journal Login</h1>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Buttons */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-black text-white p-2"
        >
          {loading ? "Loading..." : "Login"}
        </button>

        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full border p-2"
        >
          Create Account
        </button>
      </div>
    </div>
  );
}
