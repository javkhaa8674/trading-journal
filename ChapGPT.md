# 📊 Trading Journal App – UPDATED ARCHITECTURE (v3.0 – COMPLETE)

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
- **Prop Firm Challenge Rules (Daily Loss 5%, Total Drawdown 10%)**
- **Help Tooltip бүх үзүүлэлт дээр (Монгол тайлбар)**

---

# 🧠 1. System Architecture

Frontend (Next.js App Router 16.2.4)  
  ↓  
Supabase (Auth + PostgreSQL + RLS)  
  ↓  
Vercel (Hosting)

👉 Backend server шаардлагагүй (Full-stack on Supabase + Vercel)

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
- **Account status (active/archived/closed) with color coding**
- **Bulk trade upload (CSV/text format)**

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
- **Sharpe Ratio**
- **Calmar Ratio**
- **Consistency Score (Rolling Win Rate Stability)**
- **Max Drawdown with Duration**
- **Average Drawdown**

---

### ✔ Visualization Layer

- Equity Curve chart (Recharts)
- Smooth Equity (Rolling EMA)
- Drawdown curve
- Equity + Drawdown overlay chart
- Monthly performance aggregation
- **Trading Day Performance (Bar + Line)**
- **Most Traded Instruments (Horizontal Bar)**
- **Daily Summary Calendar (Heatmap with month navigation)**
- **Long vs Short Analysis (Pie + Bar)**
- **PnL by Trade Duration (Scatter + Bar)**
- **Instrument Profit Analysis (Horizontal Bar)**
- **Instrument Volume Analysis (Pie + Profit/Lot)**
- **Performance Radar (Spider Web Chart - Normalized/Absolute)**
- **Risk Metrics (Daily Loss 5%, Total Drawdown 10% - Prop Firm Rules)**

---

### ✔ UI Components

- **HelpTooltip** - Бүх үзүүлэлт дээр ? товч, монгол тайлбар
- **MetricCard** - Дахин ашиглах боломжтой card компонент
- **StatusBadge** - Account status-ийн өнгөт badge
- **LoadingSkeleton** - Loading үед харагдах skeleton

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
status text default 'active',  -- 'active', 'archived', 'closed'
created_at timestamptz default now(),
updated_at timestamptz default now()
trades
sql
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
Database Triggers
sql
-- Automatically update account balance when trades change
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE accounts SET balance = balance + NEW.profit WHERE id = NEW.account_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.profit IS DISTINCT FROM NEW.profit THEN
            UPDATE accounts SET balance = balance - OLD.profit + NEW.profit WHERE id = NEW.account_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE accounts SET balance = balance - OLD.profit WHERE id = OLD.account_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_trade_change
    AFTER INSERT OR UPDATE OR DELETE ON trades
    FOR EACH ROW
    EXECUTE FUNCTION update_account_balance();

---
🔗 4. Relationships
text
User (auth.users)
 └── Accounts (1 → many)
   └── Trades (1 → many)

---
🔐 5. RLS Security
accounts
sql
alter table accounts enable row level security;

create policy "Users own accounts"
on accounts
for all
using (auth.uid() = user_id);
trades
sql
alter table trades enable row level security;

create policy "Users own trades"
on trades
for all
using (auth.uid() = user_id);

---
🚀 6. UI Pages Structure
text
/app
    /login/page.tsx
    /register/page.tsx
    /dashboard/page.tsx
    /trades/
       	page.tsx
       	/[id]/page.tsx
       	/new/page.tsx
    /accounts/
       	page.tsx
       	/new/page.tsx
    	/[id]/page.tsx
   layout.tsx
   page.tsx

---
📊 7. Dashboard System (FINAL CORE)

7.1 Metrics Layer

Metric	Formula

Win Rate	wins / total trades * 100
Loss Rate	losses / total trades * 100
Profit Factor	gross profit / |gross loss|
Net Profit	sum(profit)
Expectancy	net profit / total trades
Avg Win	total win / wins
Avg Loss	total loss / losses
RRR	avg win / |avg loss|
Sharpe Ratio	(avg return / std dev) * sqrt(252)
Calmar Ratio	total return % / max drawdown %
Consistency	100 - (std dev of rolling win rate * 1.5)
Max Drawdown	((peak - trough) / peak) * 100

7.2 Prop Firm Challenge Rules

Rule	Limit	Breach Condition
Daily Loss	-5%	Daily P&L / Balance ≤ -5%
Total Drawdown	-10%	(Peak - Current) / Peak ≥ 10%

7.3 Visualization Components

Component	Description

DashboardStats	Core metrics cards
EquityCurveChart	Equity line chart with smoothing
EquityDrawdownChart	Equity + Drawdown overlay
MonthlyHeatmap	Monthly profit heatmap
RiskPanel	Prop Firm challenge status
TradingDayPerformance	Daily profit + trade count
MostTradedInstruments	Top instruments by trade count
DailySummaryCalendar	Calendar heatmap with month navigation
LongShortAnalysis	Long vs Short comparison
TradeDurationPnL	Duration vs PnL scatter plot
InstrumentProfitAnalysis	Profit by instrument
InstrumentVolumeAnalysis	Volume distribution + profit/lot
SpiderWebChart	Performance radar (Normalized/Absolute)
KeyMetricsCards	Quick metrics overview
HelpTooltip	Mongolian help tooltips

