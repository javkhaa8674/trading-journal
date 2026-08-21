Psychology System — Final Roadmap
Үндсэн зорилго

Өдрийн тэмдэглэлээс Trade-based Psychology Review систем рүү шилжинэ.

OLD
Day

├── Mood
├── Today's trades
├── Today's mistakes
└── Today's notes
NEW
Trade

├── Setup Validation
├── Pre-Trade Psychology
├── Trade Behavior
└── Post-Trade Review

Day нь үндсэн journal entity биш болно. Харин дараа нь trade-үүдийг нэгтгэн харах aggregation/context болно.

PHASE 1 — Trade-based Psychology
Зорилго

Өмнөх day-based Psychology-г trade-based болгох.

Үр дүн

Нэг trade өөрийн гэсэн Psychology Review-тэй байна.

Trade #123

├── Setup Validation
├── Pre-Trade Psychology
├── Trade Behavior
└── Post-Trade Review
Database

🟢 DONE

Database foundation:

trade_checklist_items
trade_checklist_responses
trade_checklist_results

Мөн холбогдох SQL / relationship-ийн суурь ажил хийгдсэн.

PHASE 2 — Dynamic Setup Validation
Гол architecture

Strategy-г тусдаа database entity болгохгүй.

Одоогийн системд хэрэглэгчийн strategy:

trading_plans

├── strategy
├── risk_management
└── key_processes

гэсэн Trading Plan-ийн rich-text documentation хэлбэрээр хадгалагдана.

trading_plans.strategy нь хэрэглэгч өөрийн арилжааны аргачлал, дүрмээ унших болон засах зориулалттай.

Энэ текстээс runtime үед checklist автоматаар үүсгэхгүй.

Trading Plan ба Setup Checklist
Trading Plan

Хэрэглэгчийн өөрийн дүрэм, аргачлалын documentation:

Trading Plan

Strategy

├── Market Structure & Trend
├── POI
├── Entry Setup
└── SL & TP

Risk Management

└── ...

Key Processes

└── ...
Setup Checklist

Trade Review дээр analytics хийхэд зориулсан structured data:

Setup Validation

├── HTF Bias
├── Valid POI
├── Liquidity
├── M5 CHoCH / MSS
├── Entry Confirmation
└── Risk / R:R

Тиймээс:

Trading Plan
│
│ reference / documentation
↓
Trade Review

Trade
│
↓
Trade Checklist
│
├── Checklist Items
├── Responses
└── Result

Trade нь trading_plans.strategy-тэй FK relationship хийх шаардлагагүй.

Checklist-ийн үндсэн зарчим

Checklist нь системд нэг удаагийн hardcoded UI хэлбэрээр байхгүй.

Хэрэглэгч өөрийн Setup Validation checklist-ээ тодорхойлно.

Жишээ:

SMC-style Setup Checklist

├── HTF Bias
├── Liquidity Sweep
├── MSS
├── FVG
└── Entry Confirmation

Өөр хэрэглэгч:

EMA Pullback Checklist

├── Trend
├── Pullback
├── RSI
└── Candle Confirmation

SMC Setup, EMA Pullback нь заавал strategies table-ийн entity байх албагүй.

Checklist configuration нь өөрөө тухайн хэрэглэгчийн setup validation criteria-г тодорхойлно.

Phase 2 — Response Architecture

Өмнө нь:

value
rating
text_value

байсан.

Одоо trade_checklist_responses дээр:

response_status

нэмэгдсэн.

Response Status
Met
Partially Met
Not Met
Not Applicable

Мөн:

response_status = null

нь Unanswered гэсэн төлөвийг илэрхийлнэ.

Ингэснээр:

Not Applicable

болон

Unanswered

хоёрыг зөв ялгах боломжтой болсон.

Database
trade_checklist_responses
├── id
├── user_id
├── trade_id
├── checklist_item_id
├── value
├── rating
├── text_value
├── response_status
├── created_at
└── updated_at

response_status:

met
partially_met
not_met
not_applicable
Setup Validation Result Calculation

Application logic дээр:

