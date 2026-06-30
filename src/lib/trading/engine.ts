import { Instrument } from "@/types/types";

export function calcLotSize(
    risk: number,
    slDistance: number,
    instrument: Instrument,
) {
    if (!slDistance || slDistance <= 0) return 0;

    const ticks = slDistance / instrument.tickSize;
    const lossPerLot = ticks * instrument.tickValue;

    if (!lossPerLot) return 0;

    const lot = risk / lossPerLot;

    return Number.isFinite(lot) ? lot : 0;
}

export function calcRR(entry: number, tp: number, sl: number) {
    const tpDist = Math.abs(tp - entry);
    const slDist = Math.abs(entry - sl);

    if (!slDist) return 0;

    return Number((tpDist / slDist).toFixed(2));
}
