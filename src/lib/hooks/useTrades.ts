"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Trade } from "@/types/trade";

export function useTrades(accountId?: string) {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTrades = async () => {
        try {
            setLoading(true);
            setError(null);

            // Нэвтэрсэн хэрэглэгчийн ID-г авна
            const { data: { user }, error: userError } = await supabase.auth
                .getUser();

            if (userError) {
                throw new Error(userError.message);
            }

            if (!user) {
                setTrades([]);
                setLoading(false);
                return;
            }

            let query = supabase
                .from("trades")
                .select("*")
                .eq("user_id", user.id)
                .order("open_time", { ascending: false });

            if (accountId && accountId !== "all") {
                query = query.eq("account_id", accountId);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) {
                throw new Error(fetchError.message);
            }

            // Date string-г Date объект болгон хөрвүүлэх
            const formattedData = data?.map((trade: any) => ({
                ...trade,
                open_time: trade.open_time
                    ? new Date(trade.open_time)
                    : new Date(),
                close_time: trade.close_time
                    ? new Date(trade.close_time)
                    : undefined,
            })) || [];

            setTrades(formattedData);
        } catch (err) {
            console.error("Error fetching trades:", err);
            setError(
                err instanceof Error ? err.message : "Failed to fetch trades",
            );
            setTrades([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrades();
    }, [accountId]);

    const addTrade = async (trade: Omit<Trade, "id">) => {
        try {
            setError(null);

            // Нэвтэрсэн хэрэглэгчийн ID-г авна
            const { data: { user }, error: userError } = await supabase.auth
                .getUser();

            if (userError) {
                throw new Error(userError.message);
            }

            if (!user) {
                throw new Error("User not authenticated");
            }

            // Date обьектуудыг string болгон хөрвүүлэх
            const formattedTrade = {
                ...trade,
                user_id: user.id,
                open_time: trade.open_time instanceof Date
                    ? trade.open_time.toISOString()
                    : trade.open_time,
                close_time: trade.close_time instanceof Date
                    ? trade.close_time.toISOString()
                    : trade.close_time,
            };

            const { data, error: insertError } = await supabase
                .from("trades")
                .insert([formattedTrade])
                .select()
                .single();

            if (insertError) {
                throw new Error(insertError.message);
            }

            const newTrade = {
                ...data,
                open_time: data.open_time
                    ? new Date(data.open_time)
                    : new Date(),
                close_time: data.close_time
                    ? new Date(data.close_time)
                    : undefined,
            };

            setTrades((prev) => [newTrade, ...prev]);
            return { data: newTrade, error: null };
        } catch (err) {
            console.error("Error adding trade:", err);
            setError(
                err instanceof Error ? err.message : "Failed to add trade",
            );
            return {
                data: null,
                error: err instanceof Error
                    ? err.message
                    : "Failed to add trade",
            };
        }
    };

    const updateTrade = async (id: string, updates: Partial<Trade>) => {
        try {
            setError(null);

            // Date обьектуудыг string болгон хөрвүүлэх
            const formattedUpdates: any = { ...updates };
            if (updates.open_time instanceof Date) {
                formattedUpdates.open_time = updates.open_time.toISOString();
            }
            if (updates.close_time instanceof Date) {
                formattedUpdates.close_time = updates.close_time.toISOString();
            }

            const { data, error: updateError } = await supabase
                .from("trades")
                .update(formattedUpdates)
                .eq("id", id)
                .select()
                .single();

            if (updateError) {
                throw new Error(updateError.message);
            }

            const updatedTrade = {
                ...data,
                open_time: data.open_time
                    ? new Date(data.open_time)
                    : new Date(),
                close_time: data.close_time
                    ? new Date(data.close_time)
                    : undefined,
            };

            setTrades((prev) =>
                prev.map((t) => t.id === id ? updatedTrade : t)
            );
            return { data: updatedTrade, error: null };
        } catch (err) {
            console.error("Error updating trade:", err);
            setError(
                err instanceof Error ? err.message : "Failed to update trade",
            );
            return {
                data: null,
                error: err instanceof Error
                    ? err.message
                    : "Failed to update trade",
            };
        }
    };

    const deleteTrade = async (id: string) => {
        try {
            setError(null);
            const { error: deleteError } = await supabase
                .from("trades")
                .delete()
                .eq("id", id);

            if (deleteError) {
                throw new Error(deleteError.message);
            }

            setTrades((prev) => prev.filter((t) => t.id !== id));
            return { error: null };
        } catch (err) {
            console.error("Error deleting trade:", err);
            setError(
                err instanceof Error ? err.message : "Failed to delete trade",
            );
            return {
                error: err instanceof Error
                    ? err.message
                    : "Failed to delete trade",
            };
        }
    };

    const bulkAddTrades = async (trades: Omit<Trade, "id">[]) => {
        try {
            setError(null);

            // Нэвтэрсэн хэрэглэгчийн ID-г авна
            const { data: { user }, error: userError } = await supabase.auth
                .getUser();

            if (userError) {
                throw new Error(userError.message);
            }

            if (!user) {
                throw new Error("User not authenticated");
            }

            // Date обьектуудыг string болгон хөрвүүлэх
            const formattedTrades = trades.map((trade) => ({
                ...trade,
                user_id: user.id,
                open_time: trade.open_time instanceof Date
                    ? trade.open_time.toISOString()
                    : trade.open_time,
                close_time: trade.close_time instanceof Date
                    ? trade.close_time.toISOString()
                    : trade.close_time,
            }));

            const { data, error: insertError } = await supabase
                .from("trades")
                .insert(formattedTrades)
                .select();

            if (insertError) {
                throw new Error(insertError.message);
            }

            const newTrades = data?.map((trade: any) => ({
                ...trade,
                open_time: trade.open_time
                    ? new Date(trade.open_time)
                    : new Date(),
                close_time: trade.close_time
                    ? new Date(trade.close_time)
                    : undefined,
            })) || [];

            setTrades((prev) => [...newTrades, ...prev]);
            return { data: newTrades, error: null };
        } catch (err) {
            console.error("Error bulk adding trades:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to bulk add trades",
            );
            return {
                data: null,
                error: err instanceof Error
                    ? err.message
                    : "Failed to bulk add trades",
            };
        }
    };

    const refresh = () => {
        fetchTrades();
    };

    return {
        trades,
        loading,
        error,
        addTrade,
        updateTrade,
        deleteTrade,
        bulkAddTrades,
        refresh,
    };
}