Met = 1
Partially Met = 0.5
Not Met = 0
Not Applicable = denominator-д орохгүй
Unanswered = incomplete

Жишээ:

HTF Bias Met 1
Liquidity Met 1
MSS Partially Met 0.5
FVG Not Met 0
Entry N/A -

Үр дүн:

2.5 / 4
62.5%

Trade Review дээр:

Setup Validation

Met 3
Partially Met 1
Not Met 1
N/A 1

Score
4.5 / 5

90%

гэх мэтээр харуулах боломжтой.

Phase 2 — UI + Application Logic

🟢 DONE

Хийгдсэн:

Existing Checklist Configuration
↓
Trade Review
↓
Checklist UI
↓
Response хадгалах
↓
Result calculation
Checklist UI

Boolean checklist:

[Met]
[Partially Met]
[Not Met]
[N/A]

Rating:

1 / 5
2 / 5
3 / 5
4 / 5
5 / 5

Text:

Write your answer...
Response Save

trade_checklist_responses рүү:

value
rating
text_value
response_status

зөв төрлөөр хадгална.

Result Save

trade_checklist_results:

├── trade_id
├── checklist_item_id
├── value_boolean
├── value_number
└── value_text

normalized result/value мэдээллээ хадгалсан хэвээр байна.

Phase 2 — Одоогийн бодит Status

🟢 DB / SQL — DONE
🟢 Trade Review Page — DONE
🟢 Checklist UI — DONE
🟢 Response Save — DONE
🟢 Existing Response Load — DONE
🟢 Result Calculation — DONE
🟢 Met / Partially Met / Not Met / N/A — DONE
🟢 Required Item Validation — DONE
🟢 Build / TypeScript errors — FIXED

Phase 2

🟢 DONE

Build / TypeScript Cleanup

Checklist өөрчлөлтийн дараа илэрсэн TypeScript асуудлууд засагдсан.

src/lib/equity.ts

close_time:

string | null

байхад toTimestamp() руу шууд дамжуулснаас үүссэн type error засагдсан.

validTrades дээр:

close_time !== null

гэсэн type narrowing зөв хийгдсэн.

src/lib/hooks/useTrades.ts

Supabase timestamp-ууд frontend дээр string хэлбэртэй байхад ашигласан:

instanceof Date

хэсгүүд арилсан.

Database-аас ирж буй timestamp-ийг шууд ашигладаг болсон.

Жишээ:

open_time: trade.open_time

Update үед:

if (updates.open_time !== undefined) {
formattedUpdates.open_time = updates.open_time;
}
Build

🟢 npm run build — амжилттай

PHASE 3 — Trade Psychology Foundation
Одоогийн implementation

Энэ phase-ийн суурь Trade Psychology component аль хэдийн хийгдсэн.

Trade Review page:

src/app/.../trade/[id]/page.tsx

дотор:

<TradePsychology tradeId={tradeId} />

холбогдсон.

Trade Psychology Database
trade_psychology

Одоогийн schema:

trade_psychology

├── id
├── trade_id
├── user_id
├── mood
├── confidence_level
├── anxiety_level
├── trading_urge_level
├── plan_followed
├── emotional_interference
├── execution_quality
├── mistakes
├── lesson_learned
├── notes
├── created_at
└── updated_at

Constraints:

trade_id UNIQUE
trade_id → trades(id)
user_id → auth.users(id)

Мөн trade устахад psychology автоматаар устах:

ON DELETE CASCADE
Psychology Level Constraints

Database дээр:

confidence_level 1–10
anxiety_level 1–10
trading_urge_level 1–10
execution_quality 1–10

гэсэн range constraint байна.

NULL зөвшөөрөгдөнө.

TradePsychology UI

🟢 IMPLEMENTED

Одоогоор Trade Review дээр дараах мэдээллийг оруулах боломжтой.

Mood
Mood

Free-text хэлбэрээр.

Psychology Levels
Confidence
Anxiety
Trading Urge

Одоогийн UI:

Select
1 / 5
2 / 5
3 / 5
4 / 5
5 / 5

