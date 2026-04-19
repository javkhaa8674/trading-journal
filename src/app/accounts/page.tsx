"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AccountsPage() {
  type Account = {
    id: string;
    name: string;
    broker: string;
    mode: string;
    balance: number;
  };
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [user, setUser] = useState<unknown>(null);

  useEffect(() => {
    const loadData = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.replace("/login");
        return;
      }

      setUser(userData.user);

      const { data } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", userData.user.id);

      setAccounts(data || []);
    };

    loadData();
  }, [router]);

  if (!user) return <p className="p-4">Loading...</p>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Accounts</h1>

      <button
        onClick={() => router.push("/accounts/new")}
        className="bg-black text-white px-4 py-2"
      >
        + Create Account
      </button>

      <div className="space-y-2">
        {accounts.map((acc) => (
          <div key={acc.id} className="border p-3 rounded">
            <p className="font-bold">{acc.name}</p>
            <p>{acc.broker}</p>
            <p className="text-sm text-gray-500">{acc.mode}</p>
            <p>Balance: {acc.balance}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
