import { Trade } from "@/types/trade";
import { getSafeDateString, getSafeTime } from "@/lib/utils/dateUtils";

/**
 * =========================
 * 📊 BASIC STATS
 * =========================
 */

export function calculateTradeCount(trades: Trade[]) {
    return (trades || []).length;
}

export function calculateWinRate(trades: Trade[]) {
    const valid = trades || [];
    const wins = valid.filter(t => (t.profit || 0) > 0);

    return valid.length
        ? (wins.length / valid.length) * 100
        : 0;
}

export function calculateLossRate(trades: Trade[]) {
    const valid = trades || [];
    const losses = valid.filter(t => (t.profit || 0) < 0);

    return valid.length
        ? (losses.length / valid.length) * 100
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

export function calculateAvgHoldingTime(trades: Trade[]): number {
    if (!trades || trades.length === 0) return 0;

    // Filter trades that have both open_time and close_time
    const valid = trades.filter(t => t.open_time && t.close_time);

    if (valid.length === 0) return 0;

    const totalMinutes = valid.reduce((sum, t) => {
        // ✅ Safe date conversion with fallback
        const openTime = t.open_time ? new Date(t.open_time).getTime() : 0;
        const closeTime = t.close_time ? new Date(t.close_time).getTime() : 0;

        if (openTime === 0 || closeTime === 0) return sum;

        return sum + (closeTime - openTime) / 1000 / 60;
    }, 0);

    return totalMinutes / valid.length;
}

/**
 * =========================
 * 📊 RRR (Risk Reward Ratio)
 * =========================
 */


function calculateTradeRRR(trade: Trade): number | null {
    if (!trade.stop_loss || !trade.take_profit || trade.stop_loss === 0 || trade.take_profit === 0) {
        return null; // RRR тооцоолох боломжгүй
    }

    const entry = trade.entry_price;
    const sl = trade.stop_loss;
    const tp = trade.take_profit;

    let risk: number;
    let reward: number;

    if (trade.type === 'buy') {
        risk = entry - sl;      // Buy-д SL нь entry-ээс доогуур
        reward = tp - entry;    // TP нь entry-ээс дээш
    } else { // sell
        risk = sl - entry;      // Sell-д SL нь entry-ээс дээш
        reward = entry - tp;    // TP нь entry-ээс доош
    }

    if (risk <= 0) return null;

    return reward / risk; // RRR = Reward / Risk
}

export function calculateRRR(trades: Trade[]) {
    if (!trades.length) {
        return {
            overall: 0,
            win: 0,
            loss: 0,
        };
    }

    // Бодит ашиг/алдагдалаар ерөнхий RRR тооцох
    const winsByProfit = trades.filter(t => (t.profit || 0) > 0);
    const lossesByProfit = trades.filter(t => (t.profit || 0) < 0);

    const totalWinAmount = winsByProfit.reduce((sum, t) => sum + (t.profit || 0), 0);
    const totalLossAmount = Math.abs(lossesByProfit.reduce((sum, t) => sum + (t.profit || 0), 0));

    const avgWinByProfit = winsByProfit.length ? totalWinAmount / winsByProfit.length : 0;
    const avgLossByProfit = lossesByProfit.length ? totalLossAmount / lossesByProfit.length : 0;

    const overall = avgLossByProfit === 0 ? avgWinByProfit : avgWinByProfit / avgLossByProfit;

    // === Ашигтай арилжаануудын дундаж RRR (planned RRR-ээр) ===
    const wins = trades.filter(t => (t.profit || 0) > 0);
    const winRRRs: number[] = [];
    wins.forEach(trade => {
        const rrr = calculateTradeRRR(trade);
        if (rrr !== null) winRRRs.push(rrr);
    });
    const win = winRRRs.length ? winRRRs.reduce((a, b) => a + b, 0) / winRRRs.length : 0;

    // === Алдагдалтай арилжаануудын дундаж RRR (planned RRR-ээр) ===
    const losses = trades.filter(t => (t.profit || 0) < 0);
    const lossRRRs: number[] = [];
    losses.forEach(trade => {
        const rrr = calculateTradeRRR(trade);
        if (rrr !== null) lossRRRs.push(rrr);
    });
    const loss = lossRRRs.length ? lossRRRs.reduce((a, b) => a + b, 0) / lossRRRs.length : 0;

    return {
        overall,  // Бодит ашиг/алдагдалаар тооцсон ерөнхий RRR
        win,      // Ашигтай арилжаануудын дундаж planned RRR
        loss,     // Алдагдалтай арилжаануудын дундаж planned RRR
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

export function calculateAvgDrawdown(equity: number[]) {
    if (!equity.length) return 0;

    let peak = equity[0];

    let currentDrawdown = 0;
    let inDrawdown = false;

    const drawdownEvents: number[] = [];

    for (let i = 0; i < equity.length; i++) {
        const value = equity[i];

        if (value > peak) {
            // recovery
            if (inDrawdown) {
                drawdownEvents.push(currentDrawdown);
                currentDrawdown = 0;
                inDrawdown = false;
            }
            peak = value;
        } else {
            const dd = ((peak - value) / peak) * 100;

            inDrawdown = true;
            currentDrawdown = Math.max(currentDrawdown, dd);
        }
    }

    // last event
    if (inDrawdown) {
        drawdownEvents.push(currentDrawdown);
    }

    if (!drawdownEvents.length) return 0;

    return (
        drawdownEvents.reduce((a, b) => a + b, 0) /
        drawdownEvents.length
    );
}

/**
 * =========================
 * 📉 Monthly Performance (FIXED VERSION)
 * =========================
 */

export function buildMonthlyPerformance(trades: Trade[]) {
    const result: Record<
        string,
        { profit: number; count: number }
    > = {};

    (trades || []).forEach((trade) => {
        if (!trade.close_time) return;

        const month = new Date(trade.close_time)
            .toISOString()
            .slice(0, 7); // YYYY-MM

        if (!result[month]) {
            result[month] = {
                profit: 0,
                count: 0,
            };
        }

        result[month].profit += Number(trade.profit || 0);
        result[month].count += 1;
    });

    return Object.entries(result).map(
        ([month, value]) => ({
            month,
            profit: Number(value.profit.toFixed(2)),
            count: value.count,
        }),
    );
}

// lib/analytics.ts

// lib/analytics.ts


export function calculateRiskLimits(trades: Trade[], startingBalance: number) {
    // Return default values if no trades
    if (!trades || trades.length === 0) {
        return {
            dailyLossPercent: 0,
            totalDrawdown: 0,
            dailyBreached: false,
            totalBreached: false,
        };
    }

    const now = new Date();
    const todayDateString = now.toDateString();

    // 📌 DAILY LOSS - filter trades with valid close_time
    const todayTrades = trades.filter(trade => {
        if (!trade.close_time) return false;
        const closeDateString = getSafeDateString(trade.close_time);
        return closeDateString === todayDateString;
    });

    const todayPnL = todayTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
    const dailyLossPercent = startingBalance > 0 ? (todayPnL / startingBalance) * 100 : 0;

    // 📌 EQUITY CURVE & DRAWDOWN
    let equity = startingBalance;
    let peak = startingBalance;

    for (const trade of trades) {
        equity += (trade.profit || 0);
        if (equity > peak) {
            peak = equity;
        }
    }

    const totalDrawdown = peak > 0 ? ((equity - peak) / peak) * 100 : 0;

    return {
        dailyLossPercent: Number(dailyLossPercent.toFixed(2)),
        totalDrawdown: Number(totalDrawdown.toFixed(2)),
        dailyBreached: dailyLossPercent <= -5,
        totalBreached: totalDrawdown <= -10,
    };
}



