// components/AppWrapper.tsx
"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/app/components/layout/Sidebar";
import { Header } from "@/app/components/layout/Header";
import { useSidebar } from "@/app/context/SidebarContext";
import { useEffect, useState } from "react";

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  // Mobile дээр sidebar хаалттай үед margin 0 байх ёстой
  const sidebarWidth = !isMobile && !isCollapsed ? 256 : 0;

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