🧩 8. Component Architecture (FINAL)

|-- ChapGPT.md
|-- README.md
|-- Test.md
|-- eslint.config.mjs
|-- next-env.d.ts
|-- next.config.ts
|-- package-lock.json
|-- package.json
|-- postcss.config.mjs
|-- public
|   |-- file.svg
|   |-- globe.svg
|   |-- jforex.svg
|   |-- mt-logo.svg
|   |-- next.svg
|   |-- upload.svg
|   |-- vercel.svg
|   `-- window.svg
|-- src
|   |-- app
|   |   |-- accounts
|   |   |   |-- [id]
|   |   |   |   `-- page.tsx
|   |   |   |-- new
|   |   |   |   `-- page.tsx
|   |   |   `-- page.tsx
|   |   |-- admin
|   |   |   |-- layout.tsx
|   |   |   `-- signups
|   |   |       `-- page.tsx
|   |   |-- brokers
|   |   |   |-- [id]
|   |   |   |   `-- page.tsx
|   |   |   |-- new
|   |   |   |   `-- page.tsx
|   |   |   `-- page.tsx
|   |   |-- chart
|   |   |   `-- page.tsx
|   |   |-- components
|   |   |   |-- appwrapper
|   |   |   |   `-- AppWrapper.tsx
|   |   |   |-- brokers
|   |   |   |   |-- BrokerForm.tsx
|   |   |   |   |-- BrokerList.tsx
|   |   |   |   |-- BrokerSelect.tsx
|   |   |   |   `-- BrokerStats.tsx
|   |   |   |-- dashboard
|   |   |   |   |-- DailySummaryCalendar.tsx
|   |   |   |   |-- DashboardStats.tsx
|   |   |   |   |-- DateRangeFilter.tsx
|   |   |   |   |-- EquityCurveChart.tsx
|   |   |   |   |-- EquityDrawdownChart.tsx
|   |   |   |   |-- HelpTooltip.tsx
|   |   |   |   |-- InstrumentProfitAnalysis.tsx
|   |   |   |   |-- InstrumentVolumeAnalysis.tsx
|   |   |   |   |-- KeyMetricsCards.tsx
|   |   |   |   |-- LongShortAnalysis.tsx
|   |   |   |   |-- MetricCard.tsx
|   |   |   |   |-- MonteCarloEquityChart.tsx
|   |   |   |   |-- MostTradedInstruments.tsx
|   |   |   |   |-- RiskForcasting.tsx
|   |   |   |   |-- RiskOfRuin.tsx
|   |   |   |   |-- RiskPanel.tsx
|   |   |   |   |-- RollingEquityChart.tsx
|   |   |   |   |-- SpiderWebChart.tsx
|   |   |   |   |-- StatsSummaryTooltip.tsx
|   |   |   |   |-- TradeDurationPnl.tsx
|   |   |   |   `-- TradingDayPerformance.tsx
|   |   |   |-- layout
|   |   |   |   |-- ClientLayout.tsx
|   |   |   |   |-- Header.tsx
|   |   |   |   `-- Sidebar.tsx
|   |   |   |-- notifications
|   |   |   |   `-- NotificationBell.tsx
|   |   |   |-- trades
|   |   |   |   |-- TradeForm.tsx
|   |   |   |   `-- TradeList.tsx
|   |   |   `-- ui
|   |   |       |-- RichTextEditor.tsx
|   |   |       `-- ThemeToggle.tsx
|   |   |-- context
|   |   |   `-- SidebarContext.tsx
|   |   |-- dashboard
|   |   |   `-- page.tsx
|   |   |-- deposits
|   |   |   |-- [id]
|   |   |   |   `-- page.tsx
|   |   |   |-- new
|   |   |   |   `-- page.tsx
|   |   |   `-- page.tsx
|   |   |-- favicon.ico
|   |   |-- globals.css
|   |   |-- layout.tsx
|   |   |-- login
|   |   |   `-- page.tsx
|   |   |-- page.tsx
|   |   |-- profile
|   |   |   `-- page.tsx
|   |   |-- providers
|   |   |   |-- NotificationProvider.tsx
|   |   |   |-- Providers.tsx
|   |   |   `-- ThemeProvider.tsx
|   |   |-- psychology
|   |   |   |-- [id]
|   |   |   |   `-- page.tsx
|   |   |   |-- new
|   |   |   |   `-- page.tsx
|   |   |   `-- page.tsx
|   |   |-- register
|   |   |   `-- page.tsx
|   |   |-- reset-password
|   |   |   `-- page.tsx
|   |   |-- settings
|   |   |   `-- page.tsx
|   |   |-- trades
|   |   |   |-- [id]
|   |   |   |   `-- page.tsx
|   |   |   |-- new
|   |   |   |   `-- page.tsx
|   |   |   `-- page.tsx
|   |   |-- trading-plan
|   |   |   `-- page.tsx
|   |   `-- withrawals
|   |       |-- [id]
|   |       |   `-- page.tsx
|   |       |-- new
|   |       |   `-- page.tsx
|   |       `-- page.tsx
|   |-- assets
|   |   `-- logo.png
|   |-- lib
|   |   |-- advancedAnalytics.ts
|   |   |-- analytics.ts
|   |   |-- constants
|   |   |   `-- metricsHelp.ts
|   |   |-- dashboardAnalytics.ts
|   |   |-- equity.ts
|   |   |-- forexSymbolService.ts
|   |   |-- getCurrentUser.ts
|   |   |-- hooks
|   |   |   |-- useAccounts.ts
|   |   |   |-- useBrokers.ts
|   |   |   `-- useUser.ts
|   |   |-- psychologyAnalytics.ts
|   |   |-- queryClient.ts
|   |   |-- supabaseClient.ts
|   |   `-- utils
|   |       |-- consoleFilter.ts
|   |       |-- dateUtils.ts
|   |       `-- statusUtils.ts
|   |-- middleware.ts
|   `-- types
|       |-- accounts.ts
|       |-- broker.ts
|       |-- deposit.ts
|       |-- psychology.ts
|       `-- trade.ts
|-- supabase
|   |-- config.toml
|   |-- functions
|   |   `-- inactivity-check
|   |       |-- deno.json
|   |       `-- index.ts
|   `-- migrations
|       |-- 20260619031934_create_brokers_table.sql
|       `-- 20260619031949_create_brokers_table.sql
|-- tailwind.config.ts
`-- tsconfig.json
📁 9. Core Library Structure
text
/lib
   /hooks
      ├── useAccounts.ts
      ├── useTrades.ts
      └── useSidebar.tsx
   ├── supabaseClient.ts
   ├── getCurrentUser.ts
   ├── analytics.ts
   ├── equity.ts
   ├── dashboardAnalytics.ts
   ├── advancedAnalytics.ts
   /constants
      └── metricsHelp.ts
   /utils
      ├── dateUtils.ts
      └── statusUtils.ts

