# Psychology System — Final Roadmap (UPDATED)

ҮНДСЭН ЗОРИЛГО
────────────────────────────────────────────────────────────────────────────────
Өдрийн тэмдэглэлээс Trade-based Psychology Review систем рүү шилжинэ.

OLD NEW
────────────────────────────────────────────────────────────────────────────────
Day Trade
├── Mood ├── Setup Validation
├── Today's trades ├── Pre-Trade Psychology
├── Today's mistakes ├── Trade Behavior
└── Today's notes └── Post-Trade Review

Day нь үндсэн journal entity биш болно. Харин дараа нь trade-үүдийг
нэгтгэн харах aggregation/context болно.

PHASE STATUS
────────────────────────────────────────────────────────────────────────────────
Phase Status Description
────────────────────────────────────────────────────────────────────────────────
Phase 1 🟢 DONE Trade-based architecture, database foundation
Phase 2 🟢 DONE Checklist UI, Response, Result Calculation
Phase 3 🟢 DONE Full implementation with 13 fields (1-5 scale)
Phase 4 🟢 DONE Plan Adherence, SL/TP Modification, Early Exit
Phase 5 🟢 DONE Execution Quality, Would Take Again, Reflection
Phase 6 🟢 DONE All components integrated into one page
Phase 7 🔴 FUTURE Setup → Result, Psychology → Result, Behavior → Result
Phase 8 🔴 FUTURE Pattern detection, recommendations

PHASE 1 — TRADE-BASED PSYCHOLOGY 🟢 DONE
────────────────────────────────────────────────────────────────────────────────
Database
────────────────────────────────────────────────────────────────────────────────
Table Status
────────────────────────────────────────────────────────────────────────────────
trade_checklist_items 🟢 Created
trade_checklist_responses 🟢 Created
trade_checklist_results 🟢 Created

PHASE 2 — DYNAMIC SETUP VALIDATION 🟢 DONE
────────────────────────────────────────────────────────────────────────────────
Response Architecture - trade_checklist_responses:
────────────────────────────────────────────────────────────────────────────────
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
────────────────────────────────────────────────────────────────────────────────
met = 1 (full score)
partially_met = 0.5
not_met = 0
not_applicable = excluded from denominator
null = Unanswered (incomplete)

Setup Validation Result Calculation - Example:
────────────────────────────────────────────────────────────────────────────────
HTF Bias → Met (1)
Liquidity → Met (1)
MSS → Partially Met (0.5)
FVG → Not Met (0)
Entry → N/A (excluded)
────────────────────────────────────────────────────────────────────────────────
Result: 2.5 / 4 = 62.5%

UI Components:
────────────────────────────────────────────────────────────────────────────────
✅ Boolean checklist: [Met] [Partially Met] [Not Met] [N/A]
✅ Rating: 1-5 scale
✅ Text: Free-text input
✅ Response Save / Load
✅ Result Calculation

Strategy Profiles:
────────────────────────────────────────────────────────────────────────────────
✅ Multiple strategy profiles per user
✅ Profile-based checklist items
✅ Active profile selection
✅ Trade strategy assignment

PHASE 3 — PRE-TRADE PSYCHOLOGY 🟢 DONE
────────────────────────────────────────────────────────────────────────────────
Database Schema — trade_psychology
────────────────────────────────────────────────────────────────────────────────
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

UI Components:
────────────────────────────────────────────────────────────────────────────────
✅ Emotional State: 6 fields (1-5 scale)
✅ Cognitive State: 4 fields (1-5 scale)
✅ Decision & Emotional Flags: 3 boolean fields
✅ Save / Load
✅ Error handling
✅ User filtering
✅ View / Create / Edit modes with mode="view" | "create" | "edit"

PHASE 4 — TRADE BEHAVIOR 🟢 DONE
────────────────────────────────────────────────────────────────────────────────
Database Schema — trade_behavior
────────────────────────────────────────────────────────────────────────────────
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

UI Components:
────────────────────────────────────────────────────────────────────────────────
✅ Plan Adherence: Full | Partial | Violated
✅ Stop Loss Modification: None | As Planned | Increased Risk | Emotional
✅ Take Profit Modification: None | Based on New Info | Fear | Greed
✅ Early Exit: No | As Planned | Fear | Impatience
✅ Save / Load
✅ View / Create / Edit modes

PHASE 5 — POST-TRADE REVIEW 🟢 DONE
────────────────────────────────────────────────────────────────────────────────
Database Schema — post_trade_review
────────────────────────────────────────────────────────────────────────────────
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

Trade Information (Auto-display from trades table):
────────────────────────────────────────────────────────────────────────────────
Entry, SL, TP, Exit Price
P&L, R-Multiple
Win/Loss, Duration

