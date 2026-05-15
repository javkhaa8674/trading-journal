"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { Trade } from "@/types/trade";
import TradeList from "@/app/components/trades/TradeList";
import { getStatusIcon } from "@/lib/utils/statusUtils";

type Account = {
  id: string;
  name: string;
  status: string;
  balance: number;
};

export default function TradesPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccount, setActiveAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load accounts
  // Load accounts
  useEffect(() => {
    const loadAccounts = async () => {
      const user = await getCurrentUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("accounts")
        .select("id, name, balance, status")
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
        return;
      }

      setAccounts(data || []);

      // Зөвхөн active status-тай account-уудыг шүүж эхнийхийг нь сонгох
      const activeAccounts =
        data?.filter((acc) => acc.status === "active") || [];
      if (activeAccounts.length > 0) {
        setActiveAccount(activeAccounts[0].id);
      }
    };

    loadAccounts();
  }, []);

  // Load trades
  const loadTrades = async () => {
    setLoading(true);
    setError(null);

    const user = await getCurrentUser();
    if (!user) {
      setLoading(false);
      return;
    }

    if (!activeAccount) {
      setTrades([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .eq("account_id", activeAccount)
      .order("close_time", { ascending: false });

    if (error) {
      console.error(error);
      setError(error.message);
      setTrades([]);
    } else {
      setTrades(data || []);
    }

    setLoading(false);
  };

  // Initial load - active account өөрчлөгдөхөд ачаална
  useEffect(() => {
    if (activeAccount) {
      loadTrades();
    }
  }, [activeAccount]);

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
      loadTrades();
      alert("Failed to delete trades. Please try again.");
    }
  };

  // Edit trade
  const editTrade = (tradeId: string) => {
    router.push(`/trades/${tradeId}`);
  };

  // Handle account change
  const handleAccountChange = async (value: string) => {
    setActiveAccount(value);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-2xl">📊</div>
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Арилжаанууд</h1>

        {/* Account Filter */}
        <select
          value={activeAccount || ""}
          onChange={(e) => handleAccountChange(e.target.value)}
          className={`rounded-lg border px-3 py-2 text-sm w-full sm:w-auto bg-white dark:bg-gray-800 dark:border-gray-700`}
        >
          {accounts
            .filter((acc) => acc.status === "active") // Зөвхөн active account-ууд
            .map((acc) => (
              <option key={acc.id} value={acc.id}>
                {getStatusIcon(acc.status)} {acc.name} - $
                {acc.balance.toLocaleString()}
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
