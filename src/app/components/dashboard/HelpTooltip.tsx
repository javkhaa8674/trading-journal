// components/ui/HelpTooltip.tsx
"use client";

import { useState } from "react";

type HelpTooltipProps = {
  title: string;
  description: string;
  position?: "top" | "right" | "bottom" | "left";
};

export function HelpTooltip({
  title,
  description,
  position = "top",
}: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-gray-200 dark:border-t-gray-700",
    bottom:
      "bottom-full left-1/2 -translate-x-1/2 border-b-gray-200 dark:border-b-gray-700",
    left: "left-full top-1/2 -translate-y-1/2 border-l-gray-200 dark:border-l-gray-700",
    right:
      "right-full top-1/2 -translate-y-1/2 border-r-gray-200 dark:border-r-gray-700",
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-400 text-[10px] font-bold text-white hover:bg-gray-500 focus:outline-none"
      >
        ?
      </button>

      {isVisible && (
        <div
          className={`absolute z-50 w-64 rounded-lg border bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800 ${positionClasses[position]}`}
          style={{ minWidth: "200px" }}
        >
          {/* Arrow */}
          <div
            className={`absolute h-0 w-0 border-4 border-transparent ${arrowClasses[position]}`}
          />

          {/* Content */}
          <div className="text-sm">
            <h4 className="mb-1 font-semibold text-gray-900 dark:text-white">
              {title}
            </h4>
            <p className="text-gray-600 dark:text-gray-300">{description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
