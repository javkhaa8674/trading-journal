"use client";

import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/app/providers/NotificationProvider";

export function NotificationBell() {
  const context = useNotifications();
  const notifications = context?.notifications || [];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // click outside close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* 🔔 Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 rounded-full bg-red-500 px-1.5 text-xs text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* 📦 Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border bg-white shadow-lg dark:bg-gray-900 z-50">
          <div className="border-b p-3 text-sm font-medium">Мэдэгдэл</div>

          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">Мэдэгдэл байхгүй</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="border-b p-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p>{n.message}</p>
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-blue-500 mt-1" />
                    )}
                  </div>

                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
