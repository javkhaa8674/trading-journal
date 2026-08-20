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

PHASE 1 — Trade-based Psychology руу шилжих
Зорилго

Өмнөх day-based Psychology-г trade-based болгох.

Үр дүн

Нэг trade өөрийн гэсэн Psychology Review-тэй байна.

Trade #123

├── Setup Validation
├── Pre-Trade Psychology
├── Trade Behavior
└── Post-Trade Review
Database status

🟢 DONE

Database foundation:

trade_checklist_items
trade_checklist_responses
trade_checklist_results

мөн холбогдох SQL / relationship-ийн суурь ажил хийгдсэн.

PHASE 2 — Dynamic Setup Validation
Гол architecture

Энд Strategy-г тусдаа database entity болгохгүй.

Одоогийн системд хэрэглэгчийн strategy нь:

trading_plans

├── strategy
├── risk_management
└── key_processes

гэсэн Trading Plan-ийн rich-text documentation хэлбэрээр хадгалагдана.

trading_plans.strategy нь хэрэглэгч өөрийн арилжааны аргачлал, дүрмээ унших болон засах зориулалттай.

Энэ текстээс runtime үед checklist автоматаар үүсгэхгүй.

Trading Plan ба Setup Checklist-ийн үүрэг
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

өөр хэрэглэгч:

EMA Pullback Checklist

├── Trend
├── Pullback
├── RSI
└── Candle Confirmation

Энд SMC Setup, EMA Pullback нь заавал strategies table-ийн entity байх албагүй.

Checklist configuration нь өөрөө тухайн хэрэглэгчийн setup validation criteria-г тодорхойлно.

Phase 2 — Response Architecture

Энэ session дээр checklist response architecture-г өргөтгөсөн.

Өмнө нь:

value
rating
text_value

байсан.

Одоо trade_checklist_responses дээр:

response_status

нэмэгдсэн.

Response status
Met
Partially Met
Not Met
Not Applicable

Мөн:

response_status = null

нь Unanswered гэсэн төлөвийг илэрхийлнэ.

Ингэснээр Not Applicable болон Unanswered хоёрыг хооронд нь зөв ялгах боломжтой болсон.

Database
trade_checklist_responses

├── id
├── user_id
├── trade_id
├── checklist_item_id
├── value
├── rating
├── text_value
├── response_status ← NEW
├── created_at
└── updated_at

response_status-ийн зөвшөөрөгдөх утгууд:

met
partially_met
not_met
not_applicable
Setup Validation Result Calculation

Checklist result calculation одоо UI/application logic дээр ажилладаг болсон.

Score
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

Тэгвэл:

2.5 / 4
62.5%
Result UI

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

Not Applicable нь score-ийн denominator-оос хасагдана.

Phase 2 — UI + Application Logic
🟢 DONE

Одоогоор дараах бүх хэсэг хийгдсэн:

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

Boolean checklist дээр:

[Met]
[Partially Met]
[Not Met]
[N/A]

сонголтуудтай болсон.

Rating:

1 / 5
2 / 5
3 / 5
4 / 5
5 / 5

Text:

Write your answer...
Response хадгалалт

trade_checklist_responses рүү:

value
rating
text_value
response_status

зөв төрлөөр хадгална.

Result хадгалалт

trade_checklist_results нь normalized result/value мэдээллээ хадгалсан хэвээр байна.

trade_checklist_results

├── trade_id
├── checklist_item_id
├── value_boolean
├── value_number
└── value_text
PHASE 2 — Одоогийн бодит status

🟢 DB / SQL — DONE

🟢 Trade Review Page — DONE

🟢 Checklist UI — DONE

🟢 Response Save — DONE

🟢 Existing Response Load — DONE

🟢 Result Calculation — DONE

🟢 Met / Partially Met / Not Met / N/A — DONE

🟢 Required Item Validation — DONE

🟢 Build / TypeScript errors — FIXED

Тиймээс Phase 2 одоо:

🟢 DONE

гэж үзэж болно.

Build / TypeScript Cleanup

Энэ session-ийн явцад Checklist өөрчлөлт оруулсны дараа npm run build хийхэд илэрсэн TypeScript асуудлуудыг мөн зассан.

src/lib/equity.ts

close_time нь:

string | null

байхад toTimestamp() руу шууд дамжуулснаас үүссэн type error засагдсан.

validTrades дээр close_time !== null гэдгийг TypeScript-д зөв type narrowing хийсэн.

src/lib/hooks/useTrades.ts

Supabase timestamp-ууд frontend дээр string хэлбэртэй байхад:

instanceof Date

ашигласан хэсгүүд байсан.

Үүнийг арилгаж timestamp-ийг database-аас ирж байгаа хэлбэрээр нь ашиглахаар зассан.

Жишээ:

open_time: trade.open_time

мөн update үед:

if (updates.open_time !== undefined) {
formattedUpdates.open_time = updates.open_time;
}

гэх мэтээр зассан.

Build status

🟢 npm run build — амжилттай

PHASE 3 — Pre-Trade Psychology

🔵 NEXT

Энд хэрэглэгчээс trade хийхээс өмнөх бодит төлөвийг авна.

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
Чухал

Бүгдийг заавал бөглүүлэхгүй.

Analytics-д үнэ цэнтэй, trade бүр дээр бодитоор хариулж болох асуултуудыг л үлдээнэ.

⚪ NOT IMPLEMENTED

PHASE 4 — Trade Behavior

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

Энэ хэсэгт trades table-д байгаа мэдээллийг дахин асуухгүй.

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

Free-text хэсэг.

⚪ NOT IMPLEMENTED

PHASE 6 — Бүх Review-г нэг Trade Review болгон нэгтгэх

