// src/lib/analytics/patternDetection.ts

import { TradeWithPsychology } from "@/types/trade";
import { InsightPattern } from "@/types/insights";
import { getRMultiple } from "./insightGenerator";

interface PatternConfig {
  minSampleSize: number;
  confidenceThreshold: number;
  significanceThreshold: number;
}

const DEFAULT_CONFIG: PatternConfig = {
  minSampleSize: 3,
  confidenceThreshold: 60,
  significanceThreshold: 0.3,
};

export class PatternDetectionEngine {
  private trades: TradeWithPsychology[];
  private config: PatternConfig;

  constructor(trades: TradeWithPsychology[], config?: Partial<PatternConfig>) {
    this.trades = trades;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  detectAllPatterns(): InsightPattern[] {
    const patterns: InsightPattern[] = [];

    if (this.trades.length < this.config.minSampleSize) {
      return patterns;
    }

    patterns.push(...this.detectSetupPatterns());
    patterns.push(...this.detectPsychologyPatterns());
    patterns.push(...this.detectBehaviorPatterns());
    patterns.push(...this.detectExecutionPatterns());
    patterns.push(...this.detectCombinationPatterns());

    return patterns.filter(
      (p) => p.confidence >= this.config.confidenceThreshold,
    );
  }

  private detectSetupPatterns(): InsightPattern[] {
    const patterns: InsightPattern[] = [];

    const lowSetupTrades = this.trades.filter(
      (t) => t.setupScore !== undefined && t.setupScore < 50,
    );

    if (lowSetupTrades.length >= this.config.minSampleSize) {
      const winRate = this.calculateWinRate(lowSetupTrades);
      const avgR = this.calculateAvgR(lowSetupTrades);

      if (winRate < 40 && avgR < 0) {
        patterns.push({
          id: `setup-low-${Date.now()}`,
          type: "problem",
          category: "setup",
          title: "Бага чанартай Setup-ийн сөрөг үр дүн",
          description: `Setup score 50%-иас доош ${lowSetupTrades.length} trade-ийн ${winRate.toFixed(0)}% нь ашиггүй, дундаж R ${avgR.toFixed(2)}R байна.`,
          severity: "high",
          confidence: Math.min(90, 60 + lowSetupTrades.length * 2),
          evidence: [
            {
              metric: "setupScore",
              value: 50,
              threshold: 50,
              comparison: "below",
            },
            {
              metric: "winRate",
              value: winRate,
              threshold: 40,
              comparison: "below",
            },
            { metric: "avgR", value: avgR, threshold: 0, comparison: "below" },
          ],
          recommendation:
            "Setup-ийн шаардлагыг бүрэн хангасан үед л trade хийх дүрмийг мөрдөж эхэл. Ухамсартайгаар чанартай setup хүлээх дадал хэвшил.",
          actionable: true,
          tradeIds: lowSetupTrades.map((t) => t.id),
        });
      }
    }

    const highSetupTrades = this.trades.filter(
      (t) => t.setupScore !== undefined && t.setupScore >= 80,
    );

    if (highSetupTrades.length >= this.config.minSampleSize) {
      const winRate = this.calculateWinRate(highSetupTrades);
      const avgR = this.calculateAvgR(highSetupTrades);

      if (winRate > 50 && avgR > 0.5) {
        patterns.push({
          id: `setup-high-${Date.now()}`,
          type: "strength",
          category: "setup",
          title: "Өндөр чанартай Setup-ийн амжилт",
          description: `Setup score 80%+-иас дээш ${highSetupTrades.length} trade-ийн ${winRate.toFixed(0)}% нь ашигтай, дундаж R ${avgR.toFixed(2)}R байна.`,
          severity: "low",
          confidence: Math.min(85, 50 + highSetupTrades.length * 2),
          evidence: [
            {
              metric: "setupScore",
              value: 80,
              threshold: 80,
              comparison: "above",
            },
            {
              metric: "winRate",
              value: winRate,
              threshold: 50,
              comparison: "above",
            },
            {
              metric: "avgR",
              value: avgR,
              threshold: 0.5,
              comparison: "above",
            },
          ],
          recommendation:
            "Өндөр чанартай setup-уудаа тодорхойлж, тэдгээрийн онцлог шинжүүдийг судал. Эдгээр setup-уудыг илүү их хайж олох стратеги боловсруул.",
          actionable: true,
          tradeIds: highSetupTrades.map((t) => t.id),
        });
      }
    }

    return patterns;
  }

  private detectPsychologyPatterns(): InsightPattern[] {
    const patterns: InsightPattern[] = [];

    const tradesWithPsych = this.trades.filter((t) => t.psychology !== null);

    // FOMO pattern
    const fomoTrades = tradesWithPsych.filter(
      (t) => t.psychology?.fomo === true,
    );
    const nonFomoTrades = tradesWithPsych.filter(
      (t) => t.psychology?.fomo === false,
    );

    if (
      fomoTrades.length >= this.config.minSampleSize &&
      nonFomoTrades.length >= this.config.minSampleSize
    ) {
      const fomoWinRate = this.calculateWinRate(fomoTrades);
      const fomoAvgR = this.calculateAvgR(fomoTrades);
      const nonFomoWinRate = this.calculateWinRate(nonFomoTrades);
      const nonFomoAvgR = this.calculateAvgR(nonFomoTrades);

      const diffWinRate = nonFomoWinRate - fomoWinRate;
      const diffAvgR = nonFomoAvgR - fomoAvgR;

      if (diffWinRate > 15 || diffAvgR > 0.5) {
        patterns.push({
          id: `psych-fomo-${Date.now()}`,
          type: "problem",
          category: "psychology",
          title: "FOMO-ийн сөрөг нөлөө",
          description: `FOMO-той ${fomoTrades.length} trade-ийн амжилт (${fomoWinRate.toFixed(0)}%, ${fomoAvgR.toFixed(2)}R) нь FOMO-гүй trade-ээс (${nonFomoWinRate.toFixed(0)}%, ${nonFomoAvgR.toFixed(2)}R) ${diffWinRate.toFixed(0)}% ба ${diffAvgR.toFixed(2)}R-ээр доогуур байна.`,
          severity: "high",
          confidence: Math.min(90, 50 + fomoTrades.length * 3),
          evidence: [
            {
              metric: "fomoWinRate",
              value: fomoWinRate,
              threshold: nonFomoWinRate,
              comparison: "below",
            },
            {
              metric: "fomoAvgR",
              value: fomoAvgR,
              threshold: nonFomoAvgR,
              comparison: "below",
            },
          ],
          recommendation:
            'FOMO мэдрэмж төрөх үед trade хийхгүй байх дүрэм хэрэгжүүл. Trade хийхээс өмнө "Би FOMO-оор хийж байна уу?" гэж өөрөөсөө асуух зуршил эзэмш.',
          actionable: true,
          tradeIds: fomoTrades.map((t) => t.id),
        });
      }
    }

    // Calmness vs Anxiety
    const calmTrades = tradesWithPsych.filter(
      (t) =>
        t.psychology?.calmness_level !== undefined &&
        t.psychology.calmness_level >= 4,
    );
    const anxiousTrades = tradesWithPsych.filter(
      (t) =>
        t.psychology?.anxiety_level !== undefined &&
        t.psychology.anxiety_level >= 4,
    );

    if (
      calmTrades.length >= this.config.minSampleSize &&
      anxiousTrades.length >= this.config.minSampleSize
    ) {
      const calmWinRate = this.calculateWinRate(calmTrades);
      const anxiousWinRate = this.calculateWinRate(anxiousTrades);

      if (calmWinRate - anxiousWinRate > 20) {
        patterns.push({
          id: `psych-calm-${Date.now()}`,
          type: "strength",
          category: "psychology",
          title: "Тайван байдлын ач холбогдол",
          description: `Тайван төлөвтэй (${calmTrades.length}) trade-ийн амжилт (${calmWinRate.toFixed(0)}%) нь түгшсэн төлөвтэй (${anxiousTrades.length}) trade-ээс ${(calmWinRate - anxiousWinRate).toFixed(0)}%-ээр илүү байна.`,
          severity: "medium",
          confidence: Math.min(85, 50 + calmTrades.length * 2),
          evidence: [
            {
              metric: "calmWinRate",
              value: calmWinRate,
              threshold: anxiousWinRate,
              comparison: "above",
            },
          ],
          recommendation:
            "Trade хийхээс өмнө тайвшруулах дасгал, амьсгалын дасгал хийж, сэтгэл санааны тэнцвэрээ хадгалахыг хичээ.",
          actionable: true,
          tradeIds: calmTrades.map((t) => t.id),
        });
      }
    }

    return patterns;
  }

  private detectBehaviorPatterns(): InsightPattern[] {
    const patterns: InsightPattern[] = [];

    const tradesWithBehavior = this.trades.filter((t) => t.behavior !== null);

    const violatedTrades = tradesWithBehavior.filter(
      (t) => t.behavior?.plan_adherence === "violated",
    );
    const fullAdherenceTrades = tradesWithBehavior.filter(
      (t) => t.behavior?.plan_adherence === "full",
    );

    if (
      violatedTrades.length >= this.config.minSampleSize &&
      fullAdherenceTrades.length >= this.config.minSampleSize
    ) {
      const violatedWinRate = this.calculateWinRate(violatedTrades);
      const violatedAvgR = this.calculateAvgR(violatedTrades);
      const fullWinRate = this.calculateWinRate(fullAdherenceTrades);
      const fullAvgR = this.calculateAvgR(fullAdherenceTrades);

      const diffWinRate = fullWinRate - violatedWinRate;
      const diffAvgR = fullAvgR - violatedAvgR;

      if (diffWinRate > 20 || diffAvgR > 0.5) {
        patterns.push({
          id: `behavior-violation-${Date.now()}`,
          type: "problem",
          category: "behavior",
          title: "Төлөвлөгөөг зөрчсөн trade-ийн сөрөг үр дүн",
          description: `Төлөвлөгөөг зөрчсөн ${violatedTrades.length} trade-ийн амжилт (${violatedWinRate.toFixed(0)}%, ${violatedAvgR.toFixed(2)}R) нь бүрэн дагасан trade-ээс (${fullWinRate.toFixed(0)}%, ${fullAvgR.toFixed(2)}R) ${diffWinRate.toFixed(0)}% ба ${diffAvgR.toFixed(2)}R-ээр доогуур байна.`,
          severity: "high",
          confidence: Math.min(90, 50 + violatedTrades.length * 3),
          evidence: [
            {
              metric: "violatedWinRate",
              value: violatedWinRate,
              threshold: fullWinRate,
              comparison: "below",
            },
            {
              metric: "violatedAvgR",
              value: violatedAvgR,
              threshold: fullAvgR,
              comparison: "below",
            },
          ],
          recommendation:
            "Trade хийхээс өмнө төлөвлөгөөгөө бичгээр тэмдэглэж, түүнийг мөрдөх амлалт өөртөө өг. Төлөвлөгөөг зөрчих хүсэл төрөх үед trade-г орхих дүрмийг хэрэгжүүл.",
          actionable: true,
          tradeIds: violatedTrades.map((t) => t.id),
        });
      }
    }

    return patterns;
  }

  private detectExecutionPatterns(): InsightPattern[] {
    const patterns: InsightPattern[] = [];

    const tradesWithReview = this.trades.filter(
      (t) => t.postTradeReview !== null,
    );

    const lowExecutionTrades = tradesWithReview.filter(
      (t) =>
        t.postTradeReview?.execution_quality !== undefined &&
        t.postTradeReview.execution_quality <= 2,
    );
    const highExecutionTrades = tradesWithReview.filter(
      (t) =>
        t.postTradeReview?.execution_quality !== undefined &&
        t.postTradeReview.execution_quality >= 4,
    );

    if (
      lowExecutionTrades.length >= this.config.minSampleSize &&
      highExecutionTrades.length >= this.config.minSampleSize
    ) {
      const lowWinRate = this.calculateWinRate(lowExecutionTrades);
      const highWinRate = this.calculateWinRate(highExecutionTrades);
      const lowAvgR = this.calculateAvgR(lowExecutionTrades);
      const highAvgR = this.calculateAvgR(highExecutionTrades);

      if (highWinRate - lowWinRate > 20 || highAvgR - lowAvgR > 0.5) {
        patterns.push({
          id: `exec-quality-${Date.now()}`,
          type: "problem",
          category: "execution",
          title: "Гүйцэтгэлийн чанарын нөлөө",
          description: `Гүйцэтгэлийн чанар багатай (${lowExecutionTrades.length}) trade-ийн амжилт (${lowWinRate.toFixed(0)}%, ${lowAvgR.toFixed(2)}R) нь чанартай (${highExecutionTrades.length}) trade-ээс доогуур байна.`,
          severity: "high",
          confidence: Math.min(85, 50 + lowExecutionTrades.length * 2),
          evidence: [
            {
              metric: "executionQuality",
              value: 2,
              threshold: 4,
              comparison: "below",
            },
          ],
          recommendation:
            "Trade гүйцэтгэхдээ төлөвлөгөөгөө яг дагаж, тэвчээртэй байхыг хичээ. Гүйцэтгэлийн чанарыг сайжруулахын тулд trade хийхээс өмнө бүх шалгуураа шалгаж авах дадал.",
          actionable: true,
          tradeIds: lowExecutionTrades.map((t) => t.id),
        });
      }
    }

    return patterns;
  }

  private detectCombinationPatterns(): InsightPattern[] {
    const patterns: InsightPattern[] = [];

    const tradesWithPsych = this.trades.filter((t) => t.psychology !== null);

    // FOMO + low setup
    const fomoLowSetup = tradesWithPsych.filter(
      (t) =>
        t.psychology?.fomo === true &&
        t.setupScore !== undefined &&
        t.setupScore < 60,
    );

    if (fomoLowSetup.length >= this.config.minSampleSize) {
      const winRate = this.calculateWinRate(fomoLowSetup);
      const avgR = this.calculateAvgR(fomoLowSetup);

      if (winRate < 30 && avgR < -0.5) {
        patterns.push({
          id: `combo-fomo-setup-${Date.now()}`,
          type: "problem",
          category: "general",
          title: "Хамгийн эрсдэлтэй хослол: FOMO + Бага чанартай Setup",
          description: `FOMO-той, setup score 60%-иас доош ${fomoLowSetup.length} trade-ийн амжилт ${winRate.toFixed(0)}%, дундаж R ${avgR.toFixed(2)}R байна.`,
          severity: "critical",
          confidence: Math.min(95, 60 + fomoLowSetup.length * 3),
          evidence: [
            {
              metric: "winRate",
              value: winRate,
              threshold: 30,
              comparison: "below",
            },
            {
              metric: "avgR",
              value: avgR,
              threshold: -0.5,
              comparison: "below",
            },
          ],
          recommendation:
            "FOMO мэдрэмж төрөх үед setup-аа дахин шалга. Хоёр нөхцөл (FOMO + бага чанартай setup) нэгэн зэрэг тохиолдоход trade хийхгүй байх хатуу дүрэм хэрэгжүүл.",
          actionable: true,
          tradeIds: fomoLowSetup.map((t) => t.id),
        });
      }
    }

    return patterns;
  }

  // ─── Helper Methods ───────────────────────────────────────────────

  // ✅ Fix: Use 'profit' instead of 'pnl'
  private calculateWinRate(trades: TradeWithPsychology[]): number {
    if (trades.length === 0) return 0;
    const wins = trades.filter(
      (t) => t.profit !== undefined && t.profit !== null && t.profit > 0,
    ).length;
    return (wins / trades.length) * 100;
  }

  private calculateAvgR(trades: TradeWithPsychology[]): number {
    if (trades.length === 0) return 0;
    const sumR = trades.reduce((sum, t) => sum + getRMultiple(t), 0);
    return sumR / trades.length;
  }
}
