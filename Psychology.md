Psychology System — Final Roadmap (UPDATED)
Үндсэн зорилго
Өдрийн тэмдэглэлээс Trade-based Psychology Review систем рүү шилжинэ.

OLD NEW
Day Trade
├── Mood ├── Setup Validation
├── Today's trades ├── Pre-Trade Psychology
├── Today's mistakes ├── Trade Behavior
└── Today's notes └── Post-Trade Review
Day нь үндсэн journal entity биш болно. Харин дараа нь trade-үүдийг нэгтгэн харах aggregation/context болно.

Phase Status
Phase Status Description
Phase 1 — Trade-based Psychology 🟢 DONE Trade-based architecture, database foundation
Phase 2 — Dynamic Setup Validation 🟢 DONE Checklist UI, Response, Result Calculation
Phase 3 — Pre-Trade Psychology 🟢 DONE Full implementation with 13 fields (1-5 scale)
Phase 4 — Trade Behavior 🟢 DONE Plan Adherence, SL/TP Modification, Early Exit
Phase 5 — Post-Trade Review 🟢 DONE Execution Quality, Would Take Again, Reflection
Phase 6 — Unified Trade Review 🟢 DONE All components integrated into one page
Phase 7 — Psychology Analytics 🔴 FUTURE Setup → Result, Psychology → Result, Behavior → Result
Phase 8 — Insight / Coaching Layer 🔴 FUTURE Pattern detection, recommendations
Phase 1 — Trade-based Psychology 🟢 DONE
Database
Table Status
trade_checklist_items 🟢 Created
trade_checklist_responses 🟢 Created
trade_checklist_results 🟢 Created
Phase 2 — Dynamic Setup Validation 🟢 DONE
Response Architecture
trade_checklist_responses:

text
├── id
├── user_id
├── trade_id
├── checklist_item_id
├── value
├── rating
├── text_value
├── response_status ← met | partially_met | not_met | not_applicable
├── created_at
└── updated_at
Response Status:

met = 1 (full score)

partially_met = 0.5

not_met = 0

not_applicable = excluded from denominator

null = Unanswered (incomplete)

Setup Validation Result Calculation
Example:

text
HTF Bias → Met (1)
Liquidity → Met (1)
MSS → Partially Met (0.5)
FVG → Not Met (0)
Entry → N/A (excluded)

Result: 2.5 / 4 = 62.5%
UI Components
✅ Boolean checklist: [Met] [Partially Met] [Not Met] [N/A]

✅ Rating: 1-5 scale

✅ Text: Free-text input

✅ Response Save / Load

✅ Result Calculation

Strategy Profiles
✅ Multiple strategy profiles per user

✅ Profile-based checklist items

✅ Active profile selection

✅ Trade strategy assignment

Phase 3 — Pre-Trade Psychology 🟢 DONE
Database Schema — trade_psychology
sql
trade_psychology
├── id
├── trade_id (UNIQUE)
├── user_id
├── created_at
├── updated_at
│
├── Emotional State (1-5 scale)
│ ├── calmness_level
│ ├── anxiety_level
│ ├── fear_level
│ ├── greed_level
│ ├── frustration_level
│ └── confidence_level
│
├── Cognitive State (1-5 scale)
│ ├── focus_level
│ ├── patience_level
│ ├── decision_clarity_level
│ └── decision_pressure_level
│
└── Decision & Emotional Flags (boolean)
├── rushed_decision
├── fomo
└── emotional_carryover
UI Components
✅ Emotional State: 6 fields (1-5 scale)

✅ Cognitive State: 4 fields (1-5 scale)

✅ Decision & Emotional Flags: 3 boolean fields

✅ Save / Load

✅ Error handling

✅ User filtering

Phase 4 — Trade Behavior 🟢 DONE
Database Schema — trade_behavior
sql
trade_behavior
├── id
├── trade_id (UNIQUE)
├── user_id
├── created_at
├── updated_at
│
├── plan_adherence -- 'full' | 'partial' | 'violated'
├── sl_modification -- 'none' | 'as_planned' | 'increased_risk' | 'emotional'
├── tp_modification -- 'none' | 'based_on_new_info' | 'fear' | 'greed'
└── early_exit -- 'no' | 'as_planned' | 'fear' | 'impatience'
UI Components
✅ Plan Adherence: Full | Partial | Violated

✅ Stop Loss Modification: None | As Planned | Increased Risk | Emotional

✅ Take Profit Modification: None | Based on New Info | Fear | Greed

✅ Early Exit: No | As Planned | Fear | Impatience

✅ Save / Load

Phase 5 — Post-Trade Review 🟢 DONE
Database Schema — post_trade_review
sql
post_trade_review
├── id
├── trade_id (UNIQUE)
├── user_id
├── created_at
├── updated_at
│
├── execution_quality -- 1-5 scale
├── would_take_again -- 'yes' | 'yes_with_changes' | 'no'
├── reflection -- free-text
├── lesson_learned -- free-text
└── notes -- free-text
Trade Information (Auto-display from trades table)
Entry, SL, TP, Exit Price

P&L, R-Multiple

Win/Loss, Duration

User Inputs
✅ Execution Quality: 1-5 scale with labels (Маш муу → Маш сайн)

✅ Would Take Again: Yes | Yes with changes | No

✅ Reflection: Free-text

✅ Lesson Learned: Free-text

✅ Additional Notes: Free-text

