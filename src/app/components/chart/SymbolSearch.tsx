"use client";

import React, { useState } from "react";
import { getAllSymbols } from "@/lib/trading/flattenSymbols";

export default function SymbolSearch({
  onSelect,
}: {
  onSelect: (symbol: string) => void;
}) {
  const [query, setQuery] = useState("");

  const symbols = getAllSymbols(); // ✅ NOW FULL DATA

  const filtered = symbols.filter((s) =>
    s.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="relative w-64">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search symbol..."
        className="w-full px-3 py-2 border rounded-lg text-sm"
      />

      {query && (
        <div className="absolute top-full left-0 right-0 bg-white border rounded-lg mt-1 shadow z-50 max-h-60 overflow-auto">
          {filtered.map((symbol) => (
            <div
              key={symbol}
              onClick={() => {
                onSelect(symbol);
                setQuery("");
              }}
              className="
              px-3 py-2 text-sm rounded cursor-pointer
              text-gray-900 dark:text-gray-100
              hover:bg-blue-50 dark:hover:bg-blue-900/30
              transition-colors
  "
            >
              {symbol}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
