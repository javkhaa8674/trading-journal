// src/lib/analytics/setupAnalytics.ts

function getRMultiple(trade: any): number {
  if (!trade.profit) return 0;

  if (trade.entry_price && trade.stop_loss) {
    const risk = Math.abs(trade.entry_price - trade.stop_loss);
    if (risk > 0 && risk < 100) {
      return parseFloat((trade.profit / risk).toFixed(2));
    }
  }

  if (Math.abs(trade.profit) > 1000) {
    return parseFloat((trade.profit / 100).toFixed(2));
  }

  return 0;
}

export function calculateSetupAnalytics(trades: any[], setupData: any[]) {
  // ✅ ЗӨВХӨН setupData БАЙГАА trade-г шүүх
  const tradesWithSetup = trades.filter((trade) => {
    const responses = setupData.filter((s) => s.trade_id === trade.id);
    return responses.length > 0;
  });

  // ✅ Setup-тэй trade байхгүй бол хоосон буцаах
  if (tradesWithSetup.length === 0 || setupData.length === 0) {
    return {
      distribution: [],
      keyInsight: "Setup мэдээлэл бүртгэгдээгүй байна.",
      recommendation: "Trade хийхдээ Setup Validation-г бөглөнө үү.",
    };
  }

  const scoreGroups: Record<
    string,
    { trades: any[]; winCount: number; totalR: number }
  > = {
    "90+": { trades: [], winCount: 0, totalR: 0 },
    "70-89": { trades: [], winCount: 0, totalR: 0 },
    "50-69": { trades: [], winCount: 0, totalR: 0 },
    "<50": { trades: [], winCount: 0, totalR: 0 },
  };

  // ✅ ЗӨВХӨН setup-тэй trade-г боловсруулах
  tradesWithSetup.forEach((trade) => {
    const responses = setupData.filter((s) => s.trade_id === trade.id);
    if (responses.length === 0) return;

    const scoredItems = responses.filter(
      (r) =>
        r.response_status !== "not_applicable" && r.response_status !== null,
    );

    if (scoredItems.length === 0) return;

    const score = scoredItems.reduce((sum: number, r: any) => {
      if (r.response_status === "met") return sum + 1;
      if (r.response_status === "partially_met") return sum + 0.5;
      return sum;
    }, 0);

    const percentage = (score / scoredItems.length) * 100;

    let group: keyof typeof scoreGroups;
    if (percentage >= 90) group = "90+";
    else if (percentage >= 70) group = "70-89";
    else if (percentage >= 50) group = "50-69";
    else group = "<50";

    scoreGroups[group].trades.push(trade);
    if ((trade.profit || 0) > 0) {
      scoreGroups[group].winCount += 1;
    }
    scoreGroups[group].totalR += getRMultiple(trade);
  });

  const distribution = Object.entries(scoreGroups)
    .map(([range, data]) => ({
      range,
      count: data.trades.length,
      winRate:
        data.trades.length > 0
          ? ((data.winCount / data.trades.length) * 100).toFixed(1)
          : "0",
      avgR:
        data.trades.length > 0
          ? (data.totalR / data.trades.length).toFixed(2)
          : "0",
    }))
    .filter((d) => d.count > 0);

  // ✅ Хэрэв distribution хоосон бол
  if (distribution.length === 0) {
    return {
      distribution: [],
      keyInsight:
        "Setup мэдээлэл бүртгэгдсэн боловч тооцоолол хийхэд хангалтгүй байна.",
      recommendation: "Илүү их trade-д setup мэдээлэл оруулна уу.",
    };
  }

  const bestGroup = distribution.reduce((a, b) =>
    parseFloat(a.winRate) > parseFloat(b.winRate) ? a : b,
  );

  const keyInsight =
    distribution.length > 1
      ? `Setup ${bestGroup.range} үед хамгийн өндөр win rate ${bestGroup.winRate}% байна.`
      : `Setup ${bestGroup.range} үед win rate ${bestGroup.winRate}% байна.`;

  const recommendation =
    parseFloat(bestGroup.winRate) > 60
      ? `Setup ${bestGroup.range} байх үед илүү их trade хийх.`
      : "Setup-ийн шалгууруудыг сайжруулж, өндөр үзүүлэлтэд хүрэхийг зорь.";

  return { distribution, keyInsight, recommendation };
}
