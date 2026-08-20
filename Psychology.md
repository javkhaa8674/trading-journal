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
├── Setup
├── Pre-Trade Psychology
├── Trade Behavior
└── Post-Trade Review
Database status

🟢 DONE

trade_checklist_items
trade_checklist_responses
trade_checklist_results

болон холбогдох SQL/relationship-ийн суурь ажил хийгдсэн.

PHASE 2 — Dynamic Setup Validation

Энэ хэсгийн database architecture мөн DONE.

Гол зарчим:

Strategy/Setup нь системд hardcode хийгдэхгүй. Хэрэглэгч өөрийн strategy болон checklist-ээ тодорхойлно.

Жишээ:

SMC Setup
├── HTF Bias
├── Liquidity Sweep
├── MSS
├── FVG
└── Entry Confirmation

өөр хэрэглэгч:

EMA Pullback
├── Trend
├── Pullback
├── RSI
└── Candle Confirmation
Trade Review дээр
Strategy: SMC Setup

✓ HTF Bias
✓ Liquidity Sweep
✓ MSS
✗ FVG
✓ Entry Confirmation

4 / 5
80%
Response status
Met
Partially Met
Not Met
Not Applicable
Database status

🟢 SQL / DB foundation DONE

Одоо үлдсэн

🔵 UI + application logic

PHASE 3 — Pre-Trade Psychology

Энд хэрэглэгчээс trade хийхээс өмнөх бодит төлөв-ийг авна.

Emotional State

Сэтгэл хөдлөлийн төлөв (Emotional State)

Тайван байдал (Calmness)
Түгшүүр (Anxiety)
Айдас (Fear)
Шунал (Greed)
Бухимдал (Frustration)
Өөртөө итгэх итгэл (Confidence)

1–5 scale.

Cognitive State

Танин мэдэхүйн төлөв (Cognitive State)

Анхаарал төвлөрөл (Focus)
Тэвчээр (Patience)
Шийдвэрийн тодорхой байдал (Decision Clarity)
Decision Pressure

Шийдвэрийн дарамт

Яарсан шийдвэр (Rushed Decision)
FOMO — Арилжааг алдахаас айх байдал (Fear of Missing Out)
Өмнөх trade-ийн нөлөө (Emotional Carryover)
Чухал

Бүгдийг заавал бөглүүлэхгүй.

Analytics-д үнэ цэнтэй, trade бүр дээр бодитоор хариулж болох асуултуудыг л үлдээнэ.

🔵 UI хийх шатанд

PHASE 4 — Trade Behavior

Энд:

“Сэтгэл санаа ямар байсан?”

гэхээс илүү:

“Тэр сэтгэл санаа миний үйлдэлд нөлөөлсөн үү?”

гэдгийг бүртгэнэ.

Plan Adherence

Төлөвлөгөөний мөрдөлт (Plan Adherence)

Бүрэн дагасан
Хэсэгчлэн дагасан
Зөрчсөн
Stop Loss

Stop Loss-ийн өөрчлөлт (Stop Loss Modification)

Өөрчлөөгүй
Төлөвлөгөөний дагуу
Эрсдэлийг нэмэгдүүлсэн
Сэтгэл хөдлөлөөс болсон
Take Profit

Take Profit-ийн өөрчлөлт (Take Profit Modification)

Өөрчлөөгүй
Шинэ мэдээлэлд үндэслэсэн
Айдсаас болсон
Шуналаас болсон
Early Exit

Эрт хаалт (Early Exit)

Үгүй
Төлөвлөгөөний дагуу
Айдсаас болсон
Тэвчээргүй байдлаас болсон

🔵 UI хийх шатанд

PHASE 5 — Post-Trade Review

Энэ хэсэгт trades table-д байгаа мэдээллийг дахин асуухгүй.

Автоматаар:

Entry
SL
TP
Exit
P&L
R
Win/Loss
Duration

харуулна.

