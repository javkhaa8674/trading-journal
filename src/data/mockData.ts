// src/data/mockData.ts

export interface CandleData {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

// EUR/USD жишээ өгөгдөл - 2024 оны 1-р сарын өгөгдөл
export const FOREX_MOCK_DATA: CandleData[] = [
    {
        time: "2024-01-02",
        open: 1.1045,
        high: 1.1055,
        low: 1.1035,
        close: 1.1048,
        volume: 1200,
    },
    {
        time: "2024-01-03",
        open: 1.1048,
        high: 1.1060,
        low: 1.1040,
        close: 1.1055,
        volume: 1350,
    },
    {
        time: "2024-01-04",
        open: 1.1055,
        high: 1.1070,
        low: 1.1045,
        close: 1.1062,
        volume: 1100,
    },
    {
        time: "2024-01-05",
        open: 1.1062,
        high: 1.1075,
        low: 1.1050,
        close: 1.1068,
        volume: 1450,
    },
    {
        time: "2024-01-08",
        open: 1.1068,
        high: 1.1080,
        low: 1.1055,
        close: 1.1072,
        volume: 1300,
    },
    {
        time: "2024-01-09",
        open: 1.1072,
        high: 1.1090,
        low: 1.1065,
        close: 1.1085,
        volume: 1500,
    },
    {
        time: "2024-01-10",
        open: 1.1085,
        high: 1.1095,
        low: 1.1070,
        close: 1.1080,
        volume: 1250,
    },
    {
        time: "2024-01-11",
        open: 1.1080,
        high: 1.1090,
        low: 1.1065,
        close: 1.1075,
        volume: 1400,
    },
    {
        time: "2024-01-12",
        open: 1.1075,
        high: 1.1088,
        low: 1.1060,
        close: 1.1070,
        volume: 1350,
    },
    {
        time: "2024-01-15",
        open: 1.1070,
        high: 1.1085,
        low: 1.1055,
        close: 1.1062,
        volume: 1280,
    },
    {
        time: "2024-01-16",
        open: 1.1062,
        high: 1.1075,
        low: 1.1050,
        close: 1.1058,
        volume: 1420,
    },
    {
        time: "2024-01-17",
        open: 1.1058,
        high: 1.1068,
        low: 1.1040,
        close: 1.1045,
        volume: 1550,
    },
    {
        time: "2024-01-18",
        open: 1.1045,
        high: 1.1060,
        low: 1.1035,
        close: 1.1052,
        volume: 1380,
    },
    {
        time: "2024-01-19",
        open: 1.1052,
        high: 1.1065,
        low: 1.1040,
        close: 1.1050,
        volume: 1220,
    },
    {
        time: "2024-01-22",
        open: 1.1050,
        high: 1.1062,
        low: 1.1040,
        close: 1.1055,
        volume: 1150,
    },
    {
        time: "2024-01-23",
        open: 1.1055,
        high: 1.1070,
        low: 1.1050,
        close: 1.1065,
        volume: 1480,
    },
    {
        time: "2024-01-24",
        open: 1.1065,
        high: 1.1080,
        low: 1.1060,
        close: 1.1078,
        volume: 1520,
    },
    {
        time: "2024-01-25",
        open: 1.1078,
        high: 1.1095,
        low: 1.1070,
        close: 1.1090,
        volume: 1600,
    },
    {
        time: "2024-01-26",
        open: 1.1090,
        high: 1.1100,
        low: 1.1080,
        close: 1.1092,
        volume: 1450,
    },
    {
        time: "2024-01-29",
        open: 1.1092,
        high: 1.1105,
        low: 1.1085,
        close: 1.1098,
        volume: 1380,
    },
    {
        time: "2024-01-30",
        open: 1.1098,
        high: 1.1110,
        low: 1.1090,
        close: 1.1105,
        volume: 1550,
    },
    {
        time: "2024-01-31",
        open: 1.1105,
        high: 1.1120,
        low: 1.1100,
        close: 1.1115,
        volume: 1650,
    },
];

// Илүү их өгөгдөлтэй жишээ (2 сарын өгөгдөл)
export const generateForexMockData = (days: number = 60): CandleData[] => {
    const data: CandleData[] = [];
    const startDate = new Date("2024-01-01");
    let price = 1.1000;

    for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);

