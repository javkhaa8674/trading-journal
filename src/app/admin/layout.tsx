// app/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (!data || data.role !== "admin") {
        router.push("/dashboard");
      } else {
        setIsAdmin(true);
      }
    };

    checkAdmin();
  }, [router]);

  if (isAdmin === null) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-2">🔐</div>
          <div className="text-gray-500">Зөвшөөрлийг шалгаж байна...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