Architecture note: Database одоо 1–10 range дэмждэг боловч UI одоогоор 1–5 сонголттой байна. Дараагийн implementation дээр Phase 3-ийн эцсийн scale-тэй нийцүүлж шийднэ.

Boolean
Plan followed?
Yes / No / Clear

Emotional interference?
Yes / No / Clear
Execution Quality
1
2
3
4
5
Mistakes

Dynamic tag хэлбэрээр:

Mistake нэмэх...

[Revenge trading ×]
[FOMO ×]
[Early entry ×]

Давхардсан mistake нэмэхээс хамгаалсан.

Lesson Learned

Free-text textarea.

Notes

Free-text textarea.

Trade Psychology Save / Load

🟢 DONE

Component:

TradePsychology

дараах ажиллагаатай болсон.

Existing psychology load
trade_id

- user_id
  ↓
  trade_psychology
  ↓
  maybeSingle()
  ↓
  form populate
  Existing record байгаа бол
  UPDATE
  Байхгүй бол
  INSERT

дараа нь үүссэн:

id

form state-д хадгалагдана.

Security filtering

Save / Update үед:

trade_id
user_id

хоёуланг нь ашиглаж байна.

PHASE 3 — Pre-Trade Psychology

🟡 FOUNDATION IMPLEMENTED / NEEDS REFINEMENT

Энд хэрэглэгчээс trade хийхээс өмнөх бодит төлөвийг авна.

Roadmap-ийн зорилтот architecture:

Emotional State
Calmness
Anxiety
Fear
Greed
Frustration
Confidence

1–5 scale.

Cognitive State
Focus
Patience
Decision Clarity
Decision Pressure
Rushed Decision
FOMO
Emotional Carryover

Чухал зарчим:

Бүгдийг заавал бөглүүлэхгүй.

Trade бүр дээр бодитоор хариулж болох, analytics-д үнэ цэнтэй асуултуудыг л үлдээнэ.

Одоогийн зөрүү

Одоогийн trade_psychology schema болон component нь:

mood
confidence
anxiety
trading urge
plan followed
emotional interference
execution quality
mistakes
lesson
notes

гэсэн анхны psychology foundation-ийг хэрэгжүүлсэн.

Харин roadmap-ийн бүрэн Phase 3-д:

Focus
Patience
Decision Clarity
Decision Pressure
Rushed Decision
FOMO
Emotional Carryover
Fear
Greed
Frustration

зэрэг pre-trade variables-ийг тусад нь structured data болгох эсэхийг эцэслэх шаардлагатай.

Иймээс Phase 3-ийг одоогоор:

🟡 IN PROGRESS / FOUNDATION DONE

гэж үзнэ.

PHASE 4 — Trade Behavior

🔵 NEXT AFTER PHASE 3

Энд:

“Сэтгэл санаа ямар байсан?”

гэхээс илүү:

“Тэр сэтгэл санаа миний үйлдэлд нөлөөлсөн үү?”

гэдгийг бүртгэнэ.

Plan Adherence
Бүрэн дагасан
Хэсэгчлэн дагасан
Зөрчсөн
Stop Loss Modification
Өөрчлөөгүй
Төлөвлөгөөний дагуу
Эрсдэлийг нэмэгдүүлсэн
Сэтгэл хөдлөлөөс болсон
Take Profit Modification
Өөрчлөөгүй
Шинэ мэдээлэлд үндэслэсэн
Айдсаас болсон
Шуналаас болсон
Early Exit
Үгүй
Төлөвлөгөөний дагуу
Айдсаас болсон
Тэвчээргүй байдлаас болсон

⚪ NOT IMPLEMENTED

PHASE 5 — Post-Trade Review

🔵 NOT IMPLEMENTED

Trades table-д байгаа мэдээллийг дахин асуухгүй.

Автоматаар харуулах
Entry
SL
TP
Exit
P&L
R
Win/Loss
Duration
Хэрэглэгчээс авах
Execution Quality
1 — Маш муу
2 — Муу
3 — Дундаж
4 — Сайн
5 — Маш сайн
Would Take Again?
Тийм
Тийм, өөрчлөлттэй
Үгүй
Reflection / Lesson

Free-text.

