// app/ClientLayout.tsx
"use client";

import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { SidebarProvider } from "@/app/context/SidebarContext";
import { AppWrapper } from "@/app/components/appwrapper/AppWrapper";
import { useEffect } from "react";

// Filter Recharts warnings
const filterRechartsWarnings = () => {
  const originalWarn = console.warn;
  console.warn = function (...args) {
    if (args[0]?.includes?.("width(-1) and height(-1)")) {
      return;
    }
    originalWarn.apply(console, args);
  };
};

export function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    filterRechartsWarnings();
  }, []);

  return (
    <ThemeProvider>
      <SidebarProvider>
        <AppWrapper>{children}</AppWrapper>
      </SidebarProvider>
    </ThemeProvider>
  );
}
