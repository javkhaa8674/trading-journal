// src/types/tradingview.ts

export interface PositionData {
    entry: number;
    tp: number;
    sl: number;
}

export interface TradingViewWidgetOptions {
    symbol?: string;
    interval?: string;
    theme?: "light" | "dark";
    locale?: string;
    container_id?: string;
    width?: number | string;
    height?: number | string;
    // ... бусад option-ууд
}

declare global {
    interface Window {
        TradingView: any;
    }
}
