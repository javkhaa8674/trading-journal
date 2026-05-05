export type PsychologyEntry = {
    id: string;
    date: string;
    mood: "calm" | "anxious" | "confident" | "fearful" | "greedy" | "frustrated";
    confidence_level: number;
    mistakes: string[];
    lesson_learned: string;
    notes: string;
    trades_count: number;
    winning_trades: number;
    losing_trades: number;
    profit_loss: number;
};

export type Mistake = {
    id: string;
    name: string;
    nameMn: string;
    category: string;
    categoryMn: string;
};



