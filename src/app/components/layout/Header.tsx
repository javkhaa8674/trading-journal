"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ThemeToggle } from "@/app/components/ui/ThemeToggle";

export function Header() {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email || "");
    };
    getUser();
  }, []);

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname === "/trades") return "All Trades";
    if (pathname === "/trades/new") return "Add New Trade";
    if (pathname?.startsWith("/trades/") && pathname !== "/trades/new")
      return "Edit Trade";
    if (pathname === "/accounts") return "Accounts";
    return "Trading Journal";
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6 dark:bg-gray-900">
      <h1 className="text-xl font-semibold">{getPageTitle()}</h1>

      <div className="flex items-center gap-3">
        <ThemeToggle /> {/* ✅ Dark mode toggle */}
        <span className="text-sm text-gray-500">{userEmail}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
          👤
        </div>
      </div>
    </header>
  );
}
