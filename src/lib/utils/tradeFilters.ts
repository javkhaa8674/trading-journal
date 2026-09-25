import { Trade } from "@/types/trade";

/**
 * Жинхэнэ арилжаа эсэх (buy эсвэл sell)
 */
export const isRealTrade = (trade: Trade): boolean =>
  trade.type === "buy" || trade.type === "sell";

/**
 * Балансын бичлэг эсэх (payout, violation, deposit)
 */
export const isBalanceTransaction = (trade: Trade): boolean =>
  trade.type === "payout" ||
  trade.type === "violation" ||
  trade.type === "deposit";

/**
 * Зөвхөн жинхэнэ арилжаануудыг буцаана
 */
export const getRealTrades = (trades: Trade[]): Trade[] =>
  trades.filter(isRealTrade);

/**
 * Зөвхөн балансын бичлэгүүдийг буцаана
 */
export const getBalanceTransactions = (trades: Trade[]): Trade[] =>
  trades.filter(isBalanceTransaction);

/**
 * Төрөл тус бүрээр шүүх
 */
export const getTradesByType = (trades: Trade[], type: string): Trade[] =>
  trades.filter((t) => t.type === type);

/**
 * Нийт payout
 */
export const getTotalPayout = (trades: Trade[]): number =>
  trades
    .filter((t) => t.type === "payout")
    .reduce((sum, t) => sum + t.profit, 0);

/**
 * Нийт violation
 */
export const getTotalViolation = (trades: Trade[]): number =>
  trades
    .filter((t) => t.type === "violation")
    .reduce((sum, t) => sum + t.profit, 0);

/**
 * Нийт deposit
 */
export const getTotalDeposit = (trades: Trade[]): number =>
  trades
    .filter((t) => t.type === "deposit")
    .reduce((sum, t) => sum + t.profit, 0);

/**
 * Нийт арилжааны P/L (зөвхөн buy/sell)
 */
export const getRealTradePL = (trades: Trade[]): number =>
  getRealTrades(trades).reduce((sum, t) => sum + t.profit, 0);

/**
 * Нийт балансын P/L (бүх төрөл)
 */
export const getTotalBalancePL = (trades: Trade[]): number =>
  trades.reduce((sum, t) => sum + t.profit, 0);
