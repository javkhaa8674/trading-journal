// src/app/page.tsx

import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function HomePage() {
  // ✅ 1. cookies()-г await хийх
  const cookieStore = await cookies();

  // ✅ 2. createServerClient-г зөв тохируулах
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // ✅ 3. setAll()-г зөв бичих
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Cookies set хийхэд алдаа гарвал log
            console.error("Error setting cookies:", error);
          }
        },
      },
    },
  );

  // ✅ 4. User шалгах
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // ✅ 5. Алдаа гарсан тохиолдолд
  if (error) {
    console.error("Auth error:", error);
    redirect("/login");
  }

  // ✅ 6. User байгаа бол dashboard, үгүй бол login
  if (user) {
    redirect("/dashboard");
  }

  redirect("/login");
}
