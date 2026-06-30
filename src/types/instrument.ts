import { Instrument } from "./types";

export const instruments: Instrument[] = [
    // ================= FOREX MAJORS =================
    { symbol: "EURUSD", type: "forex", tickValue: 10, tickSize: 0.0001 },
    { symbol: "GBPUSD", type: "forex", tickValue: 10, tickSize: 0.0001 },
    { symbol: "USDJPY", type: "forex", tickValue: 9.5, tickSize: 0.01 },
    { symbol: "USDCHF", type: "forex", tickValue: 10, tickSize: 0.0001 },
    { symbol: "AUDUSD", type: "forex", tickValue: 10, tickSize: 0.0001 },
    { symbol: "NZDUSD", type: "forex", tickValue: 10, tickSize: 0.0001 },
    { symbol: "USDCAD", type: "forex", tickValue: 10, tickSize: 0.0001 },
    { symbol: "EURGBP", type: "forex", tickValue: 10, tickSize: 0.0001 },
    { symbol: "EURJPY", type: "forex", tickValue: 9.5, tickSize: 0.01 },
    { symbol: "EURCHF", type: "forex", tickValue: 10, tickSize: 0.0001 },
    { symbol: "EURAUD", type: "forex", tickValue: 10, tickSize: 0.0001 },
    { symbol: "EURCAD", type: "forex", tickValue: 10, tickSize: 0.0001 },
    { symbol: "EURNZD", type: "forex", tickValue: 10, tickSize: 0.0001 },

    { symbol: "GBPJPY", type: "forex", tickValue: 9.5, tickSize: 0.01 },
    { symbol: "GBPCHF", type: "forex", tickValue: 10, tickSize: 0.0001 },
    { symbol: "GBPCAD", type: "forex", tickValue: 10, tickSize: 0.0001 },

    { symbol: "AUDJPY", type: "forex", tickValue: 9.5, tickSize: 0.01 },
    { symbol: "AUDCAD", type: "forex", tickValue: 10, tickSize: 0.0001 },
    { symbol: "AUDNZD", type: "forex", tickValue: 10, tickSize: 0.0001 },

    { symbol: "CADJPY", type: "forex", tickValue: 9.5, tickSize: 0.01 },
    { symbol: "CHFJPY", type: "forex", tickValue: 9.5, tickSize: 0.01 },
    { symbol: "USDTRY", type: "forex", tickValue: 1, tickSize: 0.0001 },
    { symbol: "USDMXN", type: "forex", tickValue: 1, tickSize: 0.0001 },
    { symbol: "USDZAR", type: "forex", tickValue: 1, tickSize: 0.0001 },
    { symbol: "USDSEK", type: "forex", tickValue: 10, tickSize: 0.0001 },
    { symbol: "USDNOK", type: "forex", tickValue: 10, tickSize: 0.0001 },
    { symbol: "USDPLN", type: "forex", tickValue: 10, tickSize: 0.0001 },
    // ================= METALS =================
    { symbol: "XAUUSD", type: "metal", tickValue: 1, tickSize: 0.01 },
    { symbol: "XAGUSD", type: "metal", tickValue: 0.5, tickSize: 0.01 },
    { symbol: "XPTUSD", type: "metal", tickValue: 1, tickSize: 0.01 },
    { symbol: "XPDUSD", type: "metal", tickValue: 1, tickSize: 0.01 },
    // ================= INDICES =================
    { symbol: "US30", type: "index", tickValue: 1, tickSize: 1 },
    { symbol: "NAS100", type: "index", tickValue: 1, tickSize: 0.1 },
    { symbol: "SPX500", type: "index", tickValue: 1, tickSize: 0.1 },

    { symbol: "GER40", type: "index", tickValue: 1, tickSize: 0.1 },
    { symbol: "UK100", type: "index", tickValue: 1, tickSize: 0.1 },
    { symbol: "JPN225", type: "index", tickValue: 1, tickSize: 1 },

    { symbol: "AUS200", type: "index", tickValue: 1, tickSize: 0.1 },
    { symbol: "HK50", type: "index", tickValue: 1, tickSize: 0.1 },
    // ================= CRYPTO =================
    { symbol: "BTCUSD", type: "crypto", tickValue: 1, tickSize: 0.1 },
    { symbol: "ETHUSD", type: "crypto", tickValue: 1, tickSize: 0.01 },

    { symbol: "BNBUSD", type: "crypto", tickValue: 1, tickSize: 0.01 },
    { symbol: "XRPUSD", type: "crypto", tickValue: 1, tickSize: 0.0001 },
    { symbol: "SOLUSD", type: "crypto", tickValue: 1, tickSize: 0.01 },
    { symbol: "ADAUSD", type: "crypto", tickValue: 1, tickSize: 0.0001 },
    { symbol: "DOGEUSD", type: "crypto", tickValue: 1, tickSize: 0.0001 },
    { symbol: "AVAXUSD", type: "crypto", tickValue: 1, tickSize: 0.01 },
];
