"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  // 👉 INSERT (trade нэмэх)
  async function addTrade() {
    const { error } = await supabase.from("trades").insert({
      symbol: "EURUSD",
      profit: 50,
    });

    if (error) {
      console.log("INSERT ERROR:", error);
    } else {
      console.log("INSERT SUCCESS");
    }
  }

  // 👉 SELECT (data авах)
  async function getTrades() {
    const { data, error } = await supabase.from("trades").select("*");

    if (error) {
      console.log("SELECT ERROR:", error);
    } else {
      console.log("DATA:", data); // 🔥 ЭНД ХАРНА
    }
  }

  // 👉 page ачаалагдахад автоматаар дуудагдана
  useEffect(() => {
    getTrades();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Trading Journal Test</h1>

      <button onClick={addTrade}>Add Trade</button>

      <br />
      <br />

      <button onClick={getTrades}>Get Trades</button>
    </div>
  );
}
