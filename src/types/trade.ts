export type TradeType = "buy" | "sell";
export type TradeDirection = "long" | "short";
export type TradeStatus = "open" | "closed";
export type TradeOutcome = "win" | "loss" | "breakeven";

export type Trade = {
  id: string;
  user_id: string;
  account_id: string;
  symbol: string;
  type: TradeType;
  entry_price: number;
  exit_price: number;
  profit: number;
  lot_size: number;
  stop_loss: number;
  take_profit: number;
  strategy_profile_id: string | null;
  open_time: string;
  close_time: string | null;
  hasPsychology?: boolean;
  hasBehavior?: boolean;
  hasPostTrade?: boolean;
  hasSetup?: boolean;
};

// src/types/trade.ts (Add these fields)

export interface TradeWithPsychology extends Trade {
  // ✅ Use 'profit' instead of 'pnl'
  profit: number;
  pnl?: number; // For backward compatibility

  // Psychology data
  psychology?: {
    id: string;
    trade_id: string;
    user_id: string;
    calmness_level: number;
    anxiety_level: number;
    fear_level: number;
    greed_level: number;
    frustration_level: number;
    confidence_level: number;
    focus_level: number;
    patience_level: number;
    decision_clarity_level: number;
    decision_pressure_level: number;
    rushed_decision: boolean;
    fomo: boolean;
    emotional_carryover: boolean;
    created_at: string;
    updated_at: string;
  } | null;

  // Behavior data
  behavior?: {
    id: string;
    trade_id: string;
    user_id: string;
    plan_adherence: "full" | "partial" | "violated";
    sl_modification: "none" | "as_planned" | "increased_risk" | "emotional";
    tp_modification: "none" | "based_on_new_info" | "fear" | "greed";
    early_exit: "no" | "as_planned" | "fear" | "impatience";
    created_at: string;
    updated_at: string;
  } | null;

  // Post-trade review
  postTradeReview?: {
    id: string;
    trade_id: string;
    user_id: string;
    execution_quality: number;
    would_take_again: "yes" | "yes_with_changes" | "no";
    reflection: string;
    lesson_learned: string;
    notes: string;
    created_at: string;
    updated_at: string;
  } | null;

  // Calculated fields
  setupScore?: number;
  rMultiple?: number;
}
// formatTradeFromDatabase дотор strategy_profile_id нэмэх
function formatTradeFromDatabase(trade: any): Trade {
  return {
    ...trade,
    strategy_profile_id: trade.strategy_profile_id || null, // 🆕
    open_time: trade.open_time ? new Date(trade.open_time) : new Date(),
    close_time: trade.close_time ? new Date(trade.close_time) : undefined,
  };
}

export type TradeInsert = {
  account_id: string;

  symbol: string;
  type: TradeType;

  entry_price: number;
  exit_price: number;
  profit: number;

  lot_size: number;

  stop_loss: number;
  take_profit: number;

  open_time: string;
  close_time: string | null;
};

export type TradeUpdate = Partial<TradeInsert>;

export type PlanAdherence = "full" | "partial" | "violated";
export type SLModification =
  | "none"
  | "as_planned"
  | "increased_risk"
  | "emotional";
export type TPModification = "none" | "based_on_new_info" | "fear" | "greed";
export type EarlyExit = "no" | "as_planned" | "fear" | "impatience";

export interface TradeBehavior {
  id: string;
  trade_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;

  plan_adherence: PlanAdherence | null;
  sl_modification: SLModification | null;
  tp_modification: TPModification | null;
  early_exit: EarlyExit | null;
}

export interface PostTradeReview {
  id: string;
  trade_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  execution_quality: number | null;
  would_take_again: WouldTakeAgain | null;
  reflection: string | null;
  lesson_learned: string | null;
  notes: string | null;
}

export type WouldTakeAgain = "yes" | "yes_with_changes" | "no";

export type ChecklistGroup =
  | "market_context"
  | "setup_validation"
  | "entry_confirmation"
  | "risk_reward"
  | "trade_permission"
  | "other";

export interface ChecklistItem {
  id: string;
  user_id: string;
  group_name: ChecklistGroup;
  title: string;
  description: string | null;
  type: "boolean" | "rating" | "text";
  required: boolean;
  critical: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}
export interface ChecklistResponse {
  id: string;
  user_id: string;
  trade_id: string;
  checklist_item_id: string;
  value: string | null;
  rating: number | null;
  text_value: string | null;
  response_status:
    | "met"
    | "partially_met"
    | "not_met"
    | "not_applicable"
    | null;
  created_at: string;
  updated_at: string;
}
export interface ChecklistResult {
  id: string;
  trade_id: string;
  checklist_item_id: string;
  value_boolean: boolean | null;
  value_number: number | null;
  value_text: string | null;
  created_at: string;
}

export interface StrategyProfile {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
