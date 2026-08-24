// src/lib/analytics/psychologyAnalytics.ts

// 🆕 R-Multiple тооцоолох helper
function getRMultiple(trade: any): number {
  if (!trade.profit) return 0;

  // Entry болон SL байгаа эсэхийг шалгах
  if (trade.entry_price && trade.stop_loss) {
    const risk = Math.abs(trade.entry_price - trade.stop_loss);
    // Forex-д risk нь ихэвчлэн 0.001 - 0.1 хооронд байна
    if (risk > 0.0001 && risk < 1) {
      return parseFloat((trade.profit / risk).toFixed(2));
    }
  }

  // Хэрэв profit хэт их бол (100-с их) 100-д хуваах
  if (Math.abs(trade.profit) > 100) {
    return parseFloat((trade.profit / 100).toFixed(2));
  }

  // Бусад тохиолдолд 0
  return 0;
}

export function calculatePsychologyAnalytics(
  trades: any[],
  psychologyData: any[],
) {
  // ✅ Psychology-тэй trade-г шүүх
  const tradesWithPsychology = trades.filter((trade) => {
    return psychologyData.some((p) => p.trade_id === trade.id);
  });

  // ✅ Хамгийн багадаа 3 trade байх ёстой
  if (tradesWithPsychology.length < 3) {
    return {
      fomoAnalysis: {
        fomo: { count: 0, winRate: "0", avgR: "0" },
        noFomo: { count: 0, winRate: "0", avgR: "0" },
      },
      calmnessImpact: [],
      anxietyImpact: [],
      confidenceImpact: [],
      fearImpact: [],
      greedImpact: [],
      frustrationImpact: [],
      keyInsight: `Хангалттай мэдээлэл байхгүй байна. (${tradesWithPsychology.length}/3 trade)`,
      recommendation: "Илүү их trade-д psychology мэдээлэл бүртгэнэ үү.",
    };
  }

  // ============================================================
  // 1. FOMO Analysis
  // ============================================================

  const fomoTrades: any[] = [];
  const noFomoTrades: any[] = [];

  tradesWithPsychology.forEach((trade) => {
    const psych = psychologyData.find((p) => p.trade_id === trade.id);
    if (psych) {
      if (psych.fomo === true) fomoTrades.push(trade);
      else noFomoTrades.push(trade);
    }
  });

  const fomoResult = {
    fomo: {
      count: fomoTrades.length,
      winRate:
        fomoTrades.length > 0
          ? (
              (fomoTrades.filter((t) => (t.profit || 0) > 0).length /
                fomoTrades.length) *
              100
            ).toFixed(1)
          : "0",
      avgR:
        fomoTrades.length > 0
          ? (
              fomoTrades.reduce((sum, t) => sum + getRMultiple(t), 0) /
              fomoTrades.length
            ).toFixed(2)
          : "0",
    },
    noFomo: {
      count: noFomoTrades.length,
      winRate:
        noFomoTrades.length > 0
          ? (
              (noFomoTrades.filter((t) => (t.profit || 0) > 0).length /
                noFomoTrades.length) *
              100
            ).toFixed(1)
          : "0",
      avgR:
        noFomoTrades.length > 0
          ? (
              noFomoTrades.reduce((sum, t) => sum + getRMultiple(t), 0) /
              noFomoTrades.length
            ).toFixed(2)
          : "0",
    },
  };

  // ============================================================
  // 2. Calmness Impact
  // ============================================================

  const calmnessGroups: Record<number, any[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  };
  tradesWithPsychology.forEach((trade) => {
    const psych = psychologyData.find((p) => p.trade_id === trade.id);
    if (
      psych &&
      psych.calmness_level !== null &&
      psych.calmness_level !== undefined
    ) {
      calmnessGroups[psych.calmness_level]?.push(trade);
    }
  });

  const calmnessImpact = Object.entries(calmnessGroups)
    .map(([level, trades]) => ({
      level: parseInt(level),
      count: trades.length,
      winRate:
        trades.length > 0
          ? (
              (trades.filter((t) => (t.profit || 0) > 0).length /
                trades.length) *
              100
            ).toFixed(1)
          : "0",
      avgR:
        trades.length > 0
          ? (
              trades.reduce((sum, t) => sum + getRMultiple(t), 0) /
              trades.length
            ).toFixed(2)
          : "0",
    }))
    .filter((d) => d.count > 0);

  // ============================================================
  // 3. Anxiety Impact
  // ============================================================

  const anxietyGroups: Record<number, any[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  };
  tradesWithPsychology.forEach((trade) => {
    const psych = psychologyData.find((p) => p.trade_id === trade.id);
    if (
      psych &&
      psych.anxiety_level !== null &&
      psych.anxiety_level !== undefined
    ) {
      anxietyGroups[psych.anxiety_level]?.push(trade);
    }
  });

  const anxietyImpact = Object.entries(anxietyGroups)
    .map(([level, trades]) => ({
      level: parseInt(level),
      count: trades.length,
      winRate:
        trades.length > 0
          ? (
              (trades.filter((t) => (t.profit || 0) > 0).length /
                trades.length) *
              100
            ).toFixed(1)
          : "0",
      avgR:
        trades.length > 0
          ? (
              trades.reduce((sum, t) => sum + getRMultiple(t), 0) /
              trades.length
            ).toFixed(2)
          : "0",
    }))
    .filter((d) => d.count > 0);

  // ============================================================
  // 4. Confidence Impact
  // ============================================================

  const confidenceGroups: Record<number, any[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  };
  tradesWithPsychology.forEach((trade) => {
    const psych = psychologyData.find((p) => p.trade_id === trade.id);
    if (
      psych &&
      psych.confidence_level !== null &&
      psych.confidence_level !== undefined
    ) {
      confidenceGroups[psych.confidence_level]?.push(trade);
    }
  });

  const confidenceImpact = Object.entries(confidenceGroups)
    .map(([level, trades]) => ({
      level: parseInt(level),
      count: trades.length,
      winRate:
        trades.length > 0
          ? (
              (trades.filter((t) => (t.profit || 0) > 0).length /
                trades.length) *
              100
            ).toFixed(1)
          : "0",
      avgR:
        trades.length > 0
          ? (
              trades.reduce((sum, t) => sum + getRMultiple(t), 0) /
              trades.length
            ).toFixed(2)
          : "0",
    }))
    .filter((d) => d.count > 0);

  // ============================================================
  // 5. Fear Impact
  // ============================================================

  const fearGroups: Record<number, any[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  };
  tradesWithPsychology.forEach((trade) => {
    const psych = psychologyData.find((p) => p.trade_id === trade.id);
    if (psych && psych.fear_level !== null && psych.fear_level !== undefined) {
      fearGroups[psych.fear_level]?.push(trade);
    }
  });

  const fearImpact = Object.entries(fearGroups)
    .map(([level, trades]) => ({
      level: parseInt(level),
      count: trades.length,
      winRate:
        trades.length > 0
          ? (
              (trades.filter((t) => (t.profit || 0) > 0).length /
                trades.length) *
              100
            ).toFixed(1)
          : "0",
      avgR:
        trades.length > 0
          ? (
              trades.reduce((sum, t) => sum + getRMultiple(t), 0) /
              trades.length
            ).toFixed(2)
          : "0",
    }))
    .filter((d) => d.count > 0);

  // ============================================================
  // 6. Greed Impact
  // ============================================================

  const greedGroups: Record<number, any[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  };
  tradesWithPsychology.forEach((trade) => {
    const psych = psychologyData.find((p) => p.trade_id === trade.id);
    if (
      psych &&
      psych.greed_level !== null &&
      psych.greed_level !== undefined
    ) {
      greedGroups[psych.greed_level]?.push(trade);
    }
  });

  const greedImpact = Object.entries(greedGroups)
    .map(([level, trades]) => ({
      level: parseInt(level),
      count: trades.length,
      winRate:
        trades.length > 0
          ? (
              (trades.filter((t) => (t.profit || 0) > 0).length /
                trades.length) *
              100
            ).toFixed(1)
          : "0",
      avgR:
        trades.length > 0
          ? (
              trades.reduce((sum, t) => sum + getRMultiple(t), 0) /
              trades.length
            ).toFixed(2)
          : "0",
    }))
    .filter((d) => d.count > 0);

  // ============================================================
  // 7. Frustration Impact
  // ============================================================

  const frustrationGroups: Record<number, any[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  };
  tradesWithPsychology.forEach((trade) => {
    const psych = psychologyData.find((p) => p.trade_id === trade.id);
    if (
      psych &&
      psych.frustration_level !== null &&
      psych.frustration_level !== undefined
    ) {
      frustrationGroups[psych.frustration_level]?.push(trade);
    }
  });

  const frustrationImpact = Object.entries(frustrationGroups)
    .map(([level, trades]) => ({
      level: parseInt(level),
      count: trades.length,
      winRate:
        trades.length > 0
          ? (
              (trades.filter((t) => (t.profit || 0) > 0).length /
                trades.length) *
              100
            ).toFixed(1)
          : "0",
      avgR:
        trades.length > 0
          ? (
              trades.reduce((sum, t) => sum + getRMultiple(t), 0) /
              trades.length
            ).toFixed(2)
          : "0",
    }))
    .filter((d) => d.count > 0);

  // ============================================================
  // 8. KEY INSIGHT
  // ============================================================

  let keyInsight = "";

  // FOMO Insight
  const fomoCount = fomoTrades.length;
  const noFomoCount = noFomoTrades.length;

  if (fomoCount > 0 && noFomoCount > 0) {
    const fomoWinRate = parseFloat(fomoResult.fomo.winRate);
    const noFomoWinRate = parseFloat(fomoResult.noFomo.winRate);
    const diff = noFomoWinRate - fomoWinRate;

    if (diff > 10) {
      keyInsight = `FOMO-гүй үед win rate ${noFomoWinRate.toFixed(1)}%, FOMO-той үед ${fomoWinRate.toFixed(1)}% (${diff.toFixed(1)}% илүү).`;
    } else if (diff < -10) {
      keyInsight = `FOMO-той үед win rate ${fomoWinRate.toFixed(1)}%, FOMO-гүй үед ${noFomoWinRate.toFixed(1)}% (${Math.abs(diff).toFixed(1)}% илүү).`;
    } else {
      keyInsight = `FOMO-ийн нөлөө бага байна. (FOMO: ${fomoWinRate.toFixed(1)}%, FOMO-гүй: ${noFomoWinRate.toFixed(1)}%)`;
    }
  } else if (fomoCount > 0 && noFomoCount === 0) {
    keyInsight = `Бүх ${fomoCount} trade-д FOMO тэмдэглэгдсэн байна.`;
  } else if (fomoCount === 0 && noFomoCount > 0) {
    keyInsight = `Бүх ${noFomoCount} trade-д FOMO тэмдэглэгдээгүй байна.`;
  } else {
    keyInsight = "FOMO-ийн нөлөөг шинжлэх хангалттай мэдээлэл байхгүй байна.";
  }

  // Calmness Insight
  const highCalmness = calmnessImpact.filter((c) => c.level >= 4);
  const lowCalmness = calmnessImpact.filter((c) => c.level <= 2);

  if (highCalmness.length > 0 && lowCalmness.length > 0) {
    const highAvgWinRate =
      highCalmness.reduce((sum, c) => sum + parseFloat(c.winRate), 0) /
      highCalmness.length;
    const lowAvgWinRate =
      lowCalmness.reduce((sum, c) => sum + parseFloat(c.winRate), 0) /
      lowCalmness.length;
    if (highAvgWinRate > lowAvgWinRate + 10) {
      keyInsight += ` Тайван үед (Level 4-5) win rate ${highAvgWinRate.toFixed(1)}%, түгшсэн үед (Level 1-2) ${lowAvgWinRate.toFixed(1)}%.`;
    }
  }

  // Recommendation
  let recommendation = "";
  if (fomoCount > 0 && noFomoCount > 0) {
    const diff =
      parseFloat(fomoResult.noFomo.winRate) -
      parseFloat(fomoResult.fomo.winRate);
    if (diff > 10) {
      recommendation = "FOMO-той үед trade хийхгүй байх дүрэм нэмэх.";
    } else if (diff < -10) {
      recommendation =
        "FOMO-той үед илүү сайн үр дүн гарч байна. Энэ хэв маягаа судлах.";
    } else {
      recommendation =
        "FOMO-ийн нөлөө бага байна. Сэтгэл зүйн төлөвөө тогтмол бүртгэх.";
    }
  } else if (fomoCount > 0 && noFomoCount === 0) {
    recommendation =
      "Бүх trade-д FOMO байна. FOMO-гүй trade хийх боломжийг судлах.";
  } else {
    recommendation =
      "Сэтгэл зүйн төлөвөө тогтмол бүртгэж, хэв маягаа илрүүлэх.";
  }

  return {
    fomoAnalysis: fomoResult,
    calmnessImpact,
    anxietyImpact,
    confidenceImpact,
    fearImpact,
    greedImpact,
    frustrationImpact,
    keyInsight,
    recommendation,
  };
}
