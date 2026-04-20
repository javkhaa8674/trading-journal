import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default async function HomePage() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/dashboard");
  }

  redirect("/login");
}
