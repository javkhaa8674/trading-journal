"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import TradeList from "@/app/components/trades/TradeList";
import { getStatusIcon } from "@/lib/utils/statusUtils";
import { TradingChart } from "@/app/components/chart/TradingChart";
import { useTrades } from "@/lib/hooks/useTrades";

type Account = {
  id: string;
  name: string;
  status: string;
  balance: number;
};

export default function TradesPage() {
  const router = useRouter();

  const [accounts, setAccounts] = useState<Account[]>([]);

  const [activeAccount, setActiveAccount] = useState<string | null>(null);

  const [showChart, setShowChart] = useState(true);

  /*
   * NEW:
   *
   * TradeList дээрээс Chart товч дарахад
   * тухайн trade-ийн ID энд хадгалагдана.
   */
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);

  /*
   * Chart хэсэг рүү scroll хийхэд ашиглана.
   */
  const chartSectionRef = useRef<HTMLDivElement>(null);

  const { trades, loading, error, deleteTrade, refresh } = useTrades(
    activeAccount || undefined,
  );

  /* =====================================================
     LOAD ACCOUNTS
  ===================================================== */

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

      const activeAccounts =
        data?.filter((acc) => acc.status === "active") || [];

      if (activeAccounts.length > 0) {
        setActiveAccount(activeAccounts[0].id);
      }
    };

    loadAccounts();
  }, []);

  /* =====================================================
     ACCOUNT CHANGE
  ===================================================== */

  const handleAccountChange = async (value: string) => {
    setActiveAccount(value);

    /*
     * Account солигдоход өмнөх
     * selected trade-ийг арилгана.
     */
    setSelectedTradeId(null);
  };

  /* =====================================================
     CHART TRADE
  ===================================================== */

  const handleChartTrade = (tradeId: string) => {
    /*
     * Chart-ийг нээх
     */
    setShowChart(true);

    /*
     * Яг сонгосон trade
     */
    setSelectedTradeId(tradeId);

    /*
     * React state update хийсний
     * дараа chart хэсэг рүү scroll хийнэ.
     */
    requestAnimationFrame(() => {
      chartSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  /* =====================================================
     DELETE TRADE
  ===================================================== */

  const handleDeleteTrade = async (tradeId: string) => {
    await deleteTrade(tradeId);

    /*
     * Хэрэв chart дээр
     * устгасан trade байсан бол
     * selection-ийг цэвэрлэнэ.
     */
    if (selectedTradeId === tradeId) {
      setSelectedTradeId(null);
    }
  };

  /* =====================================================
     DELETE MULTIPLE
  ===================================================== */

  const handleDeleteTrades = async (tradeIds: string[]) => {
    for (const id of tradeIds) {
      await deleteTrade(id);
    }

    if (selectedTradeId && tradeIds.includes(selectedTradeId)) {
      setSelectedTradeId(null);
    }
  };

  /* =====================================================
     EDIT TRADE
  ===================================================== */

  const editTrade = (tradeId: string) => {
    router.push(`/trades/${tradeId}`);
  };

  /* =====================================================
     LOADING
  ===================================================== */

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

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="space-y-4">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold">📊 Арилжаанууд</h1>

          {/* Chart Toggle Button */}

          <button
            onClick={() => setShowChart(!showChart)}
            className="px-3 py-1.5 text-sm rounded-lg transition-colors bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600"
          >
            {showChart ? "📈 Chart нуух" : "📈 Chart харуулах"}
          </button>

          {/* Refresh Button */}

          <button
            onClick={refresh}
            className="px-3 py-1.5 text-sm rounded-lg transition-colors bg-blue-700 hover:bg-blue-600 text-gray-200 border border-blue-600"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Account Filter */}

        <select
          value={activeAccount || ""}
          onChange={(e) => handleAccountChange(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm w-full sm:w-auto bg-white dark:bg-gray-800 dark:border-gray-700"
        >
          {accounts
            .filter((acc) => acc.status === "active")
            .map((acc) => (
              <option key={acc.id} value={acc.id}>
                {getStatusIcon(acc.status)} {acc.name} - $
                {acc.balance.toLocaleString()}
              </option>
            ))}
        </select>
      </div>

      {/* =================================================
          CHART SECTION
      ================================================= */}

      {showChart && (
        <div
          ref={chartSectionRef}
          className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden"
        >
          <TradingChart
            trades={trades}
            loading={loading}
            selectedAccountId={activeAccount}
            selectedTradeId={selectedTradeId}
          />
        </div>
      )}

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          Error: {error}
        </div>
      )}

      {/* =================================================
          TRADE LIST
      ================================================= */}

      <TradeList
        trades={trades.map((t) => ({
          ...t,
          open_time: t.open_time?.toString() || "",
          close_time: t.close_time?.toString() || "",
        }))}
        onDelete={handleDeleteTrades}
        onEdit={editTrade}
        onChart={handleChartTrade}
      />
    </div>
  );
}
