"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }

      setLoading(false);
    };

    checkUser();
  }, [router]);

  if (loading) {
    return <p className="p-4">Loading...</p>;
  }

  return null;
}
