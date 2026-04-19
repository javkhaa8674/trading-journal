"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { Trade } from "@/types/trade";

import DashboardStats from "@/app/components/dashboard/DashboardStats";
import EquityCurveChart from "@/app/components/dashboard/EquityCurveChart";
import EquityDrawdownChart from "@/app/components/dashboard/EquityDrawdownChart";
import MonthlyHeatmap from "@/app/components/dashboard/MonthlyHeatmap";
import RiskPanel from "@/app/components/dashboard/RiskPanel";

import { buildDashboardData } from "@/lib/dashboardAnalytics";

export default function DashboardPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrades = async () => {
      const user = await getCurrentUser();
      if (!user) return;

      const { data } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id);

      setTrades(data || []);
      setLoading(false);
    };

    loadTrades();
  }, []);

  if (loading) return <p>Loading...</p>;

  const { chartData, monthlyData } = buildDashboardData(trades);
  console.log("TRADES:", trades);
  console.log("CHART DATA:", chartData);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <DashboardStats trades={trades} />

      <EquityCurveChart data={chartData} />
      <EquityDrawdownChart trades={trades} />
      <RiskPanel data={trades} />
      <MonthlyHeatmap data={monthlyData} />
    </div>
  );
}
