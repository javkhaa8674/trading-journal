"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSidebar } from "@/app/context/SidebarContext";

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "Trades", href: "/trades", icon: "💰" },
  { name: "Accounts", href: "/accounts", icon: "🏦" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 1024);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sidebar widths
  const expandedWidth = "w-64";
  const collapsedWidth = "w-16";

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-40 flex h-full flex-col border-r bg-white transition-all duration-300 dark:bg-gray-900
          ${isCollapsed ? collapsedWidth : expandedWidth}
        `}
      >
        {/* Logo */}
        <div
          className={`flex h-16 items-center border-b px-4 ${isCollapsed ? "justify-center" : "justify-between"}`}
        >
          {!isCollapsed ? (
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl">📈</span>
              <span className="font-bold">Trading Journal</span>
            </Link>
          ) : (
            <Link href="/dashboard" className="text-2xl">
              📈
            </Link>
          )}

          {/* Toggle button inside sidebar */}
          <button
            onClick={toggleSidebar}
            className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? "→" : "←"}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                  ${isCollapsed ? "justify-center" : ""}
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }
                `}
                title={isCollapsed ? item.name : ""}
              >
                <span className="text-lg">{item.icon}</span>
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className={`border-t p-4 ${isCollapsed ? "text-center" : ""}`}>
          {!isCollapsed ? (
            <LogoutButton />
          ) : (
            <button
              onClick={async () => {
                const { supabase } = await import("@/lib/supabaseClient");
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
              className="flex w-full items-center justify-center text-red-500"
              title="Logout"
            >
              ⏻
            </button>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {!isCollapsed && isMobile && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}

// Logout Button Component
function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    const { supabase } = await import("@/lib/supabaseClient");
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-md font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50"
    >
      <span>⏻</span>
      <span>{isLoading ? "Logging out..." : "Logout"}</span>
    </button>
  );
}
