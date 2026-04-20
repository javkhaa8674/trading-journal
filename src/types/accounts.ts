export type Account = {
    id: string;
    broker: string;
    name: string;
    mode: "live" | "demo" | "backtest";
    balance: number;
};