"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/app/components/layout/Sidebar";
import { Header } from "@/app/components/layout/Header";
import { useSidebar } from "@/app/context/SidebarContext";

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();

  // Auth pages - No sidebar/header
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/reset-password";

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">{children}</div>
    );
  }

  // Sidebar width: 256px (w-64), collapsed: 64px (w-16)
  const sidebarWidth = isCollapsed ? 64 : 256;

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div
        className="transition-all duration-300"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
