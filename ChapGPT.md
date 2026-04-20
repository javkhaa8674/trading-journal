# 📊 Trading Journal App – UPDATED ARCHITECTURE (v2.1 – FIXED + CONSISTENT)

---

# 🎯 Төслийн зорилго

Trading journal + advanced analytics dashboard хийх:

- Trade data хадгалах
- Winrate / Profit Factor / Net Profit тооцох
- Avg Win / Avg Loss / Expectancy / RRR тооцох
- Equity Curve + Drawdown visualization хийх
- Monthly performance tracking хийх
- Chart + Table dashboard
- Advanced filtering (account / date)
- Multi-user system (Supabase Auth)

---

# 🧠 1. System Architecture

Frontend (Next.js App Router)  
  ↓  
Supabase (Auth + PostgreSQL + RLS)

👉 Backend server шаардлагагүй (MVP / Pro dashboard phase)

---

# 🧠 2. Current Progress Status

## ✅ DONE (Core System)

- Supabase Auth working
- User session management
- Accounts system working
- Trades CRUD working
- RLS enabled (secure multi-user)
- Foreign key relationships fixed
- Trade list UI completed
- Account filter working
- Profit formatting (toFixed)
- Profit color logic (green/red)
- Modular component structure

---

## 📊 NEW DONE (Analytics Layer + Dashboard)

### ✔ Metrics Engine (FULL)

- Winrate
- Profit Factor
- Net Profit
- Avg Win / Avg Loss
- Expectancy
- RRR (Overall / Win / Loss)
- Avg Position Size
- Avg Holding Time

---

### ✔ Visualization Layer

- Equity Curve chart (Recharts)
- Smooth Equity (Rolling EMA)
- Drawdown curve
- Equity + Drawdown overlay chart
- Monthly performance aggregation

---

# 🗄️ 3. Database Schema (FINAL)

## accounts

```sql
id uuid primary key default gen_random_uuid(),
user_id uuid not null,
broker text,
name text,
mode text,
balance numeric,
created_at timestamptz default now()


trades
id uuid primary key default gen_random_uuid(),
user_id uuid not null,
account_id uuid not null,
symbol text,
type text,
entry_price numeric,
exit_price numeric,
profit numeric,
stop_loss numeric,
take_profit numeric,
lot_size numeric,
open_time timestamp,
close_time timestamp
🔗 4. Relationships

User (auth.users)
 └── Accounts (1 → many)
   └── Trades (1 → many)

🔐 5. RLS Security
accounts
alter table accounts enable row level security;

create policy "Users own accounts"
on accounts
for all
using (auth.uid() = user_id);
trades
alter table trades enable row level security;

create policy "Users own trades"
on trades
for all
using (auth.uid() = user_id);
🚀 6. UI Pages Structure
/trades
   └── Trade list + filters + analytics base

/trades/new
   └── Create trade form

/accounts
   └── Account management

/dashboard
   └── FULL analytics dashboard (NEW)
📊 7. Dashboard System (FINAL CORE)
7.1 Metrics Layer
Winrate = wins / total trades
Profit Factor = gross profit / gross loss
Net Profit = sum(profit)
Expectancy = EV per trade
Avg Win / Avg Loss
RRR (Risk Reward Ratio)
Avg Position Size
Avg Holding Time
7.2 Equity Curve Engine
Cumulative equity over time
Smooth equity (rolling window / EMA)
Index + Date support
Recharts-ready format
7.3 Drawdown System
Peak tracking
Equity drop calculation
Max Drawdown (%)
Drawdown duration
7.4 Monthly Performance
Group by YYYY-MM
Monthly PnL aggregation
Heatmap-ready structure
7.5 Equity vs Drawdown Overlay
Green → Equity
Red → Drawdown
Institutional hedge-fund style visualization
🧩 8. Project Architecture (FINAL)
Core App Structure
/app
   /components
      /dashboard
         ├── DashboardStats.tsx
         ├── EquityCurveChart.tsx
         ├── EquityDrawdownChart.tsx
         ├── MonthlyHeatmap.tsx
         ├── RiskPanel.tsx
         ├── TradingDayPerformance.tsx
         ├── MostTradedInstruments.tsx      # Bar chart - top instruments
         ├── DailySummaryCalendar.tsx       # Calendar heatmap
         ├── TradeDurationPnL.tsx           # PnL by duration (scatter/bar)
         ├── InstrumentProfitAnalysis.tsx   # Profit by instrument (horizontal bar)
         ├── InstrumentVolumeAnalysis.tsx   # Volume by instrument (pie/bar)
         ├── LongShortAnalysis.tsx          # Long vs Short comparison
         ├── KeyMetricsCards.tsx
         └── RollingEquityChart.tsx
      /trades
         ├── TradeForm.tsx
         ├── TradeList.tsx
   /dashboard
         ── page.tsx
   /login
         ── page.tsx
   /register
         ── page.tsx
   /trades
         /[id]
            └── page.tsx
         /new
            └── page.tsx
         └── page.tsx
   layout.tsx
   page.tsx
/lib
   /hooks
      ├─useAccounts.ts
   ├── analytics.ts
   ├── equity.ts
   ├── dashboardAnalytics.ts
   ├── getCurrentUser.ts
   ├── supabaseClient.ts
/types
├── account.ts
├── trade.ts

🎛️ 9. Trade Filter Logic
query = query.eq("account_id", selectedAccount);
🧠 10. Key Improvements
❌ No longer CRUD app
✅ Now analytics platform
✅ Clean layered architecture
✅ No circular imports
✅ Production-safe dashboard system
✅ Financial-grade metrics engine
📊 11. Current System State
MVP → 90% COMPLETE
Stable systems:
Auth
Database
Trade flow
Analytics engine
Dashboard charts
Equity + drawdown system
```
