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

    let totalMinutes = 0;
    let validCount = 0;

    for (const trade of trades) {
        if (!trade.open_time || !trade.close_time) continue;

        const openTime = new Date(trade.open_time).getTime();
        const closeTime = new Date(trade.close_time).getTime();

        // Check for invalid dates
        if (isNaN(openTime) || isNaN(closeTime)) {
            console.warn('Invalid date found:', trade.id, trade.open_time, trade.close_time);
            continue;
        }

        // Ensure close time is after open time
        if (closeTime < openTime) {
            console.warn('Close time before open time:', trade.id);
            continue;
        }

        totalMinutes += (closeTime - openTime) / (1000 * 60);
        validCount++;
    }

    const averageMinutes = validCount === 0 ? 0 : totalMinutes / validCount;

    // Optional: Convert to hours for better readability
    // console.log(`Average holding time: ${averageMinutes.toFixed(2)} minutes (${(averageMinutes/60).toFixed(2)} hours)`);

    return averageMinutes;
}

/**
 * =========================
 * 📊 RRR (Risk Reward Ratio)
 * =========================
 */


// =========================
// 💰 REAL R (Execution Performance)
// =========================

export function calculateTradeRealR(
    trade: Trade,
    balance: number
): number | null {

    if (trade.profit == null || !isFinite(trade.profit)) {
        return null;
    }

    const riskPerTrade = balance * 0.01; // 1% fixed risk

    if (riskPerTrade <= 0) return null;

    return trade.profit / riskPerTrade;
}


// =========================
// 📊 PLANNED RRR (Setup Quality)
// =========================

function calculateTradeRRR(trade: Trade): number | null {

    if (
        trade.stop_loss == null ||
        trade.take_profit == null
    ) {
        return null;
    }

    const entry = trade.entry_price;
    const sl = trade.stop_loss;
    const tp = trade.take_profit;

    let risk: number;
    let reward: number;

    if (trade.type === 'buy') {
        risk = entry - sl;
        reward = tp - entry;
    } else {
        risk = sl - entry;
        reward = entry - tp;
    }

    if (risk <= 0 || reward <= 0) return null;

    return reward / risk;
}


// =========================
// 📈 MAIN METRICS FUNCTION
// =========================

export function calculateRRR(trades: Trade[]) {

    if (!trades.length) {
        return {
            overall: 0,
            win: 0,
            loss: 0,
            realOverall: 0,
        };
    }

    // 🔥 Sort by time (IMPORTANT for equity curve correctness)
    const sortedTrades = [...trades].sort(
        (a, b) =>
            new Date(a.open_time).getTime() -
            new Date(b.open_time).getTime()
    );


    // =========================
    // PLANNED RRR
    // =========================

    const allRRRs: number[] = [];

    for (const trade of sortedTrades) {
        const rrr = calculateTradeRRR(trade);
        if (rrr !== null && isFinite(rrr)) {
            allRRRs.push(rrr);
        }
    }

    const overall = average(allRRRs);


    // =========================
    // WIN / LOSS (PLANNED)
    // =========================

    const wins = sortedTrades.filter(t => (t.profit ?? 0) > 0);
    const losses = sortedTrades.filter(t => (t.profit ?? 0) < 0);

    const winRRRs = wins
        .map(calculateTradeRRR)
        .filter((v): v is number => v !== null && isFinite(v));

    const lossRRRs = losses
        .map(calculateTradeRRR)
        .filter((v): v is number => v !== null && isFinite(v));


    const win = average(winRRRs);

    // ⚠️ NOTE: planned RRR is not meaningful for losses,
    // but we keep it for symmetry
    const loss = average(lossRRRs);


    // =========================
    // REAL R (CORE EDGE METRIC)
    // =========================

    let balance = 5000; // initial balance
    const realR: number[] = [];

    for (const trade of sortedTrades) {

        const risk = balance * 0.01;

        if (risk <= 0) continue;

        const r = (trade.profit ?? 0) / risk;

        if (isFinite(r)) {
            realR.push(r);
        }

        balance += trade.profit ?? 0;
    }


    return {
        overall,
        win,
        loss,
        realOverall: average(realR),
    };
}


// =========================
// 🧠 helper
// =========================

function average(arr: number[]) {
    return arr.length
        ? arr.reduce((a, b) => a + b, 0) / arr.length
        : 0;
}

/**
 * =========================
 * 📉 DRAWDOWN (FIXED VERSION)
 * =========================
 */

export function calculateMaxDrawdownWithDuration(equity: number[]) {
    if (!equity.length) {
        return { maxDrawdown: 0, duration: 0 };
    }

    let peak = equity[0];

    let maxDrawdown = 0;

    let peakIndexAtMaxDD = 0;
    let troughIndexAtMaxDD = 0;

    let tempPeakIndex = 0;

    for (let i = 0; i < equity.length; i++) {

        if (equity[i] > peak) {
            peak = equity[i];
            tempPeakIndex = i;
        }

        const drawdown = peak - equity[i];

        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
            peakIndexAtMaxDD = tempPeakIndex;
            troughIndexAtMaxDD = i;
        }
    }

    const duration = troughIndexAtMaxDD - peakIndexAtMaxDD;

    const percent = peak === 0 ? 0 : (maxDrawdown / peak) * 100;

    return {
        maxDrawdown: Number(percent.toFixed(2)),
        duration: Math.max(0, duration),
    };
}

export function calculateAvgDrawdown(equity: number[]) {
    if (!equity.length) return 0;

    let peak = equity[0];

    const drawdowns: number[] = [];

    let currentDD = 0;

    for (let i = 0; i < equity.length; i++) {

        const value = equity[i];

        if (value > peak) {
            if (currentDD > 0) {
                drawdowns.push(currentDD);
            }
            peak = value;
            currentDD = 0;
        } else {
            if (peak > 0) {
                const dd = ((peak - value) / peak) * 100;
                currentDD = Math.max(currentDD, dd);
            }
        }
    }

    if (currentDD > 0) {
        drawdowns.push(currentDD);
    }

    return drawdowns.length
        ? drawdowns.reduce((a, b) => a + b, 0) / drawdowns.length
        : 0;
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



