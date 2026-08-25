// src/lib/analytics/index.ts

import { calculateSetupAnalytics } from "./setupAnalytics";
import { calculatePsychologyAnalytics } from "./psychologyAnalytics";
import { calculateBehaviorAnalytics } from "./behaviorAnalytics";
import { calculateCrossAnalytics } from "./crossAnalytics";
import { generateInsights } from "./insights";

// 🆕 Export new pattern detection and insight generator
export { PatternDetectionEngine } from "./patternDetection";
export { InsightGenerator } from "./insightGenerator";

// 🆕 Export types
export type {
  InsightPattern,
  InsightRecommendation,
  PatternDetectionResult,
} from "@/types/insights";

// Re-export existing analytics functions
export {
  calculateSetupAnalytics,
  calculatePsychologyAnalytics,
  calculateBehaviorAnalytics,
  calculateCrossAnalytics,
  generateInsights,
};