🎯 10. Key Metrics & Their Mongolian Help Text

Metric	Mongolian Description
Win Rate	Нийт арилжаанаас ашигтайгаар хаагдсан арилжааны эзлэх хувь
Profit Factor	Нийт ашгийг нийт алдагдалд харьцуулсан харьцаа. 1.5-с дээш байх нь сайн
Net Profit	Бүх арилжааны ашгийн нийлбэр
Expectancy	Дунджаар нэг арилжаанд ногдох ашиг
Sharpe Ratio	Эрсдэлд тохируулсан ашиг. 1-с дээш сайн, 2-с дээш маш сайн
Calmar Ratio	Жилийн ашгийг хамгийн их уналтад харьцуулсан харьцаа
Consistency	Арилжааны үр дүнгийн тогтвортой байдал. 70% -с дээш тогтвортой
Max Drawdown	Хамгийн өндөр цэгээс хамгийн доод цэг хүртэлх бууралтын хувь
Risk/Reward	Дундаж ашгийг дундаж алдагдалд харьцуулсан харьцаа
Daily Loss	Өдрийн алдагдлын хязгаар (5%). Хязгаар хэтэрвэл улаан
Total Drawdown	Нийт уналтын хязгаар (10%). Хязгаар хэтэрвэл улаан

🛠️ 11. Tech Stack

Category	Technology
Framework	Next.js 16.2.4 (App Router, Turbopack)
Database	Supabase (PostgreSQL)
Auth	Supabase Auth
Styling	Tailwind CSS
Charts	Recharts
Date Handling	date-fns
Icons	Emoji + Lucide React
Deployment	Vercel
Package Manager	npm

📦 12. Deployment

Vercel Configuration
bash
# Environment Variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
Supabase Configuration
bash
# CORS Settings
Additional allowed origins:
- https://trading-journal.vercel.app
- http://localhost:3000

# Auth Settings
Site URL: https://trading-journal.vercel.app
Redirect URLs: https://trading-journal.vercel.app/**

✅ 13. Current System State

COMPLETED (100%)
✅ Authentication (Login/Register/Logout/Forgot Password)

✅ Account Management (CRUD with status)

✅ Trade Management (CRUD with bulk upload)

✅ Analytics Engine (All metrics)

✅ Dashboard Charts (All visualizations)

✅ Prop Firm Challenge Rules

✅ Help Tooltips (Mongolian language)

✅ Responsive Layout (Mobile/Desktop)

✅ Dark Mode Support

✅ Database Triggers (Auto balance update)

✅ RLS Security

✅ Vercel Deployment Ready

🎯 14. Future Enhancements

Email notifications for challenge breaches

Multi-chart comparison

Export reports (PDF/CSV)

Social sharing of performance

Mobile app (React Native)

Version: 3.0 – COMPLETE
Last Updated: April 2026
Status: Production Ready 🚀
```
