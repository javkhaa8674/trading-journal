// src/lib/analytics/crossAnalytics.ts

// 🆕 R-Multiple helper
function getRMultiple(trade: any): number {
  if (!trade.profit) return 0;
  const risk =
    trade.entry_price && trade.stop_loss
      ? Math.abs(trade.entry_price - trade.stop_loss)
      : 1;
  if (risk === 0) return 0;
  return parseFloat((trade.profit / risk).toFixed(2));
}

export function calculateCrossAnalytics(
  trades: any[],
  psychologyData: any[],
  behaviorData: any[],
  setupData: any[],
) {
  if (trades.length === 0) {
    return {
      winningFormula: "Хангалттай мэдээлэл байхгүй байна.",
      losingFormula: "Хангалттай мэдээлэл байхгүй байна.",
    };
  }

  const enrichedTrades = trades.map((trade) => {
    const psych = psychologyData.find((p) => p.trade_id === trade.id);
    const behavior = behaviorData.find((b) => b.trade_id === trade.id);
    const setup = setupData.filter((s) => s.trade_id === trade.id);

    const setupScore =
      setup.length > 0
        ? (setup.reduce((sum, r) => {
            if (r.response_status === "met") return sum + 1;
            if (r.response_status === "partially_met") return sum + 0.5;
            return sum;
          }, 0) /
            setup.length) *
          100
        : 0;

    return {
      ...trade,
      psychology: psych,
      behavior: behavior,
      setupScore,
      isWinner: (trade.profit || 0) > 0,
    };
  });

  const winners = enrichedTrades.filter((t) => t.isWinner);
  const losers = enrichedTrades.filter((t) => !t.isWinner);

  const winningFormula =
    winners.length > 3
      ? `Setup ${(winners.reduce((sum, t) => sum + t.setupScore, 0) / winners.length).toFixed(0)}% + ` +
        `Calmness ${((winners.filter((t) => t.psychology?.calmness_level >= 4).length / winners.length) * 100).toFixed(0)}% + ` +
        `No FOMO ${((winners.filter((t) => !t.psychology?.fomo).length / winners.length) * 100).toFixed(0)}%`
      : "Хангалттай ашигтай trade байхгүй байна.";

  const losingFormula =
    losers.length > 3
      ? `Setup ${(losers.reduce((sum, t) => sum + t.setupScore, 0) / losers.length).toFixed(0)}% + ` +
        `FOMO ${((losers.filter((t) => t.psychology?.fomo).length / losers.length) * 100).toFixed(0)}% + ` +
        `Plan Violated ${((losers.filter((t) => t.behavior?.plan_adherence === "violated").length / losers.length) * 100).toFixed(0)}%`
      : "Хангалттай алдагдалтай trade байхгүй байна.";

  return {
    winningFormula,
    losingFormula,
  };
}
