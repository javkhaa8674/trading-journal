import { Trade } from "@/types/trade";

import { buildEquityCurve, buildRollingEquity } from "./equity";

export function buildDashboardData(trades: Trade[], balance: number = 5000) {
    const safeTrades = Array.isArray(trades) ? trades : [];
    // ======================
    // 📈 EQUITY CURVE
    // ======================
    const rawEquity = buildEquityCurve(safeTrades, balance);

    // ✅ date property-ээр эрэмбэлэх (эртнээс хойш)
    const sortedEquity = [...rawEquity].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const equityValues = sortedEquity.map((e) => e.equity);
    const smoothEquity = buildRollingEquity(equityValues, 7);

    const chartData = sortedEquity.map((item, i) => ({
        index: i + 1,
        date: new Date(item.date).toISOString(),
        equity: item.equity,
        smoothEquity: smoothEquity[i] ?? item.equity,
    }));


    return {
        chartData,
    };
}