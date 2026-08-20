"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import type { Trade } from "@/types/trade";

type TradeInput = Omit<Trade, "id" | "user_id">;

type TradeUpdate = Partial<TradeInput>;

function formatTradeForDatabase(trade: TradeInput) {
  return {
    ...trade,

    open_time:
      trade.open_time instanceof Date
        ? trade.open_time.toISOString()
        : trade.open_time,

    close_time:
      trade.close_time instanceof Date
        ? trade.close_time.toISOString()
        : trade.close_time,
  };
}

function formatTradeFromDatabase(trade: any): Trade {
  return {
    ...trade,

    open_time: trade.open_time ? new Date(trade.open_time) : new Date(),

    close_time: trade.close_time ? new Date(trade.close_time) : undefined,
  };
}

export function useTrades(accountId?: string | null) {
  const [trades, setTrades] = useState<Trade[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // =========================================================
  // FETCH
  // =========================================================

  const fetchTrades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const user = await getCurrentUser();

      if (!user) {
        setTrades([]);
        return;
      }

      let query = supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .order("open_time", {
          ascending: false,
        });

      if (accountId && accountId !== "all") {
        query = query.eq("account_id", accountId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      const formattedTrades = (data ?? []).map(formatTradeFromDatabase);

      setTrades(formattedTrades);
    } catch (err) {
      console.error("Error fetching trades:", err);

      const message =
        err instanceof Error ? err.message : "Failed to fetch trades";

      setError(message);
      setTrades([]);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  // =========================================================
  // ADD SINGLE TRADE
  // =========================================================

  const addTrade = useCallback(async (trade: TradeInput) => {
    try {
      setError(null);

      const user = await getCurrentUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const formattedTrade = formatTradeForDatabase(trade);

      const { data, error: insertError } = await supabase
        .from("trades")
        .insert({
          ...formattedTrade,
          user_id: user.id,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      const newTrade = formatTradeFromDatabase(data);

      setTrades((current) => [newTrade, ...current]);

      return {
        data: newTrade,
        error: null,
      };
    } catch (err) {
      console.error("Error adding trade:", err);

      const message =
        err instanceof Error ? err.message : "Failed to add trade";

      setError(message);

      return {
        data: null,
        error: message,
      };
    }
  }, []);

  // =========================================================
  // BULK ADD
  // =========================================================

  const bulkAddTrades = useCallback(async (tradesToAdd: TradeInput[]) => {
    try {
      setError(null);

      if (tradesToAdd.length === 0) {
        return {
          data: [],
          error: null,
        };
      }

      const user = await getCurrentUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const formattedTrades = tradesToAdd.map((trade) => ({
        ...formatTradeForDatabase(trade),
        user_id: user.id,
      }));

      const { data, error: insertError } = await supabase
        .from("trades")
        .insert(formattedTrades)
        .select();

      if (insertError) {
        throw insertError;
      }

      const newTrades = (data ?? []).map(formatTradeFromDatabase);

      setTrades((current) => [...newTrades, ...current]);

      return {
        data: newTrades,
        error: null,
      };
    } catch (err) {
      console.error("Error bulk adding trades:", err);

      const message =
        err instanceof Error ? err.message : "Failed to bulk add trades";

      setError(message);

      return {
        data: null,
        error: message,
      };
    }
  }, []);

  // =========================================================
  // UPDATE
  // =========================================================

  const updateTrade = useCallback(async (id: string, updates: TradeUpdate) => {
    try {
      setError(null);

      const user = await getCurrentUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const formattedUpdates: Record<string, unknown> = {
        ...updates,
      };

      if (updates.open_time instanceof Date) {
        formattedUpdates.open_time = updates.open_time.toISOString();
      }

      if (updates.close_time instanceof Date) {
        formattedUpdates.close_time = updates.close_time.toISOString();
      }

      delete formattedUpdates.id;
      delete formattedUpdates.user_id;

      const { data, error: updateError } = await supabase
        .from("trades")
        .update(formattedUpdates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      const updatedTrade = formatTradeFromDatabase(data);

      setTrades((current) =>
        current.map((trade) => (trade.id === id ? updatedTrade : trade)),
      );

      return {
        data: updatedTrade,
        error: null,
      };
    } catch (err) {
      console.error("Error updating trade:", err);

      const message =
        err instanceof Error ? err.message : "Failed to update trade";

      setError(message);

      return {
        data: null,
        error: message,
      };
    }
  }, []);

  // =========================================================
  // DELETE
  // =========================================================

  const deleteTrade = useCallback(async (id: string) => {
    try {
      setError(null);

      const user = await getCurrentUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { error: deleteError } = await supabase
        .from("trades")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (deleteError) {
        throw deleteError;
      }

      setTrades((current) => current.filter((trade) => trade.id !== id));

      return {
        error: null,
      };
    } catch (err) {
      console.error("Error deleting trade:", err);

      const message =
        err instanceof Error ? err.message : "Failed to delete trade";

      setError(message);

      return {
        error: message,
      };
    }
  }, []);

  // =========================================================
  // BULK DELETE
  // =========================================================

  const bulkDeleteTrades = useCallback(async (ids: string[]) => {
    try {
      setError(null);

      if (ids.length === 0) {
        return {
          error: null,
        };
      }

      const user = await getCurrentUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { error: deleteError } = await supabase
        .from("trades")
        .delete()
        .in("id", ids)
        .eq("user_id", user.id);

      if (deleteError) {
        throw deleteError;
      }

      const idSet = new Set(ids);

      setTrades((current) => current.filter((trade) => !idSet.has(trade.id)));

      return {
        error: null,
      };
    } catch (err) {
      console.error("Error bulk deleting trades:", err);

      const message =
        err instanceof Error ? err.message : "Failed to bulk delete trades";

      setError(message);

      return {
        error: message,
      };
    }
  }, []);

  // =========================================================
  // REFRESH
  // =========================================================

  const refresh = useCallback(async () => {
    await fetchTrades();
  }, [fetchTrades]);

  return {
    trades,
    loading,
    error,

    addTrade,
    bulkAddTrades,

    updateTrade,

    deleteTrade,
    bulkDeleteTrades,

    refresh,
  };
}
