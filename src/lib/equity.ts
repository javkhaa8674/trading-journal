import { Trade } from "@/types/trade";

/**
 * =========================
 * 📊 EQUITY CURVE (FIXED)
 * =========================
 */
export function buildEquityCurve(trades: Trade[]) {
    const sorted = [...(trades || [])]
        .filter((t) => t.close_time)
        .sort(
            (a, b) =>
                new Date(a.close_time!).getTime() -
                new Date(b.close_time!).getTime()
        );

    let equity = 0;

    return sorted.map((trade) => {
        equity += Number(trade.profit || 0);

        return {
            date: trade.close_time,
            equity,
        };
    });
}

/**
 * =========================
 * 📉 EQUITY + DRAWDOWN
 * =========================
 */
export function buildEquityWithDrawdown(trades: Trade[]) {
    const sorted = [...(trades || [])]
        .filter((t) => t.close_time)
        .sort(
            (a, b) =>
                new Date(a.close_time!).getTime() -
                new Date(b.close_time!).getTime()
        );

    let equity = 0;
    let peak = 0;

    return sorted.map((trade) => {
        equity += Number(trade.profit || 0);

        if (equity > peak) peak = equity;

        const drawdown = equity - peak;

        return {
            date: trade.close_time,
            equity,
            drawdown,
            peak,
        };
    });
}

/**
 * =========================
 * 📈 ROLLING EQUITY (SAFE)
 * =========================
 */
export function buildRollingEquity(values: number[], window = 5) {
    const result: number[] = [];

    for (let i = 0; i < values.length; i++) {
        const start = Math.max(0, i - window + 1);
        const slice = values.slice(start, i + 1);

        const avg =
            slice.reduce((sum, val) => sum + val, 0) / slice.length;

        result.push(Number(avg.toFixed(2)));
    }

    return result;
}