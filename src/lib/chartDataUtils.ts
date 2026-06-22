// src/lib/chartDataUtils.ts
import { format, fromUnixTime, isDate, parseISO } from "date-fns";
import { Trade } from "@/types/trade";

export interface CandleData {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

// Date-г string болгон хөрвүүлэх туслах функц
const convertDateToString = (date: Date | string | number): string => {
    if (date instanceof Date) {
        return date.toISOString();
    }
    if (typeof date === "number") {
        return fromUnixTime(date).toISOString();
    }
    return date;
};

// Date-г харьцуулах функц
const compareDates = (
    a: Date | string | number,
    b: Date | string | number,
): number => {
    const dateA = new Date(convertDateToString(a));
    const dateB = new Date(convertDateToString(b));
    return dateA.getTime() - dateB.getTime();
};

export function aggregateTradesToCandles(
    trades: Trade[],
    timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w",
): CandleData[] {
    if (!trades || trades.length === 0) return [];

    // Зөвхөн close_time-тай trade-уудыг шүүх
    const closedTrades = trades.filter((t) =>
        t.close_time !== undefined && t.close_time !== null
    );

    if (closedTrades.length === 0) {
        // Хэрэв close_time байхгүй бол open_time-г ашиглах
        return aggregateByOpenTime(trades, timeframe);
    }

    // Timeframe-аар бүлэглэх
    const groups = groupByTimeframe(closedTrades, timeframe);

    // Бүлэг бүрээс OHLC үүсгэх
    const candles: CandleData[] = [];

    Object.keys(groups).forEach((key) => {
        const group = groups[key];
        if (group.length === 0) return;

        // Эхний trade-ийн entry_price -> open
        const open = group[0].entry_price;
        // Сүүлийн trade-ийн exit_price -> close
        const close = group[group.length - 1].exit_price;
        // Хамгийн их price -> high
        const high = Math.max(
            ...group.map((t) => Math.max(t.entry_price, t.exit_price)),
        );
        // Хамгийн бага price -> low
        const low = Math.min(
            ...group.map((t) => Math.min(t.entry_price, t.exit_price)),
        );

        candles.push({
            time: key,
            open,
            high,
            low,
            close,
            volume: group.length,
        });
    });

    return candles.sort((a, b) => a.time.localeCompare(b.time));
}

// close_time байхгүй үед open_time-аар агрегат хийх
function aggregateByOpenTime(trades: Trade[], timeframe: string): CandleData[] {
    const groups: { [key: string]: Trade[] } = {};

    trades.forEach((trade) => {
        const date = new Date(convertDateToString(trade.open_time));
        const key = getTimeframeKey(date, timeframe);

        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(trade);
    });

    const candles: CandleData[] = [];

    Object.keys(groups).forEach((key) => {
        const group = groups[key];
        if (group.length === 0) return;

        const open = group[0].entry_price;
        const close = group[group.length - 1].exit_price;
        const high = Math.max(
            ...group.map((t) => Math.max(t.entry_price, t.exit_price)),
        );
        const low = Math.min(
            ...group.map((t) => Math.min(t.entry_price, t.exit_price)),
        );

        candles.push({
            time: key,
            open,
            high,
            low,
            close,
            volume: group.length,
        });
    });

    return candles.sort((a, b) => a.time.localeCompare(b.time));
}

function groupByTimeframe(
    trades: Trade[],
    timeframe: string,
): { [key: string]: Trade[] } {
    const groups: { [key: string]: Trade[] } = {};

    trades.forEach((trade) => {
        // close_time байхгүй бол open_time ашиглах
        const timeValue = trade.close_time || trade.open_time;
        const date = new Date(convertDateToString(timeValue));
        const key = getTimeframeKey(date, timeframe);

        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(trade);
    });

    return groups;
}

function getTimeframeKey(date: Date, timeframe: string): string {
    switch (timeframe) {
        case "1m":
            return format(date, "yyyy-MM-dd HH:mm");
        case "5m": {
            const minutes = Math.floor(date.getMinutes() / 5) * 5;
            const d = new Date(date);
            d.setMinutes(minutes);
            return format(d, "yyyy-MM-dd HH:mm");
        }
        case "15m": {
            const minutes = Math.floor(date.getMinutes() / 15) * 15;
            const d = new Date(date);
            d.setMinutes(minutes);
            return format(d, "yyyy-MM-dd HH:mm");
        }
        case "1h":
            return format(date, "yyyy-MM-dd HH:00");
        case "4h": {
            const hours = Math.floor(date.getHours() / 4) * 4;
            const d = new Date(date);
            d.setHours(hours);
            d.setMinutes(0);
            return format(d, "yyyy-MM-dd HH:00");
        }
        case "1d":
            return format(date, "yyyy-MM-dd");
        case "1w": {
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(date);
            monday.setDate(diff);
            return format(monday, "yyyy-MM-dd");
        }
        default:
            return format(date, "yyyy-MM-dd");
    }
}

// Trade-ийг OHLC өгөгдөл болгон хөрвүүлэх (бүлэглэлгүйгээр)
export function tradesToChartData(trades: Trade[]): CandleData[] {
    if (!trades || trades.length === 0) return [];

    // close_time-аар эрэмбэлэх, байхгүй бол open_time-аар
    const sorted = [...trades].sort((a, b) => {
        const timeA = a.close_time || a.open_time;
        const timeB = b.close_time || b.open_time;
        return compareDates(timeA, timeB);
    });

    return sorted.map((trade) => ({
        time: format(
            new Date(convertDateToString(trade.close_time || trade.open_time)),
            "yyyy-MM-dd HH:mm:ss",
        ),
        open: trade.entry_price,
        high: Math.max(trade.entry_price, trade.exit_price),
        low: Math.min(trade.entry_price, trade.exit_price),
        close: trade.exit_price,
        volume: trade.lot_size || 1,
    }));
}
