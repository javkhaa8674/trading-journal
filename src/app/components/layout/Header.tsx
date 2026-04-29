// components/layout/Header.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSidebar } from "@/app/context/SidebarContext";
import { ThemeToggle } from "@/app/components/ui/ThemeToggle";
import Image from "next/image";

export function Header() {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { toggleSidebar } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
      if (user) {
        setUserEmail(user.email || "");

        // Load avatar
        const { data: avatarData } = await supabase.storage
          .from("avatars")
          .getPublicUrl(`${user.id}/avatar.jpg`);

        // Check if avatar exists
        const { data: fileExists } = await supabase.storage
          .from("avatars")
          .list(`${user.id}/`);

        if (fileExists && fileExists.length > 0) {
          setAvatarUrl(avatarData.publicUrl);
        }
      }
    };
    getUser();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    if (pathname === "/profile") return "Профайл";
    if (pathname === "/settings") return "Тохиргоо";
    return "Арилжааны тэмдэглэл";
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoading(false);
    }
  };

  const getUserInitial = () => {
    if (!userEmail) return "👤";
    return userEmail.charAt(0).toUpperCase();
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 dark:bg-gray-900 dark:border-gray-800">
      {/* Mobile menu button */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label="Menu"
        >
          <svg
            className="h-6 w-6"
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

      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
        {getPageTitle()}
      </h1>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        {/* User Menu Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="User menu"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm transition-all hover:scale-105">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile"
                  fill
                  className="rounded-full object-cover shadow-sm transition-all hover:scale-105"
                  unoptimized // Supabase storage URL-д хэрэгтэй
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-medium text-white shadow-sm transition-all hover:scale-105">
                  {getUserInitial()}
                </div>
              )}
            </div>
            <svg
              className={`hidden h-4 w-4 text-gray-500 transition-transform duration-200 sm:block dark:text-gray-400 ${
                showUserMenu ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700">
              <div className="py-1">
                {/* User Info */}
                <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {userEmail || "Хэрэглэгч"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Хэрэглэгч
                  </p>
                </div>

                {/* Menu Items */}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    // Add profile navigation if needed
                    router.push("/profile");
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Профайл
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    // Add settings navigation if needed
                    router.push("/settings");
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Тохиргоо
                </button>

                <hr className="my-1 border-gray-200 dark:border-gray-700" />

                <button
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Гарж байна...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>Гарах</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
