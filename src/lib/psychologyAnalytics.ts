import { PsychologyEntry } from "@/types/psychology";
type Entry = PsychologyEntry;

export function analyzePsychology(entries: Entry[]) {
    if (!entries.length) return null;

    const moodStats: Record<string, { pnl: number; count: number }> = {};
    const mistakeCount: Record<string, number> = {};
    const confidenceStats: Record<number, { win: number; total: number }> = {};

    let totalPnL = 0;

    entries.forEach((e) => {
        // Mood vs PnL
        if (!moodStats[e.mood]) {
            moodStats[e.mood] = { pnl: 0, count: 0 };
        }
        moodStats[e.mood].pnl += e.profit_loss;
        moodStats[e.mood].count++;

        // Mistakes
        e.mistakes.forEach((m) => {
            mistakeCount[m] = (mistakeCount[m] || 0) + 1;
        });

        // Confidence vs winrate
        const c = e.confidence_level;
        if (!confidenceStats[c]) {
            confidenceStats[c] = { win: 0, total: 0 };
        }
        confidenceStats[c].win += e.winning_trades;
        confidenceStats[c].total += e.trades_count;

        totalPnL += e.profit_loss;
    });

    // Avg pnl per mood
    const moodAvg = Object.entries(moodStats).map(([mood, v]) => ({
        mood,
        avgPnl: v.pnl / v.count,
    }));

    // Best / Worst mood
    const bestMood = moodAvg.sort((a, b) => b.avgPnl - a.avgPnl)[0];
    const worstMood = moodAvg.sort((a, b) => a.avgPnl - b.avgPnl)[0];

    // Most common mistake
    const topMistake = Object.entries(mistakeCount).sort(
        (a, b) => b[1] - a[1],
    )[0];

    // Best confidence
    const confidenceWinrate = Object.entries(confidenceStats).map(
        ([level, v]) => ({
            level: Number(level),
            winrate: v.total > 0 ? v.win / v.total : 0,
        }),
    );

    const bestConfidence = confidenceWinrate.sort(
        (a, b) => b.winrate - a.winrate,
    )[0];

    return {
        totalPnL,
        bestMood,
        worstMood,
        topMistake,
        bestConfidence,
    };
}


// Helper maps
const moodMap: Record<string, string> = {
    calm: "Тайван",
    anxious: "Түгшсэн",
    confident: "Итгэлтэй",
    fearful: "Айсан",
    greedy: "Шунахай",
    frustrated: "Ууртай",
};

export function generateSummary(
    result: ReturnType<typeof analyzePsychology>,
    getMistakeName?: (id: string) => string,
) {
    if (!result) return "Өгөгдөл алга";

    const moodMap: Record<string, string> = {
        calm: "Тайван",
        anxious: "Түгшсэн",
        confident: "Итгэлтэй",
        fearful: "Айсан",
        greedy: "Шунахай",
        frustrated: "Ууртай",
    };

    const bestMood = moodMap[result.bestMood?.mood] || result.bestMood?.mood;
    const worstMood = moodMap[result.worstMood?.mood] || result.worstMood?.mood;

    const bestMoodPnl = result.bestMood?.avgPnl?.toFixed(2);
    const worstMoodPnl = result.worstMood?.avgPnl?.toFixed(2);

    const mistake = result.topMistake
        ? getMistakeName
            ? getMistakeName(result.topMistake[0])
            : result.topMistake[0]
        : "—";

    const confidenceLevel = result.bestConfidence?.level;
    const confidenceWinrate = (
        (result.bestConfidence?.winrate || 0) * 100
    ).toFixed(0);

    const totalPnL = result.totalPnL.toFixed(2);

    // Dynamic advice
    let extraAdvice = "";

    if (result.totalPnL < 0) {
        extraAdvice += "\n• Ерөнхийдөө алдагдалтай байна → стратеги болон discipline-аа дахин хяна";
    }

    if (result.worstMood?.avgPnl < 0) {
        extraAdvice += `\n• ${worstMood} үед тогтмол алдагдал гаргаж байна → энэ үед trade хийхийг хоригло`;
    }

    if (result.bestConfidence?.winrate < 0.5) {
        extraAdvice += "\n• Итгэл өндөр ч winrate бага байна → overconfidence байж болзошгүй";
    }

    return `
📊 ЕРӨНХИЙ ГҮЙЦЭТГЭЛ:
• Нийт ашиг/алдагдал: ${totalPnL} USD

😊 СЭТГЭЛ САНАА & ГҮЙЦЭТГЭЛ:
• Хамгийн сайн үе: ${bestMood} (дундаж ${bestMoodPnl}$)
• Хамгийн муу үе: ${worstMood} (дундаж ${worstMoodPnl}$)

⚠️ АЛДААНЫ ШИНЖИЛГЭЭ:
• Хамгийн их давтагдсан алдаа: ${mistake}

🧠 PERFORMANCE INSIGHT:
• Итгэл ${confidenceLevel}+ үед winrate ≈ ${confidenceWinrate}%
• Өндөр confidence үед илүү сайн/муу trade хийж байгаа pattern ажиглагдаж байна

🚨 RISK АНХААРУУЛГА:
• Сэтгэл хөдлөл performance-д шууд нөлөөлж байна
• Discipline алдагдсан үед алдагдал нэмэгдэж байна

💡 ACTION PLAN:
• ${worstMood} үед арилжаа хийхээс зайлсхий
• ${confidenceLevel}+ үед л илүү идэвхтэй trade хий
• ${mistake} алдааг системтэйгээр багасга
${extraAdvice}

📌 ДҮГНЭЛТ:
Чиний амжилт strategy-с илүүтэй сэтгэлзүйгээс хамаарч байна.
Сэтгэл хөдлөлөө тогтвортой байлгаж чадвал performance мэдэгдэхүйц сайжирна.
`;
}