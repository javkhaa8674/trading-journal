// components/layout/Header.tsx
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSidebar } from "@/app/context/SidebarContext";
import { ThemeToggle } from "@/app/components/ui/ThemeToggle";

export function Header() {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string>("");
  const { toggleSidebar, isCollapsed } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
    if (pathname === "/dashboard") return "Хяналтын самбар";
    if (pathname === "/trades") return "Ажилжаанууд";
    if (pathname === "/trades/new") return "Шинэ ажилжаа нэмэх";
    if (pathname?.startsWith("/trades/") && pathname !== "/trades/new")
      return "Ажилжаа засварлах";
    if (pathname === "/accounts") return "Дансууд";
    if (pathname === "/trading-plan") return "Ажилжааны төлөвлөгөө";
    if (pathname === "/deposits") return "Хадгаламж";
    if (pathname === "/withdrawals") return "Татан авалт";
    if (pathname === "/psychology") return "Сэтгэл зүй";
    if (pathname?.startsWith("/admin")) return "Админ панель";
    return "Арилжааны тэмдэглэл";
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 dark:bg-gray-900 dark:border-gray-800">
      {/* Mobile menu button */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label="Menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}

      <h1 className="text-xl font-semibold">{getPageTitle()}</h1>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <span className="text-sm text-gray-500 hidden sm:block">
          {userEmail}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
          👤
        </div>
      </div>
    </header>
  );
}