⚪ NOT IMPLEMENTED

PHASE 6 — Unified Trade Review
Эцсийн UX
Trade #123 — Review

┌──────────────────────────────┐
│ Trade Information │
│ Entry / SL / TP / P&L / R │
└──────────────────────────────┘

┌──────────────────────────────┐
│ Setup Validation │
│ │
│ ✓ HTF Bias │
│ ✓ Liquidity Sweep │
│ ✓ MSS │
│ ✗ FVG │
│ ✓ Entry Confirmation │
│ │
│ 4 / 5 — 80% │
└──────────────────────────────┘

┌──────────────────────────────┐
│ Pre-Trade Psychology │
│ │
│ Anxiety 2 / 5 │
│ Confidence 4 / 5 │
│ Focus 4 / 5 │
│ FOMO No │
└──────────────────────────────┘

┌──────────────────────────────┐
│ Trade Behavior │
│ │
│ Plan Adherence: Full │
│ SL Modification: None │
│ TP Modification: None │
│ Early Exit: No │
└──────────────────────────────┘

┌──────────────────────────────┐
│ Post-Trade Review │
│ │
│ Execution Quality: 4 / 5 │
│ Would Take Again: Yes │
│ Reflection: ... │
└──────────────────────────────┘

Одоогийн:

🟡 PARTIALLY READY

Бэлэн:

Trade Information
Setup Validation
Trade Psychology foundation

Үлдсэн:

Pre-Trade Psychology refinement
Trade Behavior
Post-Trade Review
PHASE 7 — Psychology Analytics

🔴 FUTURE

Trade Review хангалттай хэмжээгээр хуримтлагдсаны дараа.

Setup → Result
Setup fully met
↓
Win Rate
Average R
Profit Factor
Psychology → Result
Anxiety
↓
Win Rate
Average R
FOMO
↓
Win Rate
Average R
Confidence
↓
Win Rate
Average R
Behavior → Result
Moved SL
↓
Average R
Early Exit
↓
Average R
Plan Violation
↓
Win Rate
Average R

Гол зорилго:

“Би ямар нөхцөлд хамгийн сайн, ямар нөхцөлд хамгийн муу trade хийдэг вэ?”

гэдгийг тоогоор харуулах.

PHASE 8 — Insight / Coaching Layer

🔴 FUTURE

Analytics дээр хангалттай өгөгдөл бий болсны дараа.

Жишээ:

Таны гол асуудал:

Сүүлийн 30 trade-ийн 9-д FOMO тэмдэглэгдсэн
бөгөөд эдгээр trade-ийн дундаж үр дүн -0.91R байна.

Setup:

Setup-ийн шаардлагыг бүрэн хангаагүй
trade-үүдийн average R -0.84R байна.

Execution:

Ашигтай trade-үүдийг төлөвлөсөн түвшинд
хүрэхээс өмнө хаах хандлага байна.

Дараагийн анхаарах зүйл:

Дараагийн 10 trade дээр FOMO-той үед
trade хийхгүй байх дүрмийг турш.
Эцсийн логик
Data
↓
Pattern
↓
Problem
↓
Recommendation
Одоогийн бодит Status
Phase Status
Phase 1 — Trade-based architecture 🟢 DONE
Phase 2 — Dynamic Setup / Checklist 🟢 DONE
Phase 3 — Pre-Trade Psychology 🟡 FOUNDATION DONE / REFINEMENT NEEDED
Phase 4 — Trade Behavior ⚪ NOT IMPLEMENTED
Phase 5 — Post-Trade Review ⚪ NOT IMPLEMENTED
Phase 6 — Unified Trade Review 🟡 PARTIALLY READY
Phase 7 — Psychology Analytics 🔴 FUTURE
Phase 8 — AI / Insights 🔴 FUTURE
Одоогийн Implementation дараалал

Phase 2 аль хэдийн дууссан.

1. Existing Checklist Configuration
   ↓
2. Trade Review Page
   ↓
3. Checklist UI
   ↓
4. Checklist Response Save / Load
   ↓
5. Checklist Result Calculation
   ↓
   PHASE 2 COMPLETE
   ↓