Phase 6 — Unified Trade Review 🟢 DONE
Final UX — Trade #123 — Review
text
┌─────────────────────────────────────────────┐
│ 📊 Trade Information │
│ Entry / SL / TP / Exit / P&L / R / Duration │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 🎯 Strategy Profile Selector │
│ [SMC ✓] [EMA Pullback] [Breakout] [General]│
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ✅ Setup Validation │
│ Met: 3 | Partial: 1 | Not Met: 1 | N/A: 1 │
│ Score: 4.5 / 5 — 90% │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 🧠 Pre-Trade Psychology │
│ Calmness: 4/5 | Anxiety: 2/5 | FOMO: No │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ⚡ Trade Behavior │
│ Plan Adherence: Full | Early Exit: No │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 📝 Post-Trade Review │
│ Execution Quality: 4/5 | Would Take: Yes │
│ Reflection: ... │
└─────────────────────────────────────────────┘
Components Integrated
Component File Status
Trade Information page.tsx 🟢 Displayed
Strategy Profile Selector ChecklistSection.tsx 🟢 Integrated
Setup Validation ChecklistSection.tsx 🟢 Integrated
Pre-Trade Psychology TradePsychology.tsx 🟢 Integrated
Trade Behavior TradeBehavior.tsx 🟢 Integrated
Post-Trade Review PostTradeReview.tsx 🟢 Integrated
Trade Navigation — /trades/page.tsx
Action Button Status
Chart [📊 Chart] 🟢 Available
Review [📝 Review] 🟢 Available
Edit [✏️ Edit] 🟢 Available
Delete [🗑️ Delete] 🟢 Available
Edit — Only basic trade data (Entry, SL, TP, Lot, Times, Account, Symbol, Direction)
Review — All psychology/quality data (Setup Validation, Pre-Trade, Behavior, Post-Trade)

Phase 7 — Psychology Analytics 🔴 FUTURE
Analysis Categories
Setup → Result

text
Setup fully met
↓
Win Rate | Average R | Profit Factor
Psychology → Result

text
Anxiety | FOMO | Confidence
↓
Win Rate | Average R
Behavior → Result

text
Moved SL | Early Exit | Plan Violation
↓
Average R | Win Rate
Core Question
"Би ямар нөхцөлд хамгийн сайн, ямар нөхцөлд хамгийн муу trade хийдэг вэ?"

Phase 8 — Insight / Coaching Layer 🔴 FUTURE
Example Insights
Problem Detection:

Сүүлийн 30 trade-ийн 9-д FOMO тэмдэглэгдсэн бөгөөд эдгээр trade-ийн дундаж үр дүн -0.91R байна.

Setup Issue:

Setup-ийн шаардлагыг бүрэн хангаагүй trade-үүдийн average R -0.84R байна.

Execution Pattern:

Ашигтай trade-үүдийг төлөвлөсөн түвшинд хүрэхээс өмнө хаах хандлага байна.

Recommendation:

Дараагийн 10 trade дээр FOMO-той үед trade хийхгүй байх дүрмийг турш.

Logic Flow
text
Data → Pattern → Problem → Recommendation
Database Summary
Table Purpose Status
trade_checklist_items User-defined checklist items with groups 🟢
trade_checklist_responses Checklist responses per trade 🟢
trade_checklist_results Normalized results 🟢
trade_psychology Pre-trade psychology (13 fields) 🟢
trade_behavior Trade behavior (4 fields) 🟢
post_trade_review Post-trade review (5 fields) 🟢
strategy_profiles Strategy profiles per user 🟢
Implementation Flow
text
Phase 1 ✅
↓
Phase 2 ✅
↓
Phase 3 ✅
↓
Phase 4 ✅
↓
Phase 5 ✅
↓
Phase 6 ✅
↓
Phase 7 🔴 FUTURE
↓
Phase 8 🔴 FUTURE
Files Created/Modified
Components
File Purpose
src/components/trades/TradePsychology.tsx Pre-Trade Psychology UI
src/components/trades/TradeBehavior.tsx Trade Behavior UI
src/components/trades/PostTradeReview.tsx Post-Trade Review UI
src/components/trades/ChecklistSection.tsx Setup Validation + Strategy Profile Selector UI
src/app/trades/[id]/page.tsx Unified Trade Review page
src/components/trades/TradeForm.tsx Trade creation form with strategy support
Types
File Purpose
src/types/trade.ts All trade-related TypeScript types (Trade, StrategyProfile, ChecklistItem, etc.)
Hooks
File Purpose
src/lib/hooks/useTrades.ts Trade CRUD + PostTradeReview + updateTradeStrategy
Migrations
File Purpose
supabase/migrations/20260315_add_trade_behavior.sql Trade Behavior table
supabase/migrations/20260315_add_post_trade_review.sql Post-Trade Review table
supabase/migrations/\*\_trade_psychology.sql Pre-Trade Psychology table
supabase/migrations/20260320_add_strategy_profiles.sql Strategy Profiles + checklist items + trades updates
Current Status: ✅ PHASES 1-6 COMPLETE
All core psychology features are implemented:

✅ Setup Validation (Dynamic Checklist with Groups)

✅ Strategy Profiles (Multiple strategies per user)

✅ Pre-Trade Psychology (13 structured fields)

✅ Trade Behavior (4 behavior categories)

✅ Post-Trade Review (Quality + Reflection)

✅ Unified Trade Review (All in one page with strategy selector)

✅ Edit/Review separation

✅ Light/Dark mode support

Next Steps:

Collect enough trade data

Implement Psychology Analytics (Phase 7)

Build Insight Layer (Phase 8)
