"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { Trade } from "@/types/trade";
import TradeList from "@/app/components/trades/TradeList";

type Account = {
  id: string;
  name: string;
};

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");

  // -------------------------
  // LOAD ACCOUNTS
  // -------------------------
  useEffect(() => {
    const loadAccounts = async () => {
      const user = await getCurrentUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("accounts")
        .select("id, name")
        .eq("user_id", user.id);

      if (error) {
        console.log(error);
        return;
      }

      setAccounts(data || []);
    };

    loadAccounts();
  }, []);

  // -------------------------
  // LOAD TRADES (MAIN LOGIC)
  // -------------------------
  const loadTrades = async (selectedAccount?: string) => {
    const user = await getCurrentUser();
    if (!user) return;

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
      console.log(error);
      return;
    }

    setTrades(data || []);
  };

  // initial load
  useEffect(() => {
    loadTrades();
  }, []);

  const deleteTrade = async (tradeId: string) => {
    if (!confirm("Delete this trade?")) return;

    const user = await getCurrentUser();
    if (!user) return;

    // optimistic update
    setTrades((prev) => prev.filter((t) => t.id !== tradeId));

    const { error } = await supabase
      .from("trades")
      .delete()
      .eq("id", tradeId)
      .eq("user_id", user.id);

    if (error) {
      console.log(error);

      // rollback if failed
      loadTrades(accountId);
    }
  };

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Trades</h1>

        {/* ACCOUNT FILTER */}
        <select
          value={accountId}
          onChange={(e) => {
            const value = e.target.value;
            setAccountId(value);
            loadTrades(value);
          }}
          className="border px-3 py-2 rounded"
        >
          <option value="">All Accounts</option>

          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <TradeList trades={trades} onDelete={deleteTrade} />
    </div>
  );
}