User Inputs:
────────────────────────────────────────────────────────────────────────────────
✅ Execution Quality: 1-5 scale with labels (Маш муу → Маш сайн)
✅ Would Take Again: Yes | Yes with changes | No
✅ Reflection: Free-text
✅ Lesson Learned: Free-text
✅ Additional Notes: Free-text
✅ View / Create / Edit modes

PHASE 6 — UNIFIED TRADE REVIEW 🟢 DONE
────────────────────────────────────────────────────────────────────────────────
Final UX — Trade #123 — Review
────────────────────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📊 Trade Information │
│ Entry / SL / TP / Exit / P&L / R / Duration / Strategy Name │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 🎯 Strategy Profile Selector │
│ [SMC ✓] [EMA Pullback] [Breakout] [General] │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ ✅ Setup Validation │
│ Met: 3 | Partial: 1 | Not Met: 1 | N/A: 1 │
│ Score: 4.5 / 5 — 90% │
│ 🆕 Progress Bar: Required items answered │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 🧠 Pre-Trade Psychology │
│ Calmness: 4/5 | Anxiety: 2/5 | FOMO: No │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚡ Trade Behavior │
│ Plan Adherence: Full | Early Exit: No │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 📝 Post-Trade Review │
│ Execution Quality: 4/5 | Would Take: Yes │
│ Reflection: ... │
└─────────────────────────────────────────────────────────────────────────────┘

Components Integrated:
────────────────────────────────────────────────────────────────────────────────
Component File Status
────────────────────────────────────────────────────────────────────────────────
Trade Information page.tsx 🟢 Displayed
Strategy Profile Selector ChecklistSection.tsx 🟢 Integrated
Setup Validation ChecklistSection.tsx 🟢 Integrated
Pre-Trade Psychology TradePsychology.tsx 🟢 Integrated
Trade Behavior TradeBehavior.tsx 🟢 Integrated
Post-Trade Review PostTradeReview.tsx 🟢 Integrated

Trade Navigation — /trades/page.tsx
────────────────────────────────────────────────────────────────────────────────
Action Button Status
────────────────────────────────────────────────────────────────────────────────
Chart [📊 Chart] 🟢 Available
Review [📝 Review] 🟢 Available
Edit [✏️ Edit] 🟢 Available
Delete [🗑️ Delete] 🟢 Available

Edit — Only basic trade data (Entry, SL, TP, Lot, Times, Account, Symbol, Direction)
Review — All psychology/quality data (Setup Validation, Pre-Trade, Behavior, Post-Trade)

🆕 UI ENHANCEMENTS (Phase 6+)
────────────────────────────────────────────────────────────────────────────────

1. Trade List Psychology Status
   ────────────────────────────────────────────────────────────────────────────
   📊 Сэтгэл зүйн статусыг Progress Bar + хувь хэмжээгээр харуулах
   ✅✅✅✅ Бүрэн ████████████ 100%
   ✅⬜⬜✅ 50% ██████░░░░░░ 50%
   ✅⬜⬜⬜ 25% ███░░░░░░░░░ 25%
   ⬜⬜⬜⬜ 0% ░░░░░░░░░░░░ 0%

2. READ / EDIT хуудасны бүтэц
   ────────────────────────────────────────────────────────────────────────────
   /trades/[id]/review → READ (Зөвхөн харах, mode="view")
   /trades/[id]/review/edit → EDIT (Засах, mode="edit")

3. Strategy Profile Name Display
   ────────────────────────────────────────────────────────────────────────────
   ❌ Өмнөх: strategy_profile_id: "550e8400-e29b-41d4-a716-446655440000"
   ✅ Шинэ: strategy_profile_id → "SMC Strategy"

4. ChecklistSection Progress Bar
   ────────────────────────────────────────────────────────────────────────────
   Шаардлагатай шалгуур: 4/4 ████████████ 100%
   ✅ Бүх шаардлагатай шалгуур хариулагдсан

5. RLS Policies Added
   ────────────────────────────────────────────────────────────────────────────
   ✅ trade_psychology
   ✅ trade_behavior
   ✅ post_trade_review
   ✅ trade_checklist_responses

6. Component Modes
   ────────────────────────────────────────────────────────────────────────────
   mode="view" → Зөвхөн харах (Хадгалах товч байхгүй)
   mode="create" → Шинээр үүсгэх
   mode="edit" → Засах (Хадгалах товч байна)

PHASE 7 — PSYCHOLOGY ANALYTICS 🔴 FUTURE
────────────────────────────────────────────────────────────────────────────────
Analysis Categories:

Setup → Result
────────────────────────────────────────────────────────────────────────────────
Setup fully met
↓
Win Rate | Average R | Profit Factor

Psychology → Result
────────────────────────────────────────────────────────────────────────────────
Anxiety | FOMO | Confidence
↓
Win Rate | Average R

Behavior → Result
────────────────────────────────────────────────────────────────────────────────
Moved SL | Early Exit | Plan Violation
↓
Average R | Win Rate

