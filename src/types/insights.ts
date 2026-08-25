// src/types/insights.ts

export interface InsightPattern {
  id: string;
  // ✅ type can be: 'problem', 'strength', 'opportunity', 'warning'
  type: "problem" | "strength" | "opportunity" | "warning";
  category: "setup" | "psychology" | "behavior" | "execution" | "general";
  title: string;
  description: string;
  // ✅ severity can be: 'critical', 'high', 'medium', 'low'
  severity: "critical" | "high" | "medium" | "low";
  confidence: number;
  evidence: {
    metric: string;
    value: number;
    threshold: number;
    comparison: "above" | "below" | "equal";
  }[];
  recommendation: string;
  actionable: boolean;
  tradeIds?: string[];
}

export interface InsightRecommendation {
  id: string;
  title: string;
  description: string;
  action: string;
  priority: "high" | "medium" | "low";
  category: string;
  expectedImpact: string;
}

export interface PsychologySummary {
  totalTrades: number;
  winRate: number;
  avgR: number;
  totalPnl: number;
  maxDrawdown: number;
}

export interface PatternDetectionResult {
  patterns: InsightPattern[];
  recommendations: InsightRecommendation[];
  summary: PsychologySummary;
  topStrengths: string[];
  topWeaknesses: string[];
}
