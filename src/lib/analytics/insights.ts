// src/lib/analytics/insights.ts

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

export function generateInsights(
  trades: any[],
  psychologyData: any[],
  behaviorData: any[],
  setupData: any[],
  postTradeData: any[],
) {
  if (trades.length === 0) {
    return {
      problems: ["Хангалттай мэдээлэл байхгүй байна."],
      recommendations: [
        "Илүү их trade бүртгэж, бүх psychology хэсгийг бөглөнө үү.",
      ],
      summary: "Мэдээлэл хангалтгүй байна.",
    };
  }

  const problems: string[] = [];
  const recommendations: string[] = [];

  // FOMO Problem
  const fomoTrades = trades.filter((t) => {
    const psych = psychologyData.find((p) => p.trade_id === t.id);
    return psych?.fomo === true;
  });

  if (fomoTrades.length > 2) {
    const fomoAvgR =
      fomoTrades.reduce((sum, t) => sum + getRMultiple(t), 0) /
      fomoTrades.length;
    if (fomoAvgR < 0) {
      problems.push(
        `Сүүлийн ${trades.length} trade-ийн ${fomoTrades.length}-д FOMO тэмдэглэгдсэн бөгөөд эдгээр trade-ийн дундаж үр дүн ${fomoAvgR.toFixed(2)}R байна.`,
      );
      recommendations.push(
        "Дараагийн 10 trade дээр FOMO-той үед trade хийхгүй байх дүрмийг турш.",
      );
    }
  }

  // Setup Problem
  const lowSetupTrades = trades.filter((t) => {
    const setup = setupData.filter((s) => s.trade_id === t.id);
    if (setup.length === 0) return false;
    const score =
      (setup.reduce((sum, r) => {
        if (r.response_status === "met") return sum + 1;
        if (r.response_status === "partially_met") return sum + 0.5;
        return sum;
      }, 0) /
        setup.length) *
      100;
    return score < 60;
  });

  if (lowSetupTrades.length > 2) {
    const lowSetupAvgR =
      lowSetupTrades.reduce((sum, t) => sum + getRMultiple(t), 0) /
      lowSetupTrades.length;
    if (lowSetupAvgR < 0) {
      problems.push(
        `Setup-ийн шаардлагыг бүрэн хангаагүй trade-үүдийн дундаж үр дүн ${lowSetupAvgR.toFixed(2)}R байна.`,
      );
      recommendations.push(
        "Setup 70% доош бол trade хийхгүй байх дүрэм нэмэх.",
      );
    }
  }

  // Plan Violation Problem
  const violatedTrades = trades.filter((t) => {
    const behavior = behaviorData.find((b) => b.trade_id === t.id);
    return behavior?.plan_adherence === "violated";
  });

  if (violatedTrades.length > 2) {
    const violatedAvgR =
      violatedTrades.reduce((sum, t) => sum + getRMultiple(t), 0) /
      violatedTrades.length;
    if (violatedAvgR < 0) {
      problems.push(
        `Төлөвлөгөөгөө зөрчсөн trade-үүдийн дундаж үр дүн ${violatedAvgR.toFixed(2)}R байна.`,
      );
      recommendations.push("Төлөвлөгөөгөө дагах reminder тохируулах.");
    }
  }

  if (problems.length === 0) {
    recommendations.push(
      "Таны арилжааны сэтгэл зүй тогтвортой байна. Энэ хэв маягаа үргэлжлүүлэх.",
    );
  }

  const summary =
    problems.length > 0
      ? `${problems.length} асуудал илэрсэн. Дээрх зөвлөмжүүдийг дагаж сайжруулах.`
      : "Таны арилжааны сэтгэл зүй тогтвортой байна.";

  return { problems, recommendations, summary };
}
