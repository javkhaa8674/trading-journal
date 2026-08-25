// src/types/report.ts

export interface PsychologyReport {
  generatedAt: string;
  reportId: string;
  userId: string;
  dateRange: {
    from: string;
    to: string;
  };
  filters: {
    accountId?: string;
    strategyId?: string;
  };
  summary: {
    totalTrades: number;
    winRate: number;
    avgR: number;
    totalPnl: number;
    maxDrawdown: number;
    profitableTrades: number;
    losingTrades: number;
    bestTrade: {
      date: string;
      rMultiple: number;
      pnl: number;
    };
    worstTrade: {
      date: string;
      rMultiple: number;
      pnl: number;
    };
  };
  psychology: {
    averageStates: {
      calmness: number;
      anxiety: number;
      fear: number;
      greed: number;
      frustration: number;
      confidence: number;
      focus: number;
      patience: number;
      decisionClarity: number;
      decisionPressure: number;
    };
    flags: {
      fomoCount: number;
      fomoPercentage: number;
      rushedDecisionCount: number;
      emotionalCarryoverCount: number;
    };
    correlations: {
      fomoVsWinRate: number;
      calmnessVsWinRate: number;
      confidenceVsWinRate: number;
      anxietyVsWinRate: number;
    };
  };
  behavior: {
    planAdherence: {
      full: number;
      partial: number;
      violated: number;
    };
    slModification: {
      none: number;
      asPlanned: number;
      increasedRisk: number;
      emotional: number;
    };
    tpModification: {
      none: number;
      basedOnNewInfo: number;
      fear: number;
      greed: number;
    };
    earlyExit: {
      no: number;
      asPlanned: number;
      fear: number;
      impatience: number;
    };
    winRateByBehavior: {
      planAdherence: Record<string, number>;
      earlyExit: Record<string, number>;
      slModification: Record<string, number>;
    };
  };
  setup: {
    averageScore: number;
    distribution: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
    };
    winRateByScore: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
    };
    avgRByScore: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
    };
    topPerformingItems: string[];
    bottomPerformingItems: string[];
  };
  postTrade: {
    averageExecutionQuality: number;
    wouldTakeAgain: {
      yes: number;
      yesWithChanges: number;
      no: number;
    };
    commonReflections: string[];
    commonLessons: string[];
  };
  patterns: {
    detected: Array<{
      name: string;
      description: string;
      severity: string;
      confidence: number;
    }>;
    strengths: string[];
    weaknesses: string[];
  };
  recommendations: Array<{
    title: string;
    description: string;
    action: string;
    priority: string;
    category: string;
    expectedImpact: string;
  }>;
  rawData: {
    trades: any[];
    psychology: any[];
    behavior: any[];
    setup: any[];
    postTrade: any[];
  };
  aiPrompt: string;
}

export interface ReportGenerationOptions {
  includeRawData?: boolean;
  includeAIPrompt?: boolean;
  format?: "json" | "markdown" | "text";
  language?: "mn" | "en";
}
