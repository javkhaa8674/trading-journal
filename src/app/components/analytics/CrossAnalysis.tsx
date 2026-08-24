// src/components/analytics/CrossAnalysis.tsx

"use client";

interface CrossAnalysisProps {
  data: {
    winningFormula: string;
    losingFormula: string;
  };
}

export function CrossAnalysis({ data }: CrossAnalysisProps) {
  if (!data?.winningFormula || data.winningFormula.includes("Хангалттай")) {
    return (
      <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">4️⃣ Cross Analysis</h2>
        <p className="text-sm text-gray-500">
          Хангалттай мэдээлэл байхгүй байна.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-lg font-semibold">4️⃣ Cross Analysis</h2>
      <p className="text-sm text-gray-500 mb-4">Амжилт ба алдагдалын томьёо</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20">
          <h3 className="text-sm font-medium text-green-700 dark:text-green-400">
            🏆 Амжилтын томьёо
          </h3>
          <p className="text-sm mt-2 text-green-800 dark:text-green-300">
            {data.winningFormula}
          </p>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
          <h3 className="text-sm font-medium text-red-700 dark:text-red-400">
            💀 Алдагдалын томьёо
          </h3>
          <p className="text-sm mt-2 text-red-800 dark:text-red-300">
            {data.losingFormula}
          </p>
        </div>
      </div>
    </div>
  );
}
