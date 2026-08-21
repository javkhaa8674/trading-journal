"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import type { Trade, WouldTakeAgain, PostTradeReview } from "@/types/trade";

type PostTradeReviewData = {
  id?: string;
  execution_quality: number | null;
  would_take_again: WouldTakeAgain | null;
  reflection: string | null;
  lesson_learned: string | null;
  notes: string | null;
};

type TradeInput = Omit<Trade, "id" | "user_id">;
type TradeUpdate = Partial<TradeInput>;

function formatTradeForDatabase(trade: TradeInput) {
  return {
    ...trade,
    open_time: trade.open_time,
    close_time: trade.close_time,
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

      if (updates.open_time) {
        formattedUpdates.open_time = updates.open_time;
      }

      if (updates.close_time) {
        formattedUpdates.close_time = updates.close_time;
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
  // POST-TRADE REVIEW
  // =========================================================

  const getPostTradeReview = useCallback(
    async (
      tradeId: string,
    ): Promise<{
      data: PostTradeReview | null;
      error: string | null;
    }> => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          return {
            data: null,
            error: "Хэрэглэгч олдсонгүй.",
          };
        }

        const { data, error } = await supabase
          .from("post_trade_review")
          .select("*")
          .eq("trade_id", tradeId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching post-trade review:", error);
          return {
            data: null,
            error: error.message,
          };
        }

        return {
          data: data as PostTradeReview | null,
          error: null,
        };
      } catch (err) {
        console.error("Error in getPostTradeReview:", err);
        const message =
          err instanceof Error
            ? err.message
            : "Failed to fetch post-trade review";
        return {
          data: null,
          error: message,
        };
      }
    },
    [],
  );

  const savePostTradeReview = useCallback(
    async (
      tradeId: string,
      reviewData: Omit<
        PostTradeReview,
        "id" | "trade_id" | "user_id" | "created_at" | "updated_at"
      >,
    ): Promise<{
      data: PostTradeReview | null;
      error: string | null;
    }> => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          return {
            data: null,
            error: "Хэрэглэгч олдсонгүй.",
          };
        }

        const payload = {
          trade_id: tradeId,
          user_id: user.id,
          execution_quality: reviewData.execution_quality,
          would_take_again: reviewData.would_take_again,
          reflection: reviewData.reflection,
          lesson_learned: reviewData.lesson_learned,
          notes: reviewData.notes,
          updated_at: new Date().toISOString(),
        };

        let result;

        // Хэрэв id байгаа бол update, үгүй бол insert
        if ((reviewData as any).id) {
          // Update existing
          const { data, error } = await supabase
            .from("post_trade_review")
            .update(payload)
            .eq("id", (reviewData as any).id)
            .eq("trade_id", tradeId)
            .eq("user_id", user.id)
            .select()
            .single();

          if (error) {
            console.error("Error updating post-trade review:", error);
            return {
              data: null,
              error: error.message,
            };
          }
          result = data;
        } else {
          // Insert new
          const { data, error } = await supabase
            .from("post_trade_review")
            .insert(payload)
            .select()
            .single();

          if (error) {
            console.error("Error inserting post-trade review:", error);
            return {
              data: null,
              error: error.message,
            };
          }
          result = data;
        }

        return {
          data: result as PostTradeReview,
          error: null,
        };
      } catch (err) {
        console.error("Error in savePostTradeReview:", err);
        const message =
          err instanceof Error
            ? err.message
            : "Failed to save post-trade review";
        return {
          data: null,
          error: message,
        };
      }
    },
    [],
  );

  const deletePostTradeReview = useCallback(
    async (
      tradeId: string,
    ): Promise<{
      error: string | null;
    }> => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          return {
            error: "Хэрэглэгч олдсонгүй.",
          };
        }

        const { error } = await supabase
          .from("post_trade_review")
          .delete()
          .eq("trade_id", tradeId)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error deleting post-trade review:", error);
          return {
            error: error.message,
          };
        }

        return {
          error: null,
        };
      } catch (err) {
        console.error("Error in deletePostTradeReview:", err);
        const message =
          err instanceof Error
            ? err.message
            : "Failed to delete post-trade review";
        return {
          error: message,
        };
      }
    },
    [],
  );
  // ============================================================
  // UPDATE TRADE STRATEGY PROFILE
  // ============================================================

  const updateTradeStrategy = useCallback(
    async (id: string, strategyProfileId: string | null) => {
      try {
        setError(null);

        const user = await getCurrentUser();
        if (!user) {
          return {
            data: null,
            error: "Хэрэглэгч олдсонгүй.",
          };
        }

        // Хэрэв strategyProfileId хоосон string бол null болгон хувиргах
        const finalProfileId =
          strategyProfileId === "" ? null : strategyProfileId;

        console.log("Updating trade strategy:", {
          tradeId: id,
          strategyProfileId: finalProfileId,
          userId: user.id,
        });

        // Эхлээд trade байгаа эсэхийг шалгах
        const { data: existingTrade, error: checkError } = await supabase
          .from("trades")
          .select("id, strategy_profile_id")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (checkError) {
          console.error("Trade not found:", checkError);
          return {
            data: null,
            error: "Trade олдсонгүй: " + JSON.stringify(checkError),
          };
        }

        console.log("Existing trade:", existingTrade);

        // Update хийх
        const updatePayload = {
          strategy_profile_id: finalProfileId,
          updated_at: new Date().toISOString(),
        };

        console.log("Update payload:", updatePayload);

        const { data, error } = await supabase
          .from("trades")
          .update(updatePayload)
          .eq("id", id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) {
          // Бүх error мэдээллийг харах
          console.error("Supabase update error - full:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            name: error.name,
            stack: error.stack,
            toString: error.toString(),
            // JSON.stringify хийхэд гарч буй утга
            json: JSON.stringify(error, Object.getOwnPropertyNames(error)),
          });

          return {
            data: null,
            error: `Алдаа: ${error.message || error.code || JSON.stringify(error)}`,
          };
        }

        if (!data) {
          return {
            data: null,
            error: "Trade шинэчлэгдсэн боловч буцаж ирсэнгүй.",
          };
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
        console.error("Error in updateTradeStrategy:", err);
        console.error("Error details:", {
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        });

        const message =
          err instanceof Error
            ? err.message
            : "Стратеги шинэчлэхэд алдаа гарлаа";

        return {
          data: null,
          error: message,
        };
      }
    },
    [],
  );
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

    // Post-Trade Review functions
    getPostTradeReview,
    savePostTradeReview,
    deletePostTradeReview,

    updateTradeStrategy,

    refresh,
  };
}