        // Forex-н хөдөлгөөнтэй төстэй random өгөгдөл
        const change = (Math.random() - 0.48) * 0.004; // ~0.4% дотор хэлбэлзэл
        const open = price;
        const close = price + change;
        const high = Math.max(open, close) + Math.random() * 0.002;
        const low = Math.min(open, close) - Math.random() * 0.002;
        price = close;

        data.push({
            time: date.toISOString().split("T")[0],
            open: Math.round(open * 10000) / 10000,
            high: Math.round(high * 10000) / 10000,
            low: Math.round(low * 10000) / 10000,
            close: Math.round(close * 10000) / 10000,
            volume: Math.floor(1000 + Math.random() * 800),
        });
    }

    return data;
};

// Өөр валютын хосын жишээ (GBP/USD)
export const GBPUSD_MOCK_DATA: CandleData[] = [
    {
        time: "2024-01-02",
        open: 1.2735,
        high: 1.2750,
        low: 1.2720,
        close: 1.2742,
    },
    {
        time: "2024-01-03",
        open: 1.2742,
        high: 1.2755,
        low: 1.2725,
        close: 1.2735,
    },
    {
        time: "2024-01-04",
        open: 1.2735,
        high: 1.2760,
        low: 1.2728,
        close: 1.2752,
    },
    {
        time: "2024-01-05",
        open: 1.2752,
        high: 1.2775,
        low: 1.2745,
        close: 1.2768,
    },
    {
        time: "2024-01-08",
        open: 1.2768,
        high: 1.2780,
        low: 1.2755,
        close: 1.2772,
    },
    {
        time: "2024-01-09",
        open: 1.2772,
        high: 1.2790,
        low: 1.2765,
        close: 1.2785,
    },
    {
        time: "2024-01-10",
        open: 1.2785,
        high: 1.2795,
        low: 1.2770,
        close: 1.2780,
    },
    {
        time: "2024-01-11",
        open: 1.2780,
        high: 1.2790,
        low: 1.2765,
        close: 1.2775,
    },
    {
        time: "2024-01-12",
        open: 1.2775,
        high: 1.2788,
        low: 1.2760,
        close: 1.2770,
    },
    {
        time: "2024-01-15",
        open: 1.2770,
        high: 1.2785,
        low: 1.2755,
        close: 1.2762,
    },
    {
        time: "2024-01-16",
        open: 1.2762,
        high: 1.2775,
        low: 1.2750,
        close: 1.2758,
    },
    {
        time: "2024-01-17",
        open: 1.2758,
        high: 1.2768,
        low: 1.2740,
        close: 1.2745,
    },
    {
        time: "2024-01-18",
        open: 1.2745,
        high: 1.2760,
        low: 1.2735,
        close: 1.2752,
    },
    {
        time: "2024-01-19",
        open: 1.2752,
        high: 1.2765,
        low: 1.2740,
        close: 1.2750,
    },
    {
        time: "2024-01-22",
        open: 1.2750,
        high: 1.2762,
        low: 1.2740,
        close: 1.2755,
    },
    {
        time: "2024-01-23",
        open: 1.2755,
        high: 1.2770,
        low: 1.2750,
        close: 1.2765,
    },
    {
        time: "2024-01-24",
        open: 1.2765,
        high: 1.2780,
        low: 1.2760,
        close: 1.2778,
    },
    {
        time: "2024-01-25",
        open: 1.2778,
        high: 1.2795,
        low: 1.2770,
        close: 1.2790,
    },
    {
        time: "2024-01-26",
        open: 1.2790,
        high: 1.2800,
        low: 1.2780,
        close: 1.2792,
    },
    {
        time: "2024-01-29",
        open: 1.2792,
        high: 1.2805,
        low: 1.2785,
        close: 1.2798,
    },
    {
        time: "2024-01-30",
        open: 1.2798,
        high: 1.2810,
        low: 1.2790,
        close: 1.2805,
    },
    {
        time: "2024-01-31",
        open: 1.2805,
        high: 1.2820,
        low: 1.2800,
        close: 1.2815,
    },
];