Хэрэглэгчээс:

Execution Quality

Гүйцэтгэлийн чанар (Execution Quality)

1 — Маш муу
2 — Муу
3 — Дундаж
4 — Сайн
5 — Маш сайн

Would Take Again?

Ижил нөхцөлд дахин авах эсэх (Would You Take This Trade Again?)

Тийм
Тийм, өөрчлөлттэй
Үгүй
Reflection

Дүгнэлт / Сургамж (Reflection / Lesson)

Free-text хэсэг.

PHASE 6 — Psychology Analytics

Энэ хэсгийг trade review хангалттай хэмжээгээр хуримтлагдсаны дараа хийнэ.

Setup → Result
Setup fully met
→ Win Rate
→ Average R
→ Profit Factor
Psychology → Result
Anxiety
→ Win Rate
→ Average R

FOMO
→ Win Rate
→ Average R

Confidence
→ Win Rate
→ Average R
Behavior → Result
Moved SL
→ Average R

Early Exit
→ Average R

Plan Violation
→ Win Rate / Average R

Энд гол зорилго:

“Би ямар нөхцөлд хамгийн сайн, ямар нөхцөлд хамгийн муу trade хийдэг вэ?”

гэдгийг тоогоор харуулах.

🔴 Одоохондоо хийхгүй.

PHASE 7 — Insight / Coaching Layer

Analytics дээр хангалттай өгөгдөл бий болсны дараа.

Жишээ:

Таны гол асуудал: Сүүлийн 30 trade-ийн 9-д FOMO тэмдэглэгдсэн бөгөөд эдгээр trade-ийн дундаж үр дүн -0.91R байна.

Setup асуудал: Setup-ийн шаардлагыг бүрэн хангаагүй trade-үүдийн average R -0.84R байна.

Execution асуудал: Ашигтай trade-үүдийг төлөвлөсөн түвшинд хүрэхээс өмнө хаах хандлага байна.

Дараагийн анхаарах зүйл: Дараагийн 10 trade дээр FOMO-той үед trade хийхгүй байх дүрмийг турш.

Энэ хэсэг нь эцэстээ:

Data → Pattern → Problem → Recommendation

гэсэн логиктой байна.

🔴 Хамгийн сүүлд хийх.

Тэгэхээр одоогийн бодит status
PHASE 1
Trade-based architecture
🟢 DB foundation DONE

PHASE 2
Dynamic Setup / Checklist
🟢 DB / SQL DONE
🔵 UI + logic IN PROGRESS

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
Analytics
⚪ FUTURE

PHASE 7
AI / Insights
⚪ FUTURE
Харин яг одоо хийх implementation дараалал

1. Existing checklist tables
   ↓
2. Trade дээр checklist UI гаргах
   ↓
3. Response хадгалах
   ↓
4. Checklist result тооцох
   ↓
5. Pre-Trade Psychology UI
   ↓
6. Trade Behavior UI
   ↓
7. Post-Trade Review UI
   ↓
8. Бүх review-г нэг Trade Review болгон нэгтгэх
   ↓
9. Test
   ↓
10. Analytics
    ↓
11. Insights

# Trading Journal — Session Summary

## Session date

2026-08-20

---

# 1. Гол зорилго

Trade хэсгийн **Edit** үйлдэл болон **Trade Review** үйлдлийг тусгаарлах.

Шийдсэн UX:

- `Edit` → зөвхөн Trade-ийн үндсэн мэдээллийг засна.
- `Review` → тухайн Trade-ийн:
  - Trade Checklist
  - Trade Psychology
    мэдээллийг оруулж/засна.

Trade Edit page-ийг Checklist + Psychology-оор дүүргэхгүй.

---

# 2. Гол navigation

## Trades page

Файл:

`src/app/trades/page.tsx`

Trade table дээр тусдаа Review button байна.

Үйлдлүүд:

```text
[Chart] [Review] [Edit] [Delete]
```
