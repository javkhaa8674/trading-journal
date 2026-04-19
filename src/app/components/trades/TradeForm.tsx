"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAccounts } from "@/lib/hooks/useAccounts";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/getCurrentUser";

type BulkTrade = {
  symbol: string;
  type: string;
  entry_price: number;
  exit_price: number;
  lot_size: number;
  open_time: Date;
  close_time: Date;
  stop_loss: number;
  take_profit: number;
};

export default function TradeForm() {
  const accounts = useAccounts();
  const router = useRouter();

  const [accountId, setAccountId] = useState("");
  const [symbol, setSymbol] = useState("");
  const [type, setType] = useState("buy");
  const [entry, setEntry] = useState(0);
  const [exit, setExit] = useState(0);
  const [sl, setSl] = useState(0);
  const [tp, setTp] = useState(0);
  const [lot, setLot] = useState(0.1);

  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [profit, setProfit] = useState(0);
  // 📌 BULK INPUT
  const [bulkText, setBulkText] = useState("");

  // -------------------------
  // SINGLE TRADE SUBMIT
  // -------------------------
  const handleSubmit = async () => {
    const user = await getCurrentUser();

    if (!user) return alert("No user logged in");
    if (!accountId) return alert("Select account");
    if (!symbol) return alert("Enter symbol");

    const { error } = await supabase.from("trades").insert({
      user_id: user.id,
      account_id: accountId,
      symbol,
      type,
      entry_price: entry,
      exit_price: exit,
      profit,
      stop_loss: sl,
      take_profit: tp,
      lot_size: lot,
      open_time: openTime ? new Date(openTime) : new Date(),
      close_time: closeTime ? new Date(closeTime) : new Date(),
    });

    if (error) {
      console.log(error);
      alert("Error saving trade");
      return;
    }

    alert("Trade added!");

    setAccountId("");
    setSymbol("");
    setType("buy");
    setEntry(0);
    setExit(0);
    setSl(0);
    setTp(0);
    setLot(0.1);
    setOpenTime("");
    setCloseTime("");

    router.replace("/trades");
  };

  // -------------------------
  // BULK PARSER
  // -------------------------
  const parseTrades = (text: string) => {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        // 🔥 support comma, tab, or semicolon
        const parts = line.split(/[,;\t]/).map((p) => p.trim());

        if (parts.length < 5) {
          console.log("Invalid row:", line);
          return null;
        }

        const [
          symbol,
          type,
          entry,
          exit,
          lot,
          openTime,
          closeTime,
          sl,
          tp,
          profit,
        ] = parts;
        console.log("parts", parts);
        return {
          symbol,
          type,
          entry_price: Number(entry),
          exit_price: Number(exit),
          lot_size: Number(lot),
          open_time: openTime,
          close_time: closeTime,
          stop_loss: sl,
          take_profit: tp,
          profit: profit,
        };
      })
      .filter(Boolean);
  };

  // -------------------------
  // BULK SUBMIT
  // -------------------------
  const handleBulkSubmit = async () => {
    const user = await getCurrentUser();

    if (!user) return alert("No user logged in");
    if (!accountId) return alert("Select account");

    const trades = parseTrades(bulkText);

    if (trades.length === 0) {
      return alert("No valid trades found");
    }

    const formatted = trades.map((t) => ({
      user_id: user.id,
      account_id: accountId,
      symbol: t.symbol,
      type: t.type,
      entry_price: t.entry_price,
      exit_price: t.exit_price,
      profit: t.profit,
      lot_size: t.lot_size,
      open_time: t?.open_time,
      close_time: t?.close_time,
      stop_loss: t.stop_loss,
      take_profit: t?.take_profit,
    }));

    const { error } = await supabase.from("trades").insert(formatted);

    if (error) {
      console.log(error);
      alert("Bulk insert failed");
      return;
    }

    alert("Bulk trades saved!");

    setBulkText("");
    router.replace("/trades");
  };

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="max-w-2xl mx-auto p-6 border rounded-xl shadow space-y-4 bg-white">
      <h2 className="text-xl font-semibold">Add New Trade</h2>

      {/* ACCOUNT */}
      <select
        value={accountId}
        onChange={(e) => setAccountId(e.target.value)}
        className="w-full p-2 border rounded"
      >
        <option value="">Select Account</option>
        {accounts.map((acc) => (
          <option key={acc.id} value={acc.id}>
            {acc.name}
          </option>
        ))}
      </select>

      {/* SYMBOL + TYPE */}
      <div className="grid grid-cols-2 gap-2">
        <input
          placeholder="Symbol (EURUSD)"
          onChange={(e) => setSymbol(e.target.value)}
          className="p-2 border rounded"
        />

        <select
          onChange={(e) => setType(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>
      </div>

      {/* PRICES */}
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          placeholder="Entry"
          onChange={(e) => setEntry(+e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Exit"
          onChange={(e) => setExit(+e.target.value)}
          className="p-2 border rounded"
        />
      </div>

      <div className="grid grid-cols-4 gap-2">
        <input
          type="number"
          placeholder="SL"
          onChange={(e) => setSl(+e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="TP"
          onChange={(e) => setTp(+e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Lot"
          onChange={(e) => setLot(+e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Profit"
          onChange={(e) => setProfit(+e.target.value)}
          className="p-2 border rounded"
        />
      </div>

      {/* TIME */}
      <div className="grid grid-cols-2 gap-2">
        <input
          type="datetime-local"
          onChange={(e) => setOpenTime(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="datetime-local"
          onChange={(e) => setCloseTime(e.target.value)}
          className="p-2 border rounded"
        />
      </div>

      {/* SINGLE SUBMIT */}
      <button
        onClick={handleSubmit}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
      >
        Save Single Trade
      </button>

      <hr />

      {/* BULK INPUT */}
      <textarea
        placeholder="Paste bulk trades:
symbol	type	entry_price	exit_price	lot_size	open_time	close_time	stop_loss	take_profit	profit"
        value={bulkText}
        onChange={(e) => setBulkText(e.target.value)}
        className="w-full p-2 border rounded h-40"
      />

      {/* BULK SUBMIT */}
      <button
        onClick={handleBulkSubmit}
        className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700"
      >
        Bulk Save Trades
      </button>
    </div>
  );
}
