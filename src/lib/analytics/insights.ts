// src/lib/analytics/insights.ts

import { TradeWithPsychology } from "@/types/trade";
import { InsightGenerator, getRMultiple } from "./insightGenerator";

// ============================================================
// COMPATIBILITY LAYER - Old function signature
// ============================================================

export function generateInsights(
  trades: any[],
  psychologyData: any[] = [],
  behaviorData: any[] = [],
  setupData: any[] = [],
  postTradeData: any[] = [],
): {
  problems: string[];
  recommendations: string[];
  summary: string;
} {
  // Build TradeWithPsychology objects
  const tradesWithPsychology: TradeWithPsychology[] = trades.map((trade) => {
    const psychology = psychologyData.find((p) => p.trade_id === trade.id);
    const behavior = behaviorData.find((b) => b.trade_id === trade.id);
    const postTradeReview = postTradeData.find((p) => p.trade_id === trade.id);

    // Calculate setup score
    const responses = setupData.filter((s) => s.trade_id === trade.id);
    const totalItems = responses.filter(
      (r: any) => r.response_status !== "not_applicable",
    ).length;
    const metItems = responses.filter(
      (r: any) => r.response_status === "met",
    ).length;
    const partiallyMetItems = responses.filter(
      (r: any) => r.response_status === "partially_met",
    ).length;

    const setupScore =
      totalItems > 0
        ? ((metItems + partiallyMetItems * 0.5) / totalItems) * 100
        : undefined;

    return {
      ...trade,
      pnl: trade.profit,
      rMultiple: getRMultiple(trade),
      setupScore,
      psychology,
      behavior,
      postTradeReview,
    };
  });

  // Use the new InsightGenerator
  const generator = new InsightGenerator(tradesWithPsychology);
  const result = generator.generate();

  // Convert to old format for compatibility
  const problems = result.patterns
    .filter(
      (p) =>
        p.type === "problem" ||
        p.type === "warning" ||
        p.severity === "critical",
    )
    .map((p) => p.description);

  const recommendations = result.recommendations.map((r) => r.action);

  // Add problems and recommendations from patterns
  const existingProblems = problems.length > 0 ? problems : [];
  const existingRecommendations =
    recommendations.length > 0 ? recommendations : [];

  // Add basic problems if none detected but there are trades
  if (existingProblems.length === 0 && trades.length >= 5) {
    // Check FOMO pattern manually
    const fomoTrades = trades.filter((t) => {
      const psych = psychologyData.find((p) => p.trade_id === t.id);
      return psych?.fomo === true;
    });

    if (fomoTrades.length > 2) {
      const fomoAvgR =
        fomoTrades.reduce((sum, t) => sum + getRMultiple(t), 0) /
        fomoTrades.length;
      if (fomoAvgR < 0) {
        existingProblems.push(
          `Сүүлийн ${trades.length} trade-ийн ${fomoTrades.length}-д FOMO тэмдэглэгдсэн бөгөөд эдгээр trade-ийн дундаж үр дүн ${fomoAvgR.toFixed(2)}R байна.`,
        );
        existingRecommendations.push(
          "Дараагийн 10 trade дээр FOMO-той үед trade хийхгүй байх дүрмийг турш.",
        );
      }
    }

    // Check plan violation
    const violatedTrades = trades.filter((t) => {
      const behavior = behaviorData.find((b) => b.trade_id === t.id);
      return behavior?.plan_adherence === "violated";
    });

    if (violatedTrades.length > 2) {
      const violatedAvgR =
        violatedTrades.reduce((sum, t) => sum + getRMultiple(t), 0) /
        violatedTrades.length;
      if (violatedAvgR < 0) {
        existingProblems.push(
          `Төлөвлөгөөгөө зөрчсөн trade-үүдийн дундаж үр дүн ${violatedAvgR.toFixed(2)}R байна.`,
        );
        existingRecommendations.push(
          "Төлөвлөгөөгөө дагах reminder тохируулах.",
        );
      }
    }
  }

  // Add default recommendation if none
  if (existingRecommendations.length === 0 && trades.length >= 5) {
    existingRecommendations.push(
      "Таны арилжааны сэтгэл зүй тогтвортой байна. Энэ хэв маягаа үргэлжлүүлэх.",
    );
  }

  if (existingProblems.length === 0 && trades.length === 0) {
    existingProblems.push("Хангалттай мэдээлэл байхгүй байна.");
    existingRecommendations.push(
      "Илүү их trade бүртгэж, бүх psychology хэсгийг бөглөнө үү.",
    );
  }

  const summary =
    existingProblems.length > 0
      ? `${existingProblems.length} асуудал илэрсэн. Дээрх зөвлөмжүүдийг дагаж сайжруулах.`
      : "Таны арилжааны сэтгэл зүй тогтвортой байна.";

  return {
    problems: existingProblems,
    recommendations: existingRecommendations,
    summary,
  };
}

// Re-export getRMultiple for other modules
export { getRMultiple } from "./insightGenerator";
