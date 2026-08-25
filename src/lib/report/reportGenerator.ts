// src/lib/report/reportGenerator.ts

import { TradeWithPsychology } from "@/types/trade";
import { PsychologyReport, ReportGenerationOptions } from "@/types/report";
import { getRMultiple } from "@/lib/analytics/insightGenerator";
import { PatternDetectionEngine } from "@/lib/analytics/patternDetection";
import { InsightGenerator } from "@/lib/analytics/insightGenerator";

export class ReportGenerator {
  private trades: TradeWithPsychology[];
  private options: ReportGenerationOptions;

  constructor(
    trades: TradeWithPsychology[],
    options: ReportGenerationOptions = {},
  ) {
    this.trades = trades;
    this.options = {
      includeRawData: true,
      includeAIPrompt: true,
      format: "json",
      language: "mn",
      ...options,
    };
  }

  generate(): PsychologyReport {
    const now = new Date();
    const reportId = `report-${now.getTime()}-${Math.random().toString(36).substr(2, 9)}`;

    const summary = this.calculateSummary();
    const psychology = this.calculatePsychology();
    const behavior = this.calculateBehavior();
    const setup = this.calculateSetup();
    const postTrade = this.calculatePostTrade();
    const patterns = this.detectPatterns();

    const generator = new InsightGenerator(this.trades);
    const insightResult = generator.generate();

    const report: PsychologyReport = {
      generatedAt: now.toISOString(),
      reportId,
      userId: this.trades[0]?.user_id || "unknown",
      dateRange: this.getDateRange(),
      filters: this.getFilters(),

      summary,
      psychology,
      behavior,
      setup,
      postTrade,

      patterns: {
        detected: patterns,
        strengths: insightResult.topStrengths || [],
        weaknesses: insightResult.topWeaknesses || [],
      },

      recommendations: insightResult.recommendations.map((r) => ({
        title: r.title,
        description: r.description,
        action: r.action,
        priority: r.priority,
        category: r.category,
        expectedImpact: r.expectedImpact,
      })),

      rawData: this.options.includeRawData
        ? this.getRawData()
        : {
            trades: [],
            psychology: [],
            behavior: [],
            setup: [],
            postTrade: [],
          },

      aiPrompt: this.options.includeAIPrompt ? this.generateAIPrompt() : "",
    };

    return report;
  }

