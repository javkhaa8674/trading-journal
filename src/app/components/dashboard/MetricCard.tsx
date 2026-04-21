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

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          {help && (
            <HelpTooltip title={help.title} description={help.description} />
          )}
        </div>
      </div>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}
