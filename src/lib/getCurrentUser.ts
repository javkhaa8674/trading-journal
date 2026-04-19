import { supabase } from "@/lib/supabaseClient";

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();

  if (error) return null;
  return data.user;
};