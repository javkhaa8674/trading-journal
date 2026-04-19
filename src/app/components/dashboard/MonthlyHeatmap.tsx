"use client";

type Props = {
  data: {
    month: string;
    profit: number;
  }[];
};

export default function MonthlyHeatmap({ data }: Props) {
  const getColor = (value: number) => {
    if (value > 0) return "bg-green-500";
    if (value < 0) return "bg-red-500";
    return "bg-gray-200";
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow">
      <h2 className="text-sm text-gray-500 mb-4">Monthly Performance</h2>

      <div className="grid grid-cols-4 gap-2">
        {data.map((item) => (
          <div
            key={item.month}
            className={`p-3 rounded-lg text-white text-center ${getColor(
              item.profit,
            )}`}
          >
            <p className="text-xs">{item.month}</p>
            <p className="font-bold">{item.profit}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
