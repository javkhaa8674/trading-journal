"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import TradeChecklist from "@/app/components/trades/TradeChecklist";
import TradePsychology from "@/app/components/trades/TradePsychology";

type Trade = {
  id: string;
  symbol: string;
  type: string;
  entry_price: number;
  exit_price: number;
  lot_size: number;
  open_time: string;
  close_time: string;
  stop_loss: number | null;
  take_profit: number | null;
  profit: number;
};

export default function TradeReviewPage() {
  const params = useParams();
  const router = useRouter();

  const tradeId = params.id as string;

  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTrade = async () => {
      const user = await getCurrentUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("trades")
        .select(
          `
          id,
          symbol,
          type,
          entry_price,
          exit_price,
          lot_size,
          open_time,
          close_time,
          stop_loss,
          take_profit,
          profit
        `,
        )
        .eq("id", tradeId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error(error);
        setError(error.message);
        setLoading(false);
        return;
      }

      setTrade(data);
      setLoading(false);
    };

    loadTrade();
  }, [tradeId, router]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-gray-500">Trade review ачааллаж байна...</div>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-600">
        {error || "Trade олдсонгүй."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🧠 Trade Review</h1>

          <p className="mt-1 text-sm text-gray-500">
            {trade.symbol} · {trade.type.toUpperCase()}
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          ← Буцах
        </button>
      </div>

      {/* TRADE SUMMARY */}
      <section className="rounded-xl border bg-white p-5 dark:bg-gray-900 dark:border-gray-800">
        <h2 className="mb-4 text-lg font-semibold">Trade мэдээлэл</h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <div className="text-xs text-gray-500">Symbol</div>
            <div className="font-semibold">{trade.symbol}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Type</div>
            <div className="font-semibold">{trade.type.toUpperCase()}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Entry</div>
            <div className="font-semibold">{trade.entry_price}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Exit</div>
            <div className="font-semibold">{trade.exit_price}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Lot</div>
            <div className="font-semibold">{trade.lot_size}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Stop Loss</div>
            <div className="font-semibold">{trade.stop_loss ?? "-"}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Take Profit</div>
            <div className="font-semibold">{trade.take_profit ?? "-"}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Profit</div>
            <div
              className={`font-semibold ${
                trade.profit > 0
                  ? "text-green-600"
                  : trade.profit < 0
                    ? "text-red-600"
                    : "text-gray-500"
              }`}
            >
              {trade.profit > 0 ? "+" : ""}
              {trade.profit}
            </div>
          </div>
        </div>
      </section>

      {/* CHECKLIST */}
      <TradeChecklist tradeId={tradeId} />

      {/* PSYCHOLOGY */}
      <TradePsychology tradeId={tradeId} />
    </div>
  );
}
