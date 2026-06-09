"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabaseClient";

type Notification = {
  id: string;
  user_id: string;
  account_id?: string;
  type: "warning" | "danger" | "info";
  message: string;
  read: boolean;
  created_at: string;
};

type NotificationContextType = {
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  reload: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => useContext(NotificationContext);

export default function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = useCallback(async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    setNotifications(data || []);
  }, []);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (mounted) {
        setNotifications(data || []);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, setNotifications, reload: loadNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
