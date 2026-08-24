// src/components/analytics/SummaryStats.tsx

"use client";

interface SummaryStatsProps {
  trades: any[];
}

// 🆕 Risk-ийг SL-ээс тооцоолох
function getRisk(trade: any): number {
  if (trade.entry_price && trade.stop_loss) {
    return Math.abs(trade.entry_price - trade.stop_loss);
  }
  // Хэрэв SL байхгүй бол default 1
  return 1;
}

// 🆕 R-Multiple тооцоолох (profit / risk)
function getRMultiple(trade: any): number {
  if (!trade.profit) return 0;

  const risk = getRisk(trade);
  if (risk === 0) return 0;

  // Profit / Risk = R-Multiple
  return parseFloat((trade.profit / risk).toFixed(2));
}

export function SummaryStats({ trades }: SummaryStatsProps) {
  console.log("📊 SummaryStats trades:", trades);
  console.log("📊 First trade profit:", trades[0]?.profit);
  console.log("📊 First trade entry:", trades[0]?.entry_price);
  console.log("📊 First trade sl:", trades[0]?.stop_loss);
  const totalTrades = trades.length;

  // ✅ R-Multiple-г profit-оос тооцоолох
  const totalR = trades.reduce((sum, t) => sum + getRMultiple(t), 0);
  const avgR = totalTrades > 0 ? (totalR / totalTrades).toFixed(2) : "0.00";

  const totalPnl = trades.reduce((sum, t) => sum + (t.profit || 0), 0);
  const winRate =
    totalTrades > 0
      ? (
          (trades.filter((t) => (t.profit || 0) > 0).length / totalTrades) *
          100
        ).toFixed(0)
      : "0";

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard label="Нийт Trade" value={totalTrades} icon="📊" />
      <StatCard
        label="Win Rate"
        value={`${winRate}%`}
        icon="📈"
        color={parseFloat(winRate) >= 50 ? "text-green-600" : "text-red-600"}
      />
      <StatCard
        label="Avg R"
        value={avgR}
        icon="📉"
        color={parseFloat(avgR) >= 0 ? "text-green-600" : "text-red-600"}
      />
      <StatCard
        label="Нийт P&L"
        value={`${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`}
        icon="💰"
        color={totalPnl >= 0 ? "text-green-600" : "text-red-600"}
      />
    </div>
  );
}

function StatCard({ label, value, icon, color = "" }: any) {
  return (
    <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2 text-gray-500">
        <span>{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <div className={`mt-1 text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
