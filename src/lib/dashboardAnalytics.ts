import { Trade } from "@/types/trade";

import { buildEquityCurve, buildRollingEquity } from "./equity";
import { buildMonthlyPerformance } from "./analytics";

export function buildDashboardData(trades: Trade[]) {
    const safeTrades = Array.isArray(trades) ? trades : [];

    // ======================
    // 📈 EQUITY CURVE
    // ======================
    const rawEquity = buildEquityCurve(safeTrades);

    const equityValues = rawEquity.map((e) => e.equity);

    const smoothEquity = buildRollingEquity(equityValues, 7);

    const chartData = rawEquity.map((item, i) => ({
        index: i + 1,
        date: item.date, // 🔥 IMPORTANT for XAxis
        equity: item.equity,
        smoothEquity: smoothEquity[i] ?? item.equity,
    }));

    // ======================
    // 📅 MONTHLY PERFORMANCE
    // ======================
    const monthlyData = buildMonthlyPerformance(safeTrades);

    return {
        chartData,
        monthlyData,
    };
}