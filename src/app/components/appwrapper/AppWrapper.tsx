"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/app/components/layout/Sidebar";
import { Header } from "@/app/components/layout/Header";
import { useSidebar } from "@/app/context/SidebarContext";

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();

  // Auth pages - No sidebar/header
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) {
    return <>{children}</>;
  }

  // Sidebar width: 256px (w-64), collapsed: 64px (w-16)
  const sidebarWidth = isCollapsed ? 64 : 256;

  return (
    <div className="relative min-h-screen">
      <Sidebar />
      <div
        className="transition-all duration-300"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        <Header />
        <main className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
}