  // ✅ calculateSummary методыг засах
  private calculateSummary() {
    const trades = this.trades;
    const totalTrades = trades.length;
    const profitableTrades = trades.filter((t) => (t.profit || 0) > 0);
    const losingTrades = trades.filter((t) => (t.profit || 0) < 0);
    const winRate =
      totalTrades > 0 ? (profitableTrades.length / totalTrades) * 100 : 0;

    const totalR = trades.reduce((sum, t) => sum + getRMultiple(t), 0);
    const avgR = totalTrades > 0 ? totalR / totalTrades : 0;
    const totalPnl = trades.reduce((sum, t) => sum + (t.profit || 0), 0);

    let bestTrade = { date: "", rMultiple: 0, pnl: 0 };
    let worstTrade = { date: "", rMultiple: 0, pnl: 0 };

    if (trades.length > 0) {
      const sorted = [...trades].sort(
        (a, b) => getRMultiple(b) - getRMultiple(a),
      );
      bestTrade = {
        // ✅ Зөвхөн open_time ашиглах (created_at байхгүй)
        date: sorted[0]?.open_time || "",
        rMultiple: getRMultiple(sorted[0]),
        pnl: sorted[0]?.profit || 0,
      };
      const worst = [...trades].sort(
        (a, b) => getRMultiple(a) - getRMultiple(b),
      );
      worstTrade = {
        // ✅ Зөвхөн open_time ашиглах (created_at байхгүй)
        date: worst[0]?.open_time || "",
        rMultiple: getRMultiple(worst[0]),
        pnl: worst[0]?.profit || 0,
      };
    }

    let peak = 0;
    let maxDrawdown = 0;
    let runningTotal = 0;
    for (const trade of trades) {
      runningTotal += trade.profit || 0;
      if (runningTotal > peak) peak = runningTotal;
      const drawdown = peak - runningTotal;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    return {
      totalTrades,
      winRate,
      avgR,
      totalPnl,
      maxDrawdown,
      profitableTrades: profitableTrades.length,
      losingTrades: losingTrades.length,
      bestTrade,
      worstTrade,
    };
  }

  private calculatePsychology() {
    // ✅ psychData-г зөв шүүх
    const psychData = this.trades
      .filter(
        (
          t,
        ): t is TradeWithPsychology & {
          psychology: NonNullable<TradeWithPsychology["psychology"]>;
        } => t.psychology !== null,
      )
      .map((t) => t.psychology);

    // ✅ Хэрэв өгөгдөл байхгүй бол хоосон утга буцаах
    if (psychData.length === 0) {
      return {
        averageStates: {
          calmness: 0,
          anxiety: 0,
          fear: 0,
          greed: 0,
          frustration: 0,
          confidence: 0,
          focus: 0,
          patience: 0,
          decisionClarity: 0,
          decisionPressure: 0,
        },
        flags: {
          fomoCount: 0,
          fomoPercentage: 0,
          rushedDecisionCount: 0,
          emotionalCarryoverCount: 0,
        },
        correlations: {
          fomoVsWinRate: 0,
          calmnessVsWinRate: 0,
          confidenceVsWinRate: 0,
          anxietyVsWinRate: 0,
        },
      };
    }

    // ✅ Дундаж утгууд - optional chaining ашиглах
    const avg = (key: string) => {
      const values = psychData.map((p) => (p as any)[key] || 0);
      return values.reduce((a, b) => a + b, 0) / values.length;
    };

    const averageStates = {
      calmness: avg("calmness_level"),
      anxiety: avg("anxiety_level"),
      fear: avg("fear_level"),
      greed: avg("greed_level"),
      frustration: avg("frustration_level"),
      confidence: avg("confidence_level"),
      focus: avg("focus_level"),
      patience: avg("patience_level"),
      decisionClarity: avg("decision_clarity_level"),
      decisionPressure: avg("decision_pressure_level"),
    };

    // ✅ БҮХ flag-уудыг optional chaining-ээр шалгах
    const fomoCount = psychData.filter((p) => p?.fomo === true).length;
    const rushedDecisionCount = psychData.filter(
      (p) => p?.rushed_decision === true,
    ).length;
    const emotionalCarryoverCount = psychData.filter(
      (p) => p?.emotional_carryover === true,
    ).length;

    const correlations = this.calculateCorrelations();

    return {
      averageStates,
      flags: {
        fomoCount,
        fomoPercentage: (fomoCount / psychData.length) * 100,
        rushedDecisionCount,
        emotionalCarryoverCount,
      },
      correlations,
    };
  }

  private calculateCorrelations() {
    const tradesWithPsych = this.trades.filter((t) => t.psychology !== null);

    if (tradesWithPsych.length < 3) {
      return {
        fomoVsWinRate: 0,
        calmnessVsWinRate: 0,
        confidenceVsWinRate: 0,
        anxietyVsWinRate: 0,
      };
    }

    // ✅ 1. FOMO Correlation (FOMO нь сөрөг нөлөөтэй байх ёстой)
    const fomoTrades = tradesWithPsych.filter(
      (t) => t.psychology?.fomo === true,
    );
    const nonFomoTrades = tradesWithPsych.filter(
      (t) => t.psychology?.fomo === false,
    );

    const fomoWinRate =
      fomoTrades.length > 0
        ? (fomoTrades.filter((t) => (t.pnl || 0) > 0).length /
            fomoTrades.length) *
          100
        : 0;
    const nonFomoWinRate =
      nonFomoTrades.length > 0
        ? (nonFomoTrades.filter((t) => (t.pnl || 0) > 0).length /
            nonFomoTrades.length) *
          100
        : 0;

    // ✅ FOMO difference: nonFomoWinRate - fomoWinRate (эерэг = FOMO муу)
    const fomoDiff = nonFomoWinRate - fomoWinRate;

    // ✅ 2. Calmness Correlation (Тайван байдал эерэг нөлөөтэй)
    const calmTrades = tradesWithPsych.filter(
      (t) => (t.psychology?.calmness_level || 0) >= 4,
    );
    const nonCalmTrades = tradesWithPsych.filter(
      (t) => (t.psychology?.calmness_level || 0) < 4,
    );

    const calmWinRate =
      calmTrades.length > 0
        ? (calmTrades.filter((t) => (t.pnl || 0) > 0).length /
            calmTrades.length) *
          100
        : 0;
    const nonCalmWinRate =
      nonCalmTrades.length > 0
        ? (nonCalmTrades.filter((t) => (t.pnl || 0) > 0).length /
            nonCalmTrades.length) *
          100
        : 0;

    // ✅ Calmness difference: calmWinRate - nonCalmWinRate (эерэг = тайван сайн)
    const calmDiff = calmWinRate - nonCalmWinRate;

    // ✅ 3. Confidence Correlation (Итгэл эерэг нөлөөтэй)
    const confTrades = tradesWithPsych.filter(
      (t) => (t.psychology?.confidence_level || 0) >= 4,
    );
    const nonConfTrades = tradesWithPsych.filter(
      (t) => (t.psychology?.confidence_level || 0) < 4,
    );

    const confWinRate =
      confTrades.length > 0
        ? (confTrades.filter((t) => (t.pnl || 0) > 0).length /
            confTrades.length) *
          100
        : 0;
    const nonConfWinRate =
      nonConfTrades.length > 0
        ? (nonConfTrades.filter((t) => (t.pnl || 0) > 0).length /
            nonConfTrades.length) *
          100
        : 0;

    // ✅ Confidence difference: confWinRate - nonConfWinRate (эерэг = итгэл сайн)
    const confDiff = confWinRate - nonConfWinRate;

    // ✅ 4. Anxiety Correlation (Түгшсэн байдал сөрөг нөлөөтэй)
    const anxiousTrades = tradesWithPsych.filter(
      (t) => (t.psychology?.anxiety_level || 0) >= 4,
    );
    const nonAnxiousTrades = tradesWithPsych.filter(
      (t) => (t.psychology?.anxiety_level || 0) < 4,
    );

    const anxiousWinRate =
      anxiousTrades.length > 0
        ? (anxiousTrades.filter((t) => (t.pnl || 0) > 0).length /
            anxiousTrades.length) *
          100
        : 0;
    const nonAnxiousWinRate =
      nonAnxiousTrades.length > 0
        ? (nonAnxiousTrades.filter((t) => (t.pnl || 0) > 0).length /
            nonAnxiousTrades.length) *
          100
        : 0;

    // ✅ Anxiety difference: nonAnxiousWinRate - anxiousWinRate (эерэг = түгшсэн муу)
    const anxiousDiff = nonAnxiousWinRate - anxiousWinRate;

    return {
      fomoVsWinRate: fomoDiff, // Эерэг = FOMO муу нөлөөтэй
      calmnessVsWinRate: calmDiff, // Эерэг = Тайван сайн нөлөөтэй
      confidenceVsWinRate: confDiff, // Эерэг = Итгэл сайн нөлөөтэй
      anxietyVsWinRate: anxiousDiff, // Эерэг = Түгшсэн муу нөлөөтэй
    };
  }

  private calculateBehavior() {
    // ✅ behavior-г зөв шүүх
    const behaviorData = this.trades
      .filter(
        (
          t,
        ): t is TradeWithPsychology & {
          behavior: NonNullable<TradeWithPsychology["behavior"]>;
        } => t.behavior !== null,
      )
      .map((t) => t.behavior);

    if (behaviorData.length === 0) {
      return {
        planAdherence: { full: 0, partial: 0, violated: 0 },
        slModification: {
          none: 0,
          asPlanned: 0,
          increasedRisk: 0,
          emotional: 0,
        },
        tpModification: { none: 0, basedOnNewInfo: 0, fear: 0, greed: 0 },
        earlyExit: { no: 0, asPlanned: 0, fear: 0, impatience: 0 },
        winRateByBehavior: {
          planAdherence: {},
          earlyExit: {},
          slModification: {},
        },
      };
    }

    // ✅ БҮХ behavior-уудыг optional chaining-ээр шалгах
    const planAdherence = {
      full: behaviorData.filter((b) => b?.plan_adherence === "full").length,
      partial: behaviorData.filter((b) => b?.plan_adherence === "partial")
        .length,
      violated: behaviorData.filter((b) => b?.plan_adherence === "violated")
        .length,
    };

    const slModification = {
      none: behaviorData.filter((b) => b?.sl_modification === "none").length,
      asPlanned: behaviorData.filter((b) => b?.sl_modification === "as_planned")
        .length,
      increasedRisk: behaviorData.filter(
        (b) => b?.sl_modification === "increased_risk",
      ).length,
      emotional: behaviorData.filter((b) => b?.sl_modification === "emotional")
        .length,
    };

    const tpModification = {
      none: behaviorData.filter((b) => b?.tp_modification === "none").length,
      basedOnNewInfo: behaviorData.filter(
        (b) => b?.tp_modification === "based_on_new_info",
      ).length,
      fear: behaviorData.filter((b) => b?.tp_modification === "fear").length,
      greed: behaviorData.filter((b) => b?.tp_modification === "greed").length,
    };

    const earlyExit = {
      no: behaviorData.filter((b) => b?.early_exit === "no").length,
      asPlanned: behaviorData.filter((b) => b?.early_exit === "as_planned")
        .length,
      fear: behaviorData.filter((b) => b?.early_exit === "fear").length,
      impatience: behaviorData.filter((b) => b?.early_exit === "impatience")
        .length,
    };

    const winRateByBehavior = {
      planAdherence: this.calculateWinRateByBehavior("plan_adherence"),
      earlyExit: this.calculateWinRateByBehavior("early_exit"),
      slModification: this.calculateWinRateByBehavior("sl_modification"),
    };

    return {
      planAdherence,
      slModification,
      tpModification,
      earlyExit,
      winRateByBehavior,
    };
  }

  private calculateWinRateByBehavior(field: string): Record<string, number> {
    const result: Record<string, number> = {};
    const behaviors = this.trades.filter((t) => t.behavior !== null);

    const groups: Record<string, any[]> = {};
    for (const trade of behaviors) {
      const value = (trade.behavior as any)?.[field];
      if (!value) continue;
      if (!groups[value]) groups[value] = [];
      groups[value].push(trade);
    }

    for (const [key, trades] of Object.entries(groups)) {
      const wins = trades.filter((t) => (t.pnl || 0) > 0).length;
      result[key] = trades.length > 0 ? (wins / trades.length) * 100 : 0;
    }

    return result;
  }

  private calculateSetup() {
    const tradesWithSetup = this.trades.filter(
      (t) => t.setupScore !== undefined,
    );

    if (tradesWithSetup.length === 0) {
      return {
        averageScore: 0,
        distribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
        winRateByScore: { excellent: 0, good: 0, fair: 0, poor: 0 },
        avgRByScore: { excellent: 0, good: 0, fair: 0, poor: 0 },
        topPerformingItems: [],
        bottomPerformingItems: [],
      };
    }

    const avgScore =
      tradesWithSetup.reduce((sum, t) => sum + (t.setupScore || 0), 0) /
      tradesWithSetup.length;

    const distribution = {
      excellent: tradesWithSetup.filter((t) => (t.setupScore || 0) >= 80)
        .length,
      good: tradesWithSetup.filter(
        (t) => (t.setupScore || 0) >= 60 && (t.setupScore || 0) < 80,
      ).length,
      fair: tradesWithSetup.filter(
        (t) => (t.setupScore || 0) >= 40 && (t.setupScore || 0) < 60,
      ).length,
      poor: tradesWithSetup.filter((t) => (t.setupScore || 0) < 40).length,
    };

    const calcWinRate = (trades: TradeWithPsychology[]) => {
      if (trades.length === 0) return 0;
      return (
        (trades.filter((t) => (t.pnl || 0) > 0).length / trades.length) * 100
      );
    };

    const calcAvgR = (trades: TradeWithPsychology[]) => {
      if (trades.length === 0) return 0;
      return (
        trades.reduce((sum, t) => sum + getRMultiple(t), 0) / trades.length
      );
    };

    const excellentTrades = tradesWithSetup.filter(
      (t) => (t.setupScore || 0) >= 80,
    );
    const goodTrades = tradesWithSetup.filter(
      (t) => (t.setupScore || 0) >= 60 && (t.setupScore || 0) < 80,
    );
    const fairTrades = tradesWithSetup.filter(
      (t) => (t.setupScore || 0) >= 40 && (t.setupScore || 0) < 60,
    );
    const poorTrades = tradesWithSetup.filter((t) => (t.setupScore || 0) < 40);

    return {
      averageScore: avgScore,
      distribution,
      winRateByScore: {
        excellent: calcWinRate(excellentTrades),
        good: calcWinRate(goodTrades),
        fair: calcWinRate(fairTrades),
        poor: calcWinRate(poorTrades),
      },
      avgRByScore: {
        excellent: calcAvgR(excellentTrades),
        good: calcAvgR(goodTrades),
        fair: calcAvgR(fairTrades),
        poor: calcAvgR(poorTrades),
      },
      topPerformingItems: ["HTF Bias", "Liquidity", "Entry Confirmation"],
      bottomPerformingItems: ["FVG", "MSS", "Order Block"],
    };
  }

  private calculatePostTrade() {
    const reviewData = this.trades
      .filter(
        (
          t,
        ): t is TradeWithPsychology & {
          postTradeReview: NonNullable<TradeWithPsychology["postTradeReview"]>;
        } => t.postTradeReview !== null,
      )
      .map((t) => t.postTradeReview);

    if (reviewData.length === 0) {
      return {
        averageExecutionQuality: 0,
        wouldTakeAgain: { yes: 0, yesWithChanges: 0, no: 0 },
        commonReflections: [],
        commonLessons: [],
      };
    }

    // ✅ Optional chaining ашиглах
    const avgQuality =
      reviewData.reduce((sum, r) => sum + (r?.execution_quality || 0), 0) /
      reviewData.length;

    const wouldTakeAgain = {
      yes: reviewData.filter((r) => r?.would_take_again === "yes").length,
      yesWithChanges: reviewData.filter(
        (r) => r?.would_take_again === "yes_with_changes",
      ).length,
      no: reviewData.filter((r) => r?.would_take_again === "no").length,
    };

    const reflections = reviewData
      .map((r) => r?.reflection || "")
      .filter((r) => r.length > 0);
    const lessons = reviewData
      .map((r) => r?.lesson_learned || "")
      .filter((r) => r.length > 0);

    return {
      averageExecutionQuality: avgQuality,
      wouldTakeAgain,
      commonReflections: this.extractCommonPhrases(reflections),
      commonLessons: this.extractCommonPhrases(lessons),
    };
  }

  private extractCommonPhrases(
    texts: string[],
    maxCount: number = 3,
  ): string[] {
    if (texts.length === 0) return [];

    const words = texts.flatMap((t) => t.split(" "));
    const freq: Record<string, number> = {};
    for (const word of words) {
      if (word.length < 3) continue;
      freq[word] = (freq[word] || 0) + 1;
    }

    const sorted = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxCount)
      .map(([word]) => word);

    return sorted;
  }

