"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSidebar } from "@/app/context/SidebarContext";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { supabase } from "@/lib/supabaseClient";
import logo from "@/assets/logo.png";

interface NavItem {
  name: string;
  href: string;
  icon: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { name: "Хяналтын самбар", href: "/dashboard", icon: "📊" },
  { name: "Арилжаанууд", href: "/trades", icon: "💰" },
  { name: "Дансууд", href: "/accounts", icon: "🏦" },
  { name: "Арилжааны төлөвлөгөө", href: "/trading-plan", icon: "🗺️" },
  { name: "Хадгаламж", href: "/deposits", icon: "📥" },
  { name: "Татан авалт", href: "/withrawals", icon: "💸" },
  { name: "Сэтгэл зүй", href: "/psychology", icon: "🧠" },
  { name: "Админ панель", href: "/admin/signups", icon: "👑", adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar, setIsCollapsed } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [setIsCollapsed]);

  // Check admin role
  useEffect(() => {
    const checkAdmin = async () => {
      const user = await getCurrentUser();
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data?.role === "admin");
      }
    };

    checkAdmin();
  }, []);

  // Filter nav items based on admin role
  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || (item.adminOnly && isAdmin),
  );

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-40 flex h-full flex-col border-r bg-white shadow-lg transition-all duration-300
          dark:bg-gray-900 dark:border-gray-700
          ${
            isMobile
              ? `${isCollapsed ? "-translate-x-full" : "translate-x-0"} w-64`
              : `${isCollapsed ? "w-16" : "w-64"}`
          }
        `}
      >
        {/* Logo */}
        <div
          className={`flex h-16 items-center border-b px-4 dark:border-gray-700 ${
            !isMobile && isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          {(!isMobile && !isCollapsed) || (!isMobile && isCollapsed) ? (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="mb-3 flex justify-center">
                <Image src={logo} alt="Logo" width={30} height={30} priority />
              </div>
              {!isCollapsed && (
                <span className="font-bold text-gray-900 dark:text-white">
                  Ажилжааны журнал
                </span>
              )}
            </Link>
          ) : (
            <Link href="/dashboard" className="text-2xl">
              <div className="mb-3 flex justify-center">
                <Image src={logo} alt="Logo" width={30} height={30} priority />
              </div>
            </Link>
          )}

          {/* Desktop toggle button */}
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? "→" : "←"}
            </button>
          )}
        </div>

        {/* Navigation */}

        <nav className="flex-1 space-y-1 p-2">
          {visibleNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (isMobile) {
                    setIsCollapsed(true);
                  }
                }}
                className={`
          flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200
          ${!isMobile && isCollapsed ? "justify-center" : ""}
          ${
            isActive
              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/40"
          }
        `}
                title={!isMobile && isCollapsed ? item.name : ""}
              >
                <span className="text-lg">{item.icon}</span>
                {/* Mobile Expanded эсвэл Desktop Expanded үед текст харагдана */}
                {!isCollapsed && (
                  <span className="text-gray-700 dark:text-gray-200">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  );
}
