// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "./providers/ThemeProvider";
import "./globals.css";
import { SidebarProvider } from "@/app/context/SidebarContext";
import { AppWrapper } from "@/app/components/appwrapper/AppWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trading Journal App",
  description: "Professional trading journal and analytics platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <SidebarProvider>
            <AppWrapper>{children}</AppWrapper>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