Эцсийн UX:

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

Ингэснээр Trade Review нь нэг бүхэл систем болно.

🟡 PARTIALLY READY

Trade Review page болон Setup Validation бэлэн.

Pre-Trade Psychology, Trade Behavior, Post-Trade Review нэмэгдсэний дараа бүрэн дуусна.

PHASE 7 — Psychology Analytics

Энэ хэсгийг trade review хангалттай хэмжээгээр хуримтлагдсаны дараа хийнэ.

🔴 FUTURE

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

Analytics дээр хангалттай өгөгдөл бий болсны дараа.

🔴 FUTURE

Жишээ:

Таны гол асуудал:

Сүүлийн 30 trade-ийн 9-д FOMO тэмдэглэгдсэн

бөгөөд эдгээр trade-ийн дундаж үр дүн -0.91R байна.
Setup асуудал:

Setup-ийн шаардлагыг бүрэн хангаагүй trade-үүдийн
average R -0.84R байна.
Execution асуудал:

Ашигтай trade-үүдийг төлөвлөсөн түвшинд хүрэхээс
өмнө хаах хандлага байна.
Дараагийн анхаарах зүйл:

Дараагийн 10 trade дээр FOMO-той үед trade хийхгүй
байх дүрмийг турш.

Эцсийн логик:

Data
↓
Pattern
↓
Problem
↓
Recommendation
Одоогийн бодит Status
PHASE 1

Trade-based architecture

🟢 DONE

PHASE 2

Dynamic Setup / Checklist

🟢 DONE

DB / SQL
UI
Response Save
Response Load
Result Calculation
Required Validation
Met
Partially Met
Not Met
Not Applicable
Build
PHASE 3

Pre-Trade Psychology

⚪ NOT IMPLEMENTED

PHASE 4

Trade Behavior

⚪ NOT IMPLEMENTED

PHASE 5

Post-Trade Review

⚪ NOT IMPLEMENTED

PHASE 6

Unified Trade Review

🟡 PARTIALLY READY

Setup Validation хэсэг бэлэн. Үлдсэн Psychology / Behavior / Post-Trade хэсгүүдийг нэмнэ.

PHASE 7

Psychology Analytics

🔴 FUTURE

PHASE 8

AI / Insights

🔴 FUTURE

Яг одоо хийх Implementation дараалал

Phase 2 аль хэдийн дууссан тул хуучин дарааллыг өөрчилнө.

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
6. Pre-Trade Psychology
   ↓
7. Trade Behavior
   ↓
8. Post-Trade Review
   ↓
9. Unified Trade Review
   ↓
10. Full Review Testing
    ↓
11. Psychology Analytics
    ↓
12. Insights

Одоогийн яг дараагийн ажил:

PHASE 3
Pre-Trade Psychology
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
Strategy / Risk Management / Key Processes

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

гэсэн structured review relationship ашиглана.

Trading Journal — Session Summary
Session date

2026-08-20

1. Гол зорилго

Trade хэсгийн Edit үйлдэл болон Trade Review үйлдлийг тусгаарлах.

Edit

Зөвхөн Trade-ийн үндсэн мэдээллийг засна.

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
Review

Тухайн Trade-ийн:

Trade Checklist
Trade Psychology

мэдээллийг оруулж / засна.

Trade Edit page-ийг Checklist + Psychology-оор дүүргэхгүй.

2. Гол Navigation
   Trades page

Файл:

src/app/trades/page.tsx

Trade table дээр тусдаа Review button байна.

Үйлдлүүд:

[Chart] [Review] [Edit] [Delete]
Chart

Тухайн trade-ийн chart / price action-ийг харах.

Review

Тухайн trade-ийн:

Setup Validation
Pre-Trade Psychology
Trade Behavior
Post-Trade Review

бүх review мэдээлэл рүү орно.

Edit

Зөвхөн trade-ийн үндсэн мэдээллийг засна.

Delete

Trade устгана.

3. Энэ session дээр хийж дуусгасан зүйлс
   Trade Review

🟢 Trade Review page аль хэдийн хийгдсэн байсан.

Setup Checklist

🟢 Existing checklist items Trade Review дээр харагдана.

Response

🟢 Checklist response load/save ажиллана.

Response Status

🟢 trade_checklist_responses дээр:

response_status

нэмсэн.

Зөвшөөрөгдөх утга:

met
partially_met
not_met
not_applicable
Result Calculation

🟢 Setup Validation result одоо application logic дээр тооцогдоно.

Met = 1
Partially Met = 0.5
Not Met = 0
N/A = excluded
Required Validation

🟢 Required checklist item бөглөгдөөгүй бол Save хийх боломжгүй.

Build

🟢 Checklist өөрчлөлтийн дараа илэрсэн TypeScript build errors-ийг зассан.

Засагдсан:

src/lib/equity.ts
src/lib/hooks/useTrades.ts

npm run build амжилттай болсон.

4. Архитектурын үндсэн шийдвэр

Тусдаа strategies entity үүсгэхгүй.

Одоогийн:

trading_plans.strategy

нь хэрэглэгчийн strategy documentation хэвээр байна.

Dynamic Setup Validation нь:

Checklist Configuration
↓
Trade
↓
Trade Checklist Responses
↓
Trade Checklist Result

архитектуртай байна.

5. Одоогийн дараагийн алхам

Phase 2 дууссан.

Одоо:

PHASE 3
Pre-Trade Psychology

руу шилжинэ.

Дараа нь:

Pre-Trade Psychology
↓
Trade Behavior
↓
Post-Trade Review
↓
Unified Trade Review
↓
Testing
↓
Psychology Analytics
↓
Insights

гэсэн дарааллаар явна.
