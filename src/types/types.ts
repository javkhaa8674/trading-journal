export type Instrument = {
    symbol: string;
    type: "forex" | "metal" | "index" | "crypto";

    // MT5 REAL VALUES
    tickValue: number; // $ per 1 point per 1 lot
    tickSize: number; // minimum price movement
};
