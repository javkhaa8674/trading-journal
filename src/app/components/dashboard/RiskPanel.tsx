"use client";

import React from "react";

type RiskData = {
  dailyLossPercent?: number;
  totalDrawdown?: number;
  dailyBreached?: boolean;
  totalBreached?: boolean;
};

export default function RiskPanel({ data }: { data?: RiskData }) {
  if (!data) {
    return (
      <div className="p-4 rounded-xl bg-gray-200">Loading risk data...</div>
    );
  }

  const daily = data.dailyLossPercent ?? 0;
  const drawdown = data.totalDrawdown ?? 0;

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 📉 Daily Loss */}
      <div
        className={`p-4 rounded-xl text-white ${
          data.dailyBreached ? "bg-red-600" : "bg-green-600"
        }`}
      >
        <h3>Daily Loss</h3>

        <p className="text-2xl font-bold">{daily.toFixed(2)}%</p>

        <p className="text-xs">Limit: -5%</p>
      </div>

      {/* 📊 Total Drawdown */}
      <div
        className={`p-4 rounded-xl text-white ${
          data.totalBreached ? "bg-red-600" : "bg-green-600"
        }`}
      >
        <h3>Total Drawdown</h3>

        <p className="text-2xl font-bold">{drawdown.toFixed(2)}%</p>

        <p className="text-xs">Limit: -10%</p>
      </div>
    </div>
  );
}
