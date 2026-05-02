// app/ClientLayout.tsx
"use client";

import { ThemeProvider } from "next-themes";
import { SidebarProvider } from "@/app/context/SidebarContext";
import { AppWrapper } from "@/app/components/appwrapper/AppWrapper";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useEffect } from "react";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Filter Recharts warnings
    const originalWarn = console.warn;
    console.warn = function (...args) {
      if (args[0]?.includes?.("width(-1) and height(-1)")) {
        return;
      }
      originalWarn.apply(console, args);
    };
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          <AppWrapper>{children}</AppWrapper>
        </SidebarProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