6. Trade Psychology Foundation
   ↓
7. Pre-Trade Psychology refinement
   ↓
8. Trade Behavior
   ↓
9. Post-Trade Review
   ↓
10. Unified Trade Review
    ↓
11. Full Review Testing
    ↓
12. Psychology Analytics
    ↓
13. Insights
    Trading Plan-ийн үүрэг

Одоогийн trading_plans architecture-г өөрчлөхгүй.

trading_plans

├── strategy
├── risk_management
└── key_processes

Энэ нь хэрэглэгчийн өөрийн Trading Plan / reference documentation хэвээр байна.

Trade Review дээр шаардлагатай үед:

📋 Trading Plan
↓
Strategy
Risk Management
Key Processes

гэж reference болгон харуулж болно.

Гэхдээ:

Trade
✕
Trading Plan Strategy

гэсэн тусдаа FK relationship үүсгэхгүй.

Харин:

Trade
↓
Trade Checklist
↓
Checklist Responses
↓
Checklist Result

болон:

Trade
↓
Trade Psychology

гэсэн structured review relationship ашиглана.

Trading Journal — Session Summary
Гол зорилго

Trade-ийн үндсэн мэдээллийг засах Edit болон Trade-ийн сэтгэлзүйн/чанарын мэдээллийг засах Review үйлдлийг тусгаарласан.

Edit

Зөвхөн:

Entry
SL
TP
Lot
Open Time
Close Time
Account
Symbol
Direction
...

зэрэг trade-ийн үндсэн мэдээлэл.

Review

Тухайн trade-ийн:

Setup Validation
Pre-Trade Psychology
Trade Behavior
Post-Trade Review

мэдээлэл.

Trade Navigation

src/app/trades/page.tsx

Trade table дээр:

[Chart] [Review] [Edit] [Delete]
Chart

Тухайн trade-ийн chart / price action.

Review

Тухайн trade-ийн бүх review:

Setup Validation
Pre-Trade Psychology
Trade Behavior
Post-Trade Review
Edit

Зөвхөн trade-ийн үндсэн мэдээлэл.

Delete

Trade устгана.

Энэ session-ийн нэмэлт өөрчлөлт
Trade Psychology component

Trade Review page-д:

<TradePsychology tradeId={tradeId} />

холбогдсон.

TradePsychology component нь одоо:

🟢 Existing Psychology Load
🟢 Form State
🟢 Mood
🟢 Confidence
🟢 Anxiety
🟢 Trading Urge
🟢 Plan Followed
🟢 Emotional Interference
🟢 Execution Quality
🟢 Mistakes
🟢 Lesson Learned
🟢 Notes
🟢 Insert
🟢 Update
🟢 Save state
🟢 Error handling
🟢 User filtering

зэрэг foundation-ийг хэрэгжүүлсэн.

Database

trade_psychology table:

trade_id UNIQUE

тул:

1 Trade → 1 Psychology Review

гэсэн relationship тогтсон.

Яг одоо хийх ажил
PHASE 3 — Pre-Trade Psychology

Одоогийн дараагийн бодит ажил:

Current TradePsychology
↓
Pre-Trade Psychology architecture
↓
Structured fields-ийг эцэслэх
↓
UI-г roadmap-той нийцүүлэх
↓
DB schema update шаардлагатай эсэхийг шийдэх
↓
Save / Load
↓
Validation
↓
Build test

Үүний дараа:

PHASE 4
Trade Behavior
↓
PHASE 5
Post-Trade Review
↓
PHASE 6
Unified Trade Review

гэж үргэлжилнэ.

Одоогийн хамгийн чухал архитектурын шийдвэр

Trade Psychology-ийн foundation аль хэдийн хийгдсэн тул Phase 3-ийг шинээр эхнээс нь хийхгүй.

Одоо байгаа:

trade_psychology

- TradePsychology.tsx
- TradeReviewPage

дээр тулгуурлан roadmap-ийн Pre-Trade Psychology шаардлагад нийцүүлж өргөтгөнө.

Одоогийн дараагийн implementation: PHASE 3 — Pre-Trade Psychology.