Core Question:
────────────────────────────────────────────────────────────────────────────────
"Би ямар нөхцөлд хамгийн сайн, ямар нөхцөлд хамгийн муу trade хийдэг вэ?"

PHASE 8 — INSIGHT / COACHING LAYER 🔴 FUTURE
────────────────────────────────────────────────────────────────────────────────
Example Insights:
────────────────────────────────────────────────────────────────────────────────
Problem Detection:
Сүүлийн 30 trade-ийн 9-д FOMO тэмдэглэгдсэн бөгөөд эдгээр trade-ийн
дундаж үр дүн -0.91R байна.

Setup Issue:
Setup-ийн шаардлагыг бүрэн хангаагүй trade-үүдийн average R -0.84R байна.

Execution Pattern:
Ашигтай trade-үүдийг төлөвлөсөн түвшинд хүрэхээс өмнө хаах хандлага байна.

Recommendation:
Дараагийн 10 trade дээр FOMO-той үед trade хийхгүй байх дүрмийг турш.

Logic Flow:
────────────────────────────────────────────────────────────────────────────────
Data → Pattern → Problem → Recommendation

DATABASE SUMMARY
────────────────────────────────────────────────────────────────────────────────
Table Purpose Status
────────────────────────────────────────────────────────────────────────────────
trade_checklist_items User-defined checklist items with groups 🟢
trade_checklist_responses Checklist responses per trade 🟢
trade_checklist_results Normalized results 🟢
trade_psychology Pre-trade psychology (13 fields) 🟢
trade_behavior Trade behavior (4 fields) 🟢
post_trade_review Post-trade review (5 fields) 🟢
strategy_profiles Strategy profiles per user 🟢

IMPLEMENTATION FLOW
────────────────────────────────────────────────────────────────────────────────
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
🆕 UI Enhancements ✅
├── Trade List Progress Bar
├── Strategy Name Display
├── Checklist Progress Bar
├── RLS Policies
└── Component Modes (view/create/edit)
↓
Phase 7 🔴 FUTURE
↓
Phase 8 🔴 FUTURE

FILES CREATED/MODIFIED
────────────────────────────────────────────────────────────────────────────────
Components:
────────────────────────────────────────────────────────────────────────────────
File Purpose
────────────────────────────────────────────────────────────────────────────────
src/components/trades/TradePsychology.tsx Pre-Trade Psychology UI
src/components/trades/TradeBehavior.tsx Trade Behavior UI
src/components/trades/PostTradeReview.tsx Post-Trade Review UI
src/components/trades/ChecklistSection.tsx Setup Validation + Strategy Selector
src/components/trades/TradeList.tsx Trade List with Psychology Status
src/app/trades/[id]/review/page.tsx READ - Unified Trade Review
src/app/trades/[id]/review/edit/page.tsx EDIT - Trade Review Edit
src/app/trades/page.tsx Trade List with Status Fetching

Types:
────────────────────────────────────────────────────────────────────────────────
File Purpose
────────────────────────────────────────────────────────────────────────────────
src/types/trade.ts All trade-related TypeScript types

Hooks:
────────────────────────────────────────────────────────────────────────────────
File Purpose
────────────────────────────────────────────────────────────────────────────────
src/lib/hooks/useTrades.ts Trade CRUD + PostTradeReview
src/lib/hooks/useUser.ts User authentication

Migrations (Supabase):
────────────────────────────────────────────────────────────────────────────────
File Purpose
────────────────────────────────────────────────────────────────────────────────
supabase/migrations/20260315_add_trade_behavior.sql Trade Behavior table
supabase/migrations/20260315_add_post_trade_review.sql Post-Trade Review table
supabase/migrations/\*\_trade_psychology.sql Pre-Trade Psychology table
supabase/migrations/20260320_add_strategy_profiles.sql Strategy Profiles

CURRENT STATUS: ✅ PHASES 1-6 COMPLETE + UI ENHANCEMENTS
────────────────────────────────────────────────────────────────────────────────
All core psychology features are implemented:

✅ Setup Validation (Dynamic Checklist with Groups)
✅ Strategy Profiles (Multiple strategies per user)
✅ Pre-Trade Psychology (13 structured fields)
✅ Trade Behavior (4 behavior categories)
✅ Post-Trade Review (Quality + Reflection)
✅ Unified Trade Review (All in one page with strategy selector)
✅ Edit/Review separation
✅ Light/Dark mode support
✅ Trade List Psychology Status (Progress Bar + Percentage)
✅ Strategy Name Display (Instead of ID)
✅ Checklist Progress Bar
✅ RLS Policies for all psychology tables
✅ Component Modes (view/create/edit)
✅ CRUD operations for all psychology sections

NEXT STEPS:
────────────────────────────────────────────────────────────────────────────────

1. Collect enough trade data
2. Implement Psychology Analytics (Phase 7)
3. Build Insight Layer (Phase 8)
