"use client";

import { useState } from "react";
import TradingViewWidget from "@/app/components/chart/TradingViewWidget";
import PositionCalculator from "@/app/components/chart/PositionCalculator";

export default function ChartPage() {
  const [calculatorOpen, setCalculatorOpen] = useState(true);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <TradingViewWidget />

      <PositionCalculator
        symbol="XAUUSD"
        open={calculatorOpen}
        onToggle={() => setCalculatorOpen(!calculatorOpen)}
      />
    </div>
  );
}
