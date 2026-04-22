"use client";
import { HelpTooltip } from "./HelpTooltip";
import { metricsHelp } from "@/lib/constants/metricsHelp";

interface KeyMetricsCardsProps {
  numberOfDays: number;
  totalLotsUsed: number;
  biggestWin: number;
  biggestLoss: number;
}

export function KeyMetricsCards({
  numberOfDays,
  totalLotsUsed,
  biggestWin,
  biggestLoss,
}: KeyMetricsCardsProps) {
  const metrics = [
    {
      title: "Number of Trading Days",
      value: numberOfDays,
      icon: "📅",
      color: "blue",
      metricKey: "numberOfTradingDays" as keyof typeof metricsHelp,
    },
    {
      title: "Total Lots Used",
      value: totalLotsUsed.toFixed(2),
      icon: "⚖️",
      color: "purple",
      metricKey: "totalUsedLots" as keyof typeof metricsHelp,
    },
    {
      title: "Biggest Win",
      value: `$${biggestWin.toFixed(2)}`,
      icon: "🏆",
      color: "green",
      metricKey: "biggestWin" as keyof typeof metricsHelp,
    },
    {
      title: "Biggest Loss",
      value: `$${Math.abs(biggestLoss).toFixed(2)}`,
      icon: "⚠️",
      color: "red",
      metricKey: "biggestLoss" as keyof typeof metricsHelp,
    },
  ];

  const colorClasses = {
    blue: "border-blue-200 bg-blue-50 dark:bg-blue-950/20",
    purple: "border-purple-200 bg-purple-50 dark:bg-purple-950/20",
    green: "border-green-200 bg-green-50 dark:bg-green-950/20",
    red: "border-red-200 bg-red-50 dark:bg-red-950/20",
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.title}
          className={`rounded-lg border p-4 ${colorClasses[metric.color as keyof typeof colorClasses]}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">{metric.icon}</span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {metric.title}
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold">{metric.value}</div>
          <HelpTooltip
            title={metricsHelp[metric.metricKey].title}
            description={metricsHelp[metric.metricKey].description}
          />
        </div>
      ))}
    </div>
  );
}