  private detectPatterns() {
    const engine = new PatternDetectionEngine(this.trades);
    const patterns = engine.detectAllPatterns();

    return patterns.map((p) => ({
      name: p.title,
      description: p.description,
      severity: p.severity,
      confidence: p.confidence,
    }));
  }

  // ✅ getDateRange методыг засах
  private getDateRange() {
    if (this.trades.length === 0) {
      return { from: "", to: "" };
    }
    const sorted = [...this.trades].sort((a, b) => {
      const dateA = new Date(a.open_time || 0);
      const dateB = new Date(b.open_time || 0);
      return dateA.getTime() - dateB.getTime();
    });
    return {
      from: sorted[0]?.open_time || "",
      to: sorted[sorted.length - 1]?.open_time || "",
    };
  }

  private getFilters() {
    const firstTrade = this.trades[0];
    return {
      accountId: firstTrade?.account_id ?? undefined,
      strategyId: firstTrade?.strategy_profile_id ?? undefined,
    };
  }
  private getRawData() {
    return {
      trades: this.trades.map((t) => ({
        id: t.id,
        symbol: t.symbol,
        direction: t.type,
        entry_price: t.entry_price,
        exit_price: t.exit_price,
        pnl: t.pnl,
        rMultiple: getRMultiple(t),
        open_time: t.open_time,
      })),
      psychology: this.trades
        .filter((t) => t.psychology)
        .map((t) => t.psychology),
      behavior: this.trades.filter((t) => t.behavior).map((t) => t.behavior),
      setup: this.trades.map((t) => ({
        trade_id: t.id,
        setupScore: t.setupScore,
      })),
      postTrade: this.trades
        .filter((t) => t.postTradeReview)
        .map((t) => t.postTradeReview),
    };
  }

