// components/ui/MetricCard.tsx
import { HelpTooltip } from "./HelpTooltip";
import { metricsHelp } from "@/lib/constants/metricsHelp";

type MetricCardProps = {
  title: string;
  value: string | number;
  metricKey: keyof typeof metricsHelp;
  color?: string;
  sub?: string;
};

export function MetricCard({
  title,
  value,
  metricKey,
  color = "text-gray-900",
  sub,
}: MetricCardProps) {
  const help = metricsHelp[metricKey];

  // Dark mode-д зориулсан өнгөний классыг динамик болгох
  const getColorClass = () => {
    if (color.includes("green")) {
      return color + " dark:text-green-400";
    }
    if (color.includes("red")) {
      return color + " dark:text-red-400";
    }
    if (color.includes("blue")) {
      return color + " dark:text-blue-400";
    }
    if (color.includes("yellow")) {
      return color + " dark:text-yellow-400";
    }
    return color + " dark:text-gray-100";
  };

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-900 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </h3>
          {help && (
            <HelpTooltip title={help.title} description={help.description} />
          )}
        </div>
      </div>
      <p className={`mt-2 text-2xl font-bold ${getColorClass()}`}>{value}</p>
      {sub && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{sub}</p>
      )}
    </div>
  );
}
