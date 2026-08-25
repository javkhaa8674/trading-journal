// src/lib/analytics/insightGenerator.ts

import { TradeWithPsychology } from "@/types/trade";
import {
  InsightPattern,
  InsightRecommendation,
  PatternDetectionResult,
} from "@/types/insights";
import { PatternDetectionEngine } from "./patternDetection";

// ============================================================
// R-Multiple Helper
// ============================================================

export function getRMultiple(trade: any): number {
  if (!trade.profit) return 0;

  if (trade.entry_price && trade.stop_loss && trade.lot_size) {
    const pipSize = trade.symbol === "XAUUSD" ? 0.01 : 0.0001;
    const riskInPips = Math.abs(trade.entry_price - trade.stop_loss) / pipSize;
    const riskInMoney = riskInPips * trade.lot_size * 10;
    if (riskInMoney > 0) {
      return parseFloat((trade.profit / riskInMoney).toFixed(2));
    }
  }

  return 0;
}

// ============================================================
// MAIN INSIGHT GENERATOR
// ============================================================

export class InsightGenerator {
  private trades: TradeWithPsychology[];

  constructor(trades: TradeWithPsychology[]) {
    this.trades = trades;
  }

  generate(): PatternDetectionResult {
    const engine = new PatternDetectionEngine(this.trades);
    const patterns = engine.detectAllPatterns();

    const recommendations = this.generateRecommendations(patterns);
    const summary = this.calculateSummary();
    const { topStrengths, topWeaknesses } =
      this.extractStrengthsAndWeaknesses(patterns);

    return {
      patterns,
      recommendations,
      summary,
      topStrengths,
      topWeaknesses,
    };
  }

  private generateRecommendations(
    patterns: InsightPattern[],
  ): InsightRecommendation[] {
    const recommendations: InsightRecommendation[] = [];

    const actionablePatterns = patterns.filter((p) => p.actionable);

    const groupedByCategory = actionablePatterns.reduce(
      (acc, p) => {
        if (!acc[p.category]) acc[p.category] = [];
        acc[p.category].push(p);
        return acc;
      },
      {} as Record<string, InsightPattern[]>,
    );

    for (const [category, patterns] of Object.entries(groupedByCategory)) {
      const sorted = patterns.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return (
          (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0)
        );
      });

      const topPatterns = sorted.slice(0, 3);

      for (const pattern of topPatterns) {
        recommendations.push({
          id: `rec-${pattern.id}`,
          title: pattern.title
            .replace("сөрөг", "сайжруулах")
            .replace("эрсдэлтэй", "анхаарах")
            .replace("хамгийн муу", "сайжруулах"),
          description: pattern.description,
          action: pattern.recommendation,
          priority:
            pattern.severity === "critical" || pattern.severity === "high"
              ? "high"
              : pattern.severity === "medium"
                ? "medium"
                : "low",
          category: this.getCategoryLabel(pattern.category),
          expectedImpact: this.getExpectedImpact(pattern.severity),
        });
      }
    }

    if (recommendations.length === 0 && this.trades.length >= 5) {
      recommendations.push({
        id: "rec-general",
        title: "Trade тэмдэглэлээ тогтмол хөтлөх",
        description:
          "Одоогоор тодорхой хэв шинж илрээгүй байна. Trade-үүдээ тогтмол тэмдэглэж, сэтгэл зүйн төлөвөө дүгнэж байх нь урт хугацаанд ашигтай.",
        action:
          "Өдөр бүр trade тэмдэглэл хөтөлж, сэтгэл зүйн төлөвөө үнэлэх дадлага хий.",
        priority: "medium",
        category: "Ерөнхий зөвлөмж",
        expectedImpact:
          "Урт хугацаанд сэтгэл зүйн тогтвортой байдал, илүү сайн шийдвэр гаргалт",
      });
    }

    return recommendations;
  }

  private calculateSummary(): PatternDetectionResult["summary"] {
    const totalTrades = this.trades.length;

    // ✅ Fix: Use 'profit' instead of 'pnl'
    const wins = this.trades.filter(
      (t) => t.profit !== undefined && t.profit !== null && t.profit > 0,
    ).length;

    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

    // ✅ Fix: Use getRMultiple with 'profit'
    const avgR =
      totalTrades > 0
        ? this.trades.reduce((sum, t) => sum + getRMultiple(t), 0) / totalTrades
        : 0;

    // ✅ Fix: Use 'profit' instead of 'pnl'
    const totalPnl = this.trades.reduce((sum, t) => sum + (t.profit || 0), 0);

    // Calculate max drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let runningTotal = 0;
    for (const trade of this.trades) {
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
    };
  }

  private extractStrengthsAndWeaknesses(patterns: InsightPattern[]): {
    topStrengths: string[];
    topWeaknesses: string[];
  } {
    const strengths = patterns
      .filter((p) => p.type === "strength")
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
      .map((p) => p.title);

    const weaknesses = patterns
      .filter((p) => p.type === "problem" || p.type === "warning")
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
      .map((p) => p.title);

    return {
      topStrengths: strengths,
      topWeaknesses: weaknesses,
    };
  }

  private getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      setup: "Setup анализ",
      psychology: "Сэтгэл зүйн анализ",
      behavior: "Зах зээлийн зан үйлийн анализ",
      execution: "Гүйцэтгэлийн анализ",
      general: "Ерөнхий анализ",
    };
    return labels[category] || category;
  }

  private getExpectedImpact(severity: string): string {
    const impacts: Record<string, string> = {
      critical: "Энэ асуудлыг шийдвэл гүйцэтгэлд ихээхэн эерэг нөлөө үзүүлнэ",
      high: "Асуудлыг шийдвэл гүйцэтгэлд мэдэгдэхүйц эерэг нөлөө үзүүлнэ",
      medium: "Асуудлыг шийдвэл гүйцэтгэлд дунд зэргийн эерэг нөлөө үзүүлнэ",
      low: "Асуудлыг шийдвэл гүйцэтгэлд бага зэргийн эерэг нөлөө үзүүлнэ",
    };
    return impacts[severity] || "Гүйцэтгэлд эерэг нөлөө үзүүлнэ";
  }
}
