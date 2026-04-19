import { Trade } from "@/types/trade";

/**
 * =========================
 * 📊 BASIC STATS
 * =========================
 */

export function calculateWinRate(trades: Trade[]) {
    const valid = trades || [];
    const wins = valid.filter(t => (t.profit || 0) > 0);

    return valid.length
        ? (wins.length / valid.length) * 100
        : 0;
}

export function calculateNetProfit(trades: Trade[]) {
    return (trades || []).reduce(
        (sum, t) => sum + Number(t.profit || 0),
        0
    );
}

export function calculateProfitFactor(trades: Trade[]) {
    const wins = trades.filter(t => (t.profit || 0) > 0);
    const losses = trades.filter(t => (t.profit || 0) < 0);

    const grossProfit = wins.reduce(
        (s, t) => s + Number(t.profit || 0),
        0
    );

    const grossLoss = Math.abs(
        losses.reduce(
            (s, t) => s + Number(t.profit || 0),
            0
        )
    );

    return grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
}

/**
 * =========================
 * 📈 ADVANCED STATS
 * =========================
 */

export function calculateAvgWin(trades: Trade[]) {
    const wins = trades.filter(t => (t.profit || 0) > 0);

    return wins.length
        ? wins.reduce((s, t) => s + Number(t.profit || 0), 0) /
        wins.length
        : 0;
}

export function calculateAvgLoss(trades: Trade[]) {
    const losses = trades.filter(t => (t.profit || 0) < 0);

    return losses.length
        ? losses.reduce((s, t) => s + Number(t.profit || 0), 0) /
        losses.length
        : 0;
}

/**
 * =========================
 * 💡 EXPECTANCY
 * =========================
 */

export function calculateExpectancy(trades: Trade[]) {
    const winRate = calculateWinRate(trades) / 100;

    const avgWin = calculateAvgWin(trades);
    const avgLoss = calculateAvgLoss(trades);

    return winRate * avgWin + (1 - winRate) * avgLoss;
}

/**
 * =========================
 * 📦 POSITION SIZE
 * =========================
 */

export function calculateAvgPositionSize(trades: Trade[]) {
    const valid = trades || [];

    return valid.length
        ? valid.reduce((s, t) => s + Number(t.lot_size || 0), 0) /
        valid.length
        : 0;
}

/**
 * =========================
 * ⏱ HOLDING TIME (minutes)
 * =========================
 */

export function calculateAvgHoldingTime(trades: Trade[]) {
    const valid = (trades || []).filter(
        t => t.open_time && t.close_time
    );

    if (!valid.length) return 0;

    const totalMinutes = valid.reduce((sum, t) => {
        const open = new Date(t.open_time).getTime();
        const close = new Date(t.close_time).getTime();

        return sum + (close - open) / 1000 / 60;
    }, 0);

    return totalMinutes / valid.length;
}

/**
 * =========================
 * 📊 RRR (Risk Reward Ratio)
 * =========================
 */

export function calculateRRR(trades: Trade[]) {
    const wins = trades.filter(t => (t.profit || 0) > 0);
    const losses = trades.filter(t => (t.profit || 0) < 0);

    const avgWin = calculateAvgWin(trades);
    const avgLoss = Math.abs(calculateAvgLoss(trades));

    return {
        overall: avgLoss === 0 ? avgWin : avgWin / avgLoss,
        win: avgWin,
        loss: avgLoss,
    };
}

/**
 * =========================
 * 📉 DRAWDOWN (FIXED VERSION)
 * =========================
 */

export function calculateMaxDrawdownWithDuration(equity: number[]) {
    let peak = -Infinity;
    let maxDrawdown = 0;

    let peakIndex = 0;
    let troughIndex = 0;

    for (let i = 0; i < equity.length; i++) {
        if (equity[i] > peak) {
            peak = equity[i];
            peakIndex = i;
        }

        const drawdown = peak - equity[i];

        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
            troughIndex = i;
        }
    }

    const duration = troughIndex - peakIndex;

    const percent =
        peak === 0 ? 0 : (maxDrawdown / peak) * 100;

    return {
        maxDrawdown: Number(percent.toFixed(2)),
        duration,
    };
}

/**
 * =========================
 * 📉 Monthly Performance (FIXED VERSION)
 * =========================
 */

export function buildMonthlyPerformance(trades: Trade[]) {
    const result: Record<string, number> = {};

    (trades || []).forEach((trade) => {
        if (!trade.close_time) return;

        const month = new Date(trade.close_time)
            .toISOString()
            .slice(0, 7); // YYYY-MM

        if (!result[month]) {
            result[month] = 0;
        }

        result[month] += Number(trade.profit || 0);
    });

    return Object.entries(result).map(([month, profit]) => ({
        month,
        profit: Number(profit.toFixed(2)),
    }));
}

export function calculateRiskLimits(trades: Trade[], startingBalance: number) {
    const now = new Date();

    // 📌 DAILY LOSS
    const todayTrades = trades.filter(t =>
        new Date(t.close_time).toDateString() === now.toDateString()
    );

    const todayPnL = todayTrades.reduce((sum, t) => sum + t.profit, 0);

    const dailyLossPercent = (todayPnL / startingBalance) * 100;

    // 📌 EQUITY CURVE
    let equity = startingBalance;
    let peak = startingBalance;

    const equityPoints = trades.map(t => {
        equity += t.profit;
        peak = Math.max(peak, equity);

        const drawdown = ((equity - peak) / peak) * 100;

        return { equity, drawdown };
    });

    const currentEquity = equity;
    const totalDrawdown =
        ((currentEquity - peak) / peak) * 100;

    return {
        dailyLossPercent,
        totalDrawdown,
        dailyBreached: dailyLossPercent <= -5,
        totalBreached: totalDrawdown <= -10,
    };
}