// src/lib/hooks/useUser.ts

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

type UseUserReturn = {
  user: User | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.auth.getUser();

      if (fetchError) {
        throw fetchError;
      }

      setUser(data.user);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Хэрэглэгч татахад алдаа гарлаа";
      setError(message);
      setUser(null);
      console.error("useUser error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 🔄 Auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    error,
    refresh: fetchUser,
  };
}
