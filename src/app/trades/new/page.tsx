"use client";

import { useEffect } from "react";
import { getCurrentUser } from "@/lib/getCurrentUser";
import TradeForm from "@/app/components/trades/TradeForm";

export default function NewTradePage() {
  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentUser();
      console.log("USER:", user);
    };

    loadUser();
  }, []);

  return (
    <div>
      <TradeForm />
    </div>
  );
}