  private generateAIPrompt(): string {
    const summary = this.calculateSummary();
    const psychology = this.calculatePsychology();
    const behavior = this.calculateBehavior();
    const setup = this.calculateSetup();

    return `
# TRADING PSYCHOLOGY ANALYSIS REPORT

## OVERALL SUMMARY
- Total Trades: ${summary.totalTrades}
- Win Rate: ${summary.winRate.toFixed(1)}%
- Average R: ${summary.avgR.toFixed(2)}R
- Total P&L: $${summary.totalPnl.toFixed(2)}
- Max Drawdown: $${summary.maxDrawdown.toFixed(2)}
- Best Trade: ${summary.bestTrade.rMultiple}R ($${summary.bestTrade.pnl.toFixed(2)})
- Worst Trade: ${summary.worstTrade.rMultiple}R ($${summary.worstTrade.pnl.toFixed(2)})

## PSYCHOLOGY ANALYSIS
### Emotional States (1-5 scale)
- Calmness: ${psychology.averageStates.calmness.toFixed(1)}
- Anxiety: ${psychology.averageStates.anxiety.toFixed(1)}
- Fear: ${psychology.averageStates.fear.toFixed(1)}
- Greed: ${psychology.averageStates.greed.toFixed(1)}
- Frustration: ${psychology.averageStates.frustration.toFixed(1)}
- Confidence: ${psychology.averageStates.confidence.toFixed(1)}
- Focus: ${psychology.averageStates.focus.toFixed(1)}
- Patience: ${psychology.averageStates.patience.toFixed(1)}
- Decision Clarity: ${psychology.averageStates.decisionClarity.toFixed(1)}
- Decision Pressure: ${psychology.averageStates.decisionPressure.toFixed(1)}

### Psychological Flags
- FOMO occurred in ${psychology.flags.fomoPercentage.toFixed(0)}% of trades
- Rushed decisions: ${psychology.flags.rushedDecisionCount}
- Emotional carryover: ${psychology.flags.emotionalCarryoverCount}

### Key Correlations
- FOMO vs Win Rate: ${psychology.correlations.fomoVsWinRate > 0 ? "+" : ""}${psychology.correlations.fomoVsWinRate.toFixed(1)}% difference
- Calmness vs Win Rate: ${psychology.correlations.calmnessVsWinRate > 0 ? "+" : ""}${psychology.correlations.calmnessVsWinRate.toFixed(1)}% difference
- Confidence vs Win Rate: ${psychology.correlations.confidenceVsWinRate > 0 ? "+" : ""}${psychology.correlations.confidenceVsWinRate.toFixed(1)}% difference
- Anxiety vs Win Rate: ${psychology.correlations.anxietyVsWinRate > 0 ? "+" : ""}${psychology.correlations.anxietyVsWinRate.toFixed(1)}% difference

## BEHAVIOR ANALYSIS
### Plan Adherence
- Full: ${behavior.planAdherence.full}
- Partial: ${behavior.planAdherence.partial}
- Violated: ${behavior.planAdherence.violated}

### Stop Loss Modification
- None: ${behavior.slModification.none}
- As Planned: ${behavior.slModification.asPlanned}
- Increased Risk: ${behavior.slModification.increasedRisk}
- Emotional: ${behavior.slModification.emotional}

### Early Exit
- No: ${behavior.earlyExit.no}
- As Planned: ${behavior.earlyExit.asPlanned}
- Fear: ${behavior.earlyExit.fear}
- Impatience: ${behavior.earlyExit.impatience}

### Win Rate by Behavior
- Plan Adherence: Full ${(behavior.winRateByBehavior.planAdherence.full || 0).toFixed(0)}% | Partial ${(behavior.winRateByBehavior.planAdherence.partial || 0).toFixed(0)}% | Violated ${(behavior.winRateByBehavior.planAdherence.violated || 0).toFixed(0)}%
- Early Exit: No ${(behavior.winRateByBehavior.earlyExit.no || 0).toFixed(0)}% | Fear ${(behavior.winRateByBehavior.earlyExit.fear || 0).toFixed(0)}%

## SETUP ANALYSIS
- Average Setup Score: ${setup.averageScore.toFixed(0)}%
- Distribution: Excellent ${setup.distribution.excellent} | Good ${setup.distribution.good} | Fair ${setup.distribution.fair} | Poor ${setup.distribution.poor}

## QUESTIONS FOR ANALYSIS
1. What is the trader's biggest psychological weakness based on the data?
2. What patterns emerge between emotional states and trading outcomes?
3. How does plan adherence affect profitability?
4. What recommendations would you give to improve performance?
5. What specific behaviors should the trader focus on changing?

## REQUEST
Based on the above data, provide:
1. A detailed psychological profile of the trader
2. Specific patterns and correlations you observe
3. Actionable recommendations for improvement
4. A trading psychology "diagnosis" with treatment plan
`;
  }
}

// ✅ Default export for compatibility
export default ReportGenerator;
