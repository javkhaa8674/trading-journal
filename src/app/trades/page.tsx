"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { Trade } from "@/types/trade";
import TradeList from "@/app/components/trades/TradeList";

type Account = {
  id: string;
  name: string;
};

export default function TradesPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load accounts
  useEffect(() => {
    const loadAccounts = async () => {
      const user = await getCurrentUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("accounts")
        .select("id, name")
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
        return;
      }

      setAccounts(data || []);
    };

    loadAccounts();
  }, []);

  // Load trades
  const loadTrades = async (selectedAccount?: string) => {
    setLoading(true);
    setError(null);

    const user = await getCurrentUser();
    if (!user) {
      setLoading(false);
      return;
    }

    let query = supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .order("close_time", { ascending: false });

    if (selectedAccount) {
      query = query.eq("account_id", selectedAccount);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      setError(error.message);
      setTrades([]);
    } else {
      setTrades(data || []);
    }

    setLoading(false);
  };

  // Initial load
  useEffect(() => {
    loadTrades();
  }, []);

  // Delete multiple trades (single or bulk)
  const deleteTrades = async (tradeIds: string[]) => {
    const user = await getCurrentUser();
    if (!user) return;

    // Optimistic update
    setTrades((prev) => prev.filter((t) => !tradeIds.includes(t.id)));

    const { error } = await supabase
      .from("trades")
      .delete()
      .in("id", tradeIds)
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      loadTrades(accountId);
      alert("Failed to delete trades. Please try again.");
    }
  };

  // Edit trade
  const editTrade = (tradeId: string) => {
    router.push(`/trades/${tradeId}`);
  };

  // Handle account filter change
  const handleAccountChange = async (value: string) => {
    setAccountId(value);
    await loadTrades(value);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-2xl">📊</div>
          <div className="text-gray-500">Loading trades...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Trades</h1>

        {/* Account Filter */}
        <select
          value={accountId}
          onChange={(e) => handleAccountChange(e.target.value)}
          className="rounded-lg border px-4 py-2 text-sm"
        >
          <option value="">All Accounts</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          Error: {error}
        </div>
      )}

      {/* Trade List Table */}
      <TradeList
        trades={trades.map((t) => ({
          ...t,
          open_time: t.open_time?.toString() || "",
          close_time: t.close_time?.toString() || "",
        }))}
        onDelete={deleteTrades}
        onEdit={editTrade}
      />
    </div>
  );
}
