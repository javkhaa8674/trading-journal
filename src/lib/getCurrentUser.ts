// src/lib/getCurrentUser.ts

import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error getting user:", error);
      return null;
    }
    return data.user;
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
}
