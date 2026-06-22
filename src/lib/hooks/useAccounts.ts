"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Account } from "@/types/accounts";

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
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
          setAccounts([]);
          setLoading(false);
          return;
        }

        // Зөвхөн тухайн хэрэглэгчийн account-г сонгоно
        const { data, error: fetchError } = await supabase
          .from("accounts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        setAccounts(data || []);
      } catch (err) {
        console.error("Error fetching accounts:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch accounts",
        );
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const refresh = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setAccounts([]);
      return;
    }

    const { data } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setAccounts(data || []);
  };

  const addAccount = async (
    account: Omit<Account, "id" | "user_id" | "created_at" | "updated_at">,
  ) => {
    try {
      setError(null);
      const { data: { user }, error: userError } = await supabase.auth
        .getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error: insertError } = await supabase
        .from("accounts")
        .insert([{ ...account, user_id: user.id }])
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      setAccounts((prev) => [data, ...prev]);
      return { data, error: null };
    } catch (err) {
      console.error("Error adding account:", err);
      setError(err instanceof Error ? err.message : "Failed to add account");
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to add account",
      };
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      setError(null);
      const { data, error: updateError } = await supabase
        .from("accounts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      setAccounts((prev) => prev.map((a) => a.id === id ? data : a));
      return { data, error: null };
    } catch (err) {
      console.error("Error updating account:", err);
      setError(err instanceof Error ? err.message : "Failed to update account");
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to update account",
      };
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from("accounts")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setAccounts((prev) => prev.filter((a) => a.id !== id));
      return { error: null };
    } catch (err) {
      console.error("Error deleting account:", err);
      setError(err instanceof Error ? err.message : "Failed to delete account");
      return {
        error: err instanceof Error ? err.message : "Failed to delete account",
      };
    }
  };

  return {
    accounts,
    loading,
    error,
    refresh,
    addAccount,
    updateAccount,
    deleteAccount,
  };
}
