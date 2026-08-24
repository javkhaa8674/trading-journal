// src/lib/analytics/behaviorAnalytics.ts

// 🆕 R-Multiple тооцоолох helper (бусад analytics-тай ижил)
function getRMultiple(trade: any): number {
  if (!trade.profit) return 0;

  if (trade.entry_price && trade.stop_loss) {
    const risk = Math.abs(trade.entry_price - trade.stop_loss);
    if (risk > 0.0001 && risk < 1) {
      return parseFloat((trade.profit / risk).toFixed(2));
    }
  }

  if (Math.abs(trade.profit) > 100) {
    return parseFloat((trade.profit / 100).toFixed(2));
  }

  return 0;
}

export function calculateBehaviorAnalytics(trades: any[], behaviorData: any[]) {
  // ✅ Behavior-тэй trade-г шүүх
  const tradesWithBehavior = trades.filter((trade) => {
    return behaviorData.some((b) => b.trade_id === trade.id);
  });

  // ✅ Хамгийн багадаа 3 trade байх ёстой
  if (tradesWithBehavior.length < 3) {
    return {
      planAdherence: [],
      earlyExitAnalysis: [],
      slModification: [],
      keyInsight: `Хангалттай мэдээлэл байхгүй байна. (${tradesWithBehavior.length}/3 trade)`,
      recommendation: "Илүү их trade-д behavior мэдээлэл бүртгэнэ үү.",
    };
  }

  // ============================================================
  // 1. Plan Adherence
  // ============================================================

  const planGroups: Record<string, any[]> = {
    full: [],
    partial: [],
    violated: [],
  };
  tradesWithBehavior.forEach((trade) => {
    const behavior = behaviorData.find((b) => b.trade_id === trade.id);
    if (behavior && behavior.plan_adherence) {
      planGroups[behavior.plan_adherence]?.push(trade);
    }
  });

  const planAdherence = Object.entries(planGroups)
    .map(([key, trades]) => ({
      key: key === "full" ? "Бүрэн" : key === "partial" ? "Хагас" : "Зөрчсөн",
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
  // 2. Early Exit
  // ============================================================

  const exitGroups: Record<string, any[]> = {
    no: [],
    as_planned: [],
    fear: [],
    impatience: [],
  };
  tradesWithBehavior.forEach((trade) => {
    const behavior = behaviorData.find((b) => b.trade_id === trade.id);
    if (behavior && behavior.early_exit) {
      exitGroups[behavior.early_exit]?.push(trade);
    }
  });

  const earlyExitAnalysis = Object.entries(exitGroups)
    .map(([key, trades]) => ({
      key:
        key === "no"
          ? "Үгүй"
          : key === "as_planned"
            ? "Төлөвлөсөн"
            : key === "fear"
              ? "Айдас"
              : "Тэвчээргүй",
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
  // 3. SL Modification
  // ============================================================

  const slGroups: Record<string, any[]> = {
    none: [],
    as_planned: [],
    increased_risk: [],
    emotional: [],
  };
  tradesWithBehavior.forEach((trade) => {
    const behavior = behaviorData.find((b) => b.trade_id === trade.id);
    if (behavior && behavior.sl_modification) {
      slGroups[behavior.sl_modification]?.push(trade);
    }
  });

  const slModification = Object.entries(slGroups)
    .map(([key, trades]) => ({
      key:
        key === "none"
          ? "Үгүй"
          : key === "as_planned"
            ? "Төлөвлөсөн"
            : key === "increased_risk"
              ? "Эрсдэл нэмсэн"
              : "Сэтгэл хөдлөл",
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
  // 4. KEY INSIGHT
  // ============================================================

  let keyInsight = "";

  // Plan Adherence Insight
  const fullPlan = planAdherence.find((p) => p.key === "Бүрэн");
  const violatedPlan = planAdherence.find((p) => p.key === "Зөрчсөн");

  if (
    fullPlan &&
    violatedPlan &&
    fullPlan.count > 0 &&
    violatedPlan.count > 0
  ) {
    const diff =
      parseFloat(fullPlan.winRate) - parseFloat(violatedPlan.winRate);
    if (diff > 10) {
      keyInsight = `Төлөвлөгөөгөө бүрэн дагасан үед win rate ${fullPlan.winRate}%, харин зөрчсөн үед ${violatedPlan.winRate}% (${diff.toFixed(1)}% илүү).`;
    } else if (diff < -10) {
      keyInsight = `Төлөвлөгөөгөө зөрчсөн үед win rate ${violatedPlan.winRate}%, бүрэн дагасан үед ${fullPlan.winRate}% (${Math.abs(diff).toFixed(1)}% илүү).`;
    } else {
      keyInsight = `Төлөвлөгөөний нөлөө бага байна. (Бүрэн: ${fullPlan.winRate}%, Зөрчсөн: ${violatedPlan.winRate}%)`;
    }
  } else if (fullPlan && fullPlan.count > 0) {
    keyInsight = `Бүх ${fullPlan.count} trade-д төлөвлөгөөгөө бүрэн дагасан байна.`;
  } else if (violatedPlan && violatedPlan.count > 0) {
    keyInsight = `Бүх ${violatedPlan.count} trade-д төлөвлөгөөгөө зөрчсөн байна.`;
  } else {
    keyInsight =
      "Төлөвлөгөөний нөлөөг шинжлэх хангалттай мэдээлэл байхгүй байна.";
  }

  // Early Exit Insight
  const fearExit = earlyExitAnalysis.find((e) => e.key === "Айдас");
  const noExit = earlyExitAnalysis.find((e) => e.key === "Үгүй");

  if (fearExit && noExit && fearExit.count > 0 && noExit.count > 0) {
    const diff = parseFloat(noExit.winRate) - parseFloat(fearExit.winRate);
    if (diff > 10) {
      keyInsight += ` Айснаас эрт гарсан үед win rate ${fearExit.winRate}%, төлөвлөсөн үед ${noExit.winRate}% (${diff.toFixed(1)}% илүү).`;
    }
  }

  // Recommendation
  let recommendation = "";
  if (fullPlan && violatedPlan) {
    const diff =
      parseFloat(fullPlan.winRate) - parseFloat(violatedPlan.winRate);
    if (diff > 10) {
      recommendation = "Төлөвлөгөөгөө дагах дүрмийг чангатгах.";
    } else if (diff < -10) {
      recommendation =
        "Төлөвлөгөөгөө зөрчих нь илүү үр дүнтэй байна. Стратегиа дахин судлах.";
    } else {
      recommendation =
        "Төлөвлөгөөний нөлөө бага байна. Бусад хүчин зүйлсийг судлах.";
    }
  } else if (fullPlan && fullPlan.count > 0) {
    recommendation = "Төлөвлөгөөгөө үргэлжлүүлэн дагах.";
  } else {
    recommendation =
      "Зан төлөвийн мэдэллээ тогтмол бүртгэж, хэв маягаа илрүүлэх.";
  }

  return {
    planAdherence,
    earlyExitAnalysis,
    slModification,
    keyInsight,
    recommendation,
  };
}
