# 📊 Trading Journal App – Full Architecture (Supabase + PostgreSQL)

## 🎯 Төслийн зорилго

Trading journal + analytics dashboard хийх:

* Trade data хадгалах
* Winrate / RRR / Drawdown тооцох
* Chart + Table харуулах
* Advanced filtering (account / broker / mode)
* Multi-user system

---

# 🧠 1. Core ойлголт

## System төрөл:

* ❌ Simple CRUD app биш
* ✅ **Trading analytics platform**

## Architecture:

```
Frontend (Next.js)
    ↓
Supabase (PostgreSQL + Auth + API + RLS)
```

👉 Node.js server эхний үед **шаардлагагүй**

---

# 🗄️ 2. Database Schema

## 🔵 users

* Supabase auth.users (built-in)

---

## 🟡 brokers (optional)

```
- id
- name
```

---

## 🟢 accounts

```
- id
- user_id
- broker_id (эсвэл broker string)
- name (FTMO, Personal гэх мэт)
- mode (backtest / demo / real) 🔥
- balance
- created_at
```

---

## 🟣 trades

```
- id
- user_id
- account_id 🔥
- symbol
- type (buy/sell)
- entry_price
- exit_price
- stop_loss
- take_profit
- lot_size
- profit
- open_time
- close_time
```

---

## ⚪ optional tables

### trade_notes

```
- id
- trade_id
- note
- emotion
```

---

# 🔗 3. Relationship

```
User
 └── Accounts (1 → many)
       └── Trades (1 → many)
```

---

# 🔐 4. Security (Row Level Security)

```
CREATE POLICY "Users can view own trades"
ON trades
FOR SELECT
USING (auth.uid() = user_id);
```

👉 User бүр зөвхөн өөрийн data-г харна

---

# 🎛️ 5. Filtering System

## 🎯 Filter төрлүүд:

### 1. Account

* account_id

### 2. Broker

* accounts → broker join

### 3. Mode

* backtest / demo / real

### 4. All

* filter байхгүй

---

## 🧠 Query logic

### Account filter

```js
.eq('account_id', id)
```

### Broker filter

```js
.eq('accounts.broker', broker)
```

### Mode filter

```js
.eq('accounts.mode', 'real')
```

### Date filter

```js
.gte('close_time', from)
.lte('close_time', to)
```

---

# 📊 6. Dashboard Metrics

## Winrate

```sql
COUNT(*) FILTER (WHERE profit > 0) * 100.0 / COUNT(*)
```

---

## Profit Factor

```sql
SUM(CASE WHEN profit > 0 THEN profit ELSE 0 END) /
ABS(SUM(CASE WHEN profit < 0 THEN profit ELSE 0 END))
```

---

## Average Win / Loss

```sql
AVG(profit) WHERE profit > 0
AVG(profit) WHERE profit < 0
```

---

## Equity Curve

```sql
SELECT 
  close_time,
  SUM(profit) OVER (ORDER BY close_time)
FROM trades;
```

---

# 📈 7. Charts

* Equity curve
* PnL distribution
* Trade duration
* Instrument analysis

---

# 📅 8. Calendar

* Daily PnL
* Weekly summary

---

# 📋 9. Trading Table

```
symbol | type | entry | exit | SL | TP | profit | date
```

---

# 🎛️ 10. UI Filter Design

```
[ All ] [ Broker ▼ ] [ Account ▼ ] [ Mode ▼ ]
```

эсвэл

```
Mode: [All | Real | Demo | Backtest]
Broker: [Dropdown]
Account: [Dropdown]
Date: [Range]
```

---

# 🔥 11. Advanced Features

## ✅ Multi-filter

* Account + Date
* Broker + Symbol
* Mode + Profit/Loss

---

## 📊 Compare Mode

```
Real vs Demo vs Backtest
```

👉 Нэг chart дээр 3 шугам

---

## 🧠 Behavioral Analysis

* Tags
* Notes
* Emotion tracking

---

# ⚡ 12. Performance

## Index

```sql
CREATE INDEX ON trades(account_id);
CREATE INDEX ON accounts(broker_id);
CREATE INDEX ON accounts(mode);
```

---

# 🚀 13. Development Phases

## 🟢 Phase 1 (MVP)

* Trade add
* Trade list
* Basic winrate

---

## 🟡 Phase 2

* Equity chart
* Profit factor
* Avg win/loss

---

## 🔵 Phase 3

* Calendar
* Behavioral analytics
* Advanced filters

---

# 🎯 14. Гол шийдлүүд

## Multi-user

✔ user_id

## Multi-account

✔ account_id

## Mode system

✔ accounts.mode

## Filtering

✔ dynamic query

## Security

✔ RLS

---

# 🧩 15. Final дүгнэлт

* Supabase → backend бүрэн орлоно
* PostgreSQL → analytics-д хамгийн тохиромжтой
* Node.js → зөвхөн advanced үед хэрэгтэй
* Schema → system-ийн хамгийн чухал хэсэг

---

# 💡 16. Core mindset

👉 “Database зөв бол app амархан”
👉 “Filter system = product-ийн value”
👉 “Analytics = SQL + structure”

---

✅ 1. ХИЙГДСЭН ЗҮЙЛС (DONE)
🟢 1.1 Project Setup
 * Next.js project үүсгэсэн
 * Supabase project үүсгэсэн
 * PostgreSQL database идэвхжүүлсэн
 * Auth system асаасан
 * API keys авсан (.env.local)

 🟢 1.2 Database Schema
 * Supabase connection ажиллаж байгаа (INSERT/SELECT OK)
🟢 1.3 Frontend Integration
 * supabaseClient.ts үүсгэсэн
 * Next.js + Supabase холбосон
 * basic insert / select test хийсэн
🟢 1.4 Core Architecture Decision
 * Node.js хэрэггүй (initial phase)
 * Supabase = backend + API
*  PostgreSQL = analytics engine

⚠️ 2. ОДОО АЖИЛЛАЖ БАЙГАА STATE (ISSUES)
🟡 2.1 Data Integrity Issue
❌ user_id = null
❌ account_id = null
❌ type/price fields missing

👉 Insert ажиллаж байгаа ч data incomplete

🟡 2.2 No Authentication binding
Auth байгаа ч DB-тэй холбогдоогүй
🟡 2.3 No real UI flow
Form байхгүй (manual test insert)

🚧 3. ХИЙХ ҮЛДСЭН ЗҮЙЛС (TODO)
🔥 PHASE 1 — CORE FOUNDATION (MUST DO)
🟠 3.1 Authentication Integration
 * supabase auth session авах
 * user_id автомат insert хийх
 * login/logout state handle хийх

🟠 3.2 Account System (IMPORTANT)
 account create UI
 account select dropdown
 account_id link хийх
🟠 3.3 Fix Trade Insert (CRITICAL)
 full trade form хийх
 required fields enforce хийх




**END**
