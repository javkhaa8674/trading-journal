import { Trade } from "@/types/trade";

/**
 * =========================
 * 📊 EQUITY CURVE (FIXED)
 * =========================
 */
export function buildEquityCurve(trades: Trade[], balance: number) {
    let equity = balance;
    let peak = balance;
    const result: {
        date: number;
        equity: number;
        drawdown: number;
    }[] = [];

    for (const t of trades) {
        equity += Number(t.profit || 0);

        if (equity > peak) peak = equity;

        const dd = ((equity - peak) / peak) * 100;

        result.push({
            date: new Date(t.close_time!).getTime(),
            equity,
            drawdown: dd,
        });
    }

    return result;
}

/**
 * =========================
 * 📉 EQUITY + DRAWDOWN
 * =========================
 */
export function buildEquityWithDrawdown(trades: Trade[], balance: number) {
    if (!trades || trades.length === 0) {
        return [];
    }

    const sorted = [...trades]
        .filter((t) => t.close_time)
        .sort(
            (a, b) =>
                new Date(a.close_time!).getTime() - new Date(b.close_time!).getTime()
        );

    if (sorted.length === 0) {
        return [];
    }

    let equity = Number(balance);
    let peak = Number(balance);

    return sorted.map((trade) => {
        const profit = Number(trade.profit || 0);

        // Update equity
        equity = Number((equity + profit).toFixed(2));

        // Calculate drawdown percentage (always negative or zero)
        let drawdownPercent = 0;
        if (peak > 0 && equity < peak) {
            drawdownPercent = ((equity - peak) / peak) * 100;
            drawdownPercent = Number(drawdownPercent.toFixed(2));
        }

        // Update peak AFTER calculating drawdown
        if (equity > peak) {
            peak = equity;
        }

        return {
            date: new Date(trade.close_time!).getTime(),
            equity: equity,
            drawdown: drawdownPercent, // Will be 0 or negative
            peak: peak,
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