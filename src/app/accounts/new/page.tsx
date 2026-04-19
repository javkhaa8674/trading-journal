"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function CreateAccountPage() {
  const router = useRouter();

  const [user, setUser] = useState<unknown>(null);

  const [name, setName] = useState("");
  const [broker, setBroker] = useState("");
  const [mode, setMode] = useState("demo");
  const [balance, setBalance] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Get user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.replace("/login");
      } else {
        setUser(data.user);
        // 🔥 хамгийн сүүлд хэдэн account байгааг тоолно
        const { count } = await supabase
          .from("accounts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", data.user.id);

        setName(`Account ${Number(count ?? 0) + 1}`);
      }
    };

    getUser();
  }, [router]);

  // ✅ Submit
  const handleSubmit = async (e: unknown) => {
    e.preventDefault();

    setError("");

    if (!name || !broker) {
      setError("Name and broker required");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("accounts").insert({
      user_id: user?.id,
      name,
      broker,
      mode,
      balance: Number(balance),
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      router.push("/accounts");
    }
  };

  if (!user) return <p className="p-4">Loading...</p>;

  return (
    <div className="p-6 max-w-md space-y-4">
      <h1 className="text-xl font-bold">Create Account</h1>

      {error && <p className="text-red-500">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          placeholder="Account Name (FTMO, Personal)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2"
        />

        <input
          placeholder="Broker (IC Markets, Exness)"
          value={broker}
          onChange={(e) => setBroker(e.target.value)}
          className="w-full border p-2"
        />

        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="w-full border p-2"
        >
          <option value="demo">Demo</option>
          <option value="real">Real</option>
          <option value="backtest">Backtest</option>
          <option value="challenge1">Challenge Step 1</option>
          <option value="challenge2">Challenge Step 2</option>
        </select>

        <input
          placeholder="Balance"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className="w-full border p-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white p-2"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>
    </div>
  );
}
