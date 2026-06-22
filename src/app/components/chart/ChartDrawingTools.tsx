"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";

interface ChartDrawingToolsProps {
  tools: string[];
  onToolsChange: (tools: string[]) => void;
}

// TradingView-тэй төстэй SVG icon-ууд
const ToolIcons = {
  "trend-line": () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="2" y1="20" x2="10" y2="8" />
      <line x1="10" y1="8" x2="22" y2="18" />
    </svg>
  ),
  ray: () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="2" y1="20" x2="12" y2="10" />
      <line x1="12" y1="10" x2="22" y2="20" strokeDasharray="4,4" />
    </svg>
  ),
  "extended-line": () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="2" y1="20" x2="12" y2="8" />
      <line x1="12" y1="8" x2="22" y2="2" strokeDasharray="4,4" />
    </svg>
  ),
  "horizontal-line": () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  ),
  "vertical-line": () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="12" y1="2" x2="12" y2="22" />
    </svg>
  ),
  arrow: () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="2" y1="20" x2="18" y2="4" />
      <polyline points="12,10 18,4 22,12" />
    </svg>
  ),
  rectangle: () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="5" width="18" height="14" rx="0" />
    </svg>
  ),
  circle: () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  ellipse: () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <ellipse cx="12" cy="12" rx="10" ry="6" />
    </svg>
  ),
  triangle: () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polygon points="12,2 22,20 2,20" />
    </svg>
  ),
  path: () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="2,18 6,10 10,14 16,4 20,8" />
    </svg>
  ),
  polyline: () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="2,20 6,12 10,16 16,6 22,18" />
      <circle cx="2" cy="20" r="2" fill="currentColor" />
      <circle cx="22" cy="18" r="2" fill="currentColor" />
    </svg>
  ),
  brush: () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 2l-8 8" />
      <path d="M18 2l4 4-8 8" />
      <path d="M10 10l-6 6 4 4 6-6" />
      <circle cx="4" cy="20" r="2" fill="currentColor" />
    </svg>
  ),
  curve: () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M2 18C6 8 10 16 14 8c4-8 8 4 12 0" />
    </svg>
  ),
  "double-curve": () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M2 16c4-8 8 8 12 0 4-8 8 8 10 4" />
    </svg>
  ),
  text: () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="6" y1="20" x2="18" y2="20" />
      <line x1="6" y1="4" x2="18" y2="4" />
    </svg>
  ),
  note: () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 9h18" />
    </svg>
  ),
  callout: () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 18l4-4h12a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2z" />
      <path d="M9 18l-3 4" />
    </svg>
  ),
  comment: () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  ),
  "price-label": () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="2" y="8" width="12" height="8" rx="1" />
      <path d="M14 12h8" />
      <text x="5" y="14" fontSize="8" fill="currentColor">
        $
      </text>
    </svg>
  ),
  "price-note": () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="2" y="6" width="16" height="12" rx="1" />
      <path d="M18 12h4" />
      <text x="4" y="14" fontSize="6" fill="currentColor">
        123
      </text>
    </svg>
  ),
  flag: () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="4" y1="4" x2="4" y2="20" />
      <polyline points="4,4 20,8 4,12" />
    </svg>
  ),
  pin: () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4" />
      <path d="M12 18v4" />
    </svg>
  ),
  signpost: () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="8" y="4" width="8" height="3" rx="1" />
      <path d="M8 5.5H4" />
      <line x1="12" y1="7" x2="12" y2="18" />
      <polygon points="8,18 16,18 12,22" />
    </svg>
  ),
  "fib-retracement": () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="4" y1="4" x2="20" y2="20" />
      <line x1="4" y1="10" x2="20" y2="20" strokeDasharray="2,2" />
      <line x1="4" y1="14" x2="20" y2="20" strokeDasharray="2,2" />
      <line x1="4" y1="18" x2="20" y2="20" strokeDasharray="2,2" />
    </svg>
  ),
  "fib-extension": () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="2" y1="18" x2="12" y2="6" />
      <line x1="12" y1="6" x2="22" y2="18" strokeDasharray="4,4" />
      <line x1="12" y1="10" x2="22" y2="18" strokeDasharray="2,2" />
    </svg>
  ),
  "fib-channel": () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="2" y1="18" x2="12" y2="8" />
      <line x1="2" y1="22" x2="12" y2="12" />
      <line x1="12" y1="8" x2="22" y2="2" strokeDasharray="2,2" />
      <line x1="12" y1="12" x2="22" y2="6" strokeDasharray="2,2" />
    </svg>
  ),
  "fib-time-zone": () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="2" y1="2" x2="2" y2="22" />
      <line x1="6" y1="2" x2="6" y2="22" strokeDasharray="2,2" />
      <line x1="10" y1="2" x2="10" y2="22" strokeDasharray="2,2" />
      <line x1="16" y1="2" x2="16" y2="22" strokeDasharray="2,2" />
    </svg>
  ),
  "parallel-channel": () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="2" y1="18" x2="18" y2="6" />
      <line x1="2" y1="22" x2="18" y2="10" />
      <line x1="18" y1="6" x2="22" y2="4" strokeDasharray="4,4" />
      <line x1="18" y1="10" x2="22" y2="8" strokeDasharray="4,4" />
    </svg>
  ),
  "regression-trend": () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="2" y1="18" x2="22" y2="6" />
      <line x1="2" y1="20" x2="22" y2="8" strokeDasharray="2,2" />
      <line x1="2" y1="16" x2="22" y2="4" strokeDasharray="2,2" />
    </svg>
  ),
  "long-position": () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="4" y1="18" x2="20" y2="6" />
      <polyline points="14,6 20,6 20,12" />
    </svg>
  ),
  "short-position": () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="4" y1="6" x2="20" y2="18" />
      <polyline points="14,18 20,18 20,12" />
    </svg>
  ),
  "date-range": () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="4" y1="2" x2="4" y2="6" />
      <line x1="20" y1="2" x2="20" y2="6" />
      <rect x="2" y="6" width="20" height="16" rx="2" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  ),
  "info-line": () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  projection: () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="2" y1="18" x2="10" y2="8" />
      <line x1="10" y1="8" x2="18" y2="18" strokeDasharray="4,4" />
      <line x1="10" y1="12" x2="18" y2="18" strokeDasharray="2,2" />
    </svg>
  ),
  forecast: () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="2" y1="18" x2="10" y2="10" />
      <line x1="10" y1="10" x2="22" y2="18" strokeDasharray="4,4" />
      <rect x="16" y="14" width="6" height="4" rx="1" strokeDasharray="4,4" />
    </svg>
  ),
};

// TOOL_GROUPS - SVG icon-уудтай
const TOOL_GROUPS = [
  {
    id: "lines",
    name: "Lines",
    icon: "📏",
    tools: [
      { id: "trend-line", label: "Trend Line" },
      { id: "ray", label: "Ray" },
      { id: "extended-line", label: "Extended" },
      { id: "horizontal-line", label: "Horizontal" },
      { id: "vertical-line", label: "Vertical" },
      { id: "arrow", label: "Arrow" },
    ],
  },
  {
    id: "shapes",
    name: "Shapes",
    icon: "▭",
    tools: [
      { id: "rectangle", label: "Rectangle" },
      { id: "circle", label: "Circle" },
      { id: "ellipse", label: "Ellipse" },
      { id: "triangle", label: "Triangle" },
      { id: "path", label: "Path" },
      { id: "polyline", label: "Polyline" },
      { id: "brush", label: "Brush" },
      { id: "curve", label: "Curve" },
      { id: "double-curve", label: "Double Curve" },
    ],
  },
  {
    id: "annotations",
    name: "Annotations",
    icon: "📝",
    tools: [
      { id: "text", label: "Text" },
      { id: "note", label: "Note" },
      { id: "callout", label: "Callout" },
      { id: "comment", label: "Comment" },
      { id: "price-label", label: "Price Label" },
      { id: "price-note", label: "Price Note" },
      { id: "flag", label: "Flag" },
      { id: "pin", label: "Pin" },
      { id: "signpost", label: "Signpost" },
    ],
  },
  {
    id: "fibonacci",
    name: "Fibonacci",
    icon: "📈",
    tools: [
      { id: "fib-retracement", label: "Retracement" },
      { id: "fib-extension", label: "Extension" },
      { id: "fib-channel", label: "Channel" },
      { id: "fib-time-zone", label: "Time Zone" },
    ],
  },
  {
    id: "channels",
    name: "Channels",
    icon: "🟧",
    tools: [
      { id: "parallel-channel", label: "Parallel" },
      { id: "regression-trend", label: "Regression" },
    ],
  },
  {
    id: "trading",
    name: "Trading",
    icon: "💰",
    tools: [
      { id: "long-position", label: "Long" },
      { id: "short-position", label: "Short" },
    ],
  },
  {
    id: "measurement",
    name: "Measurement",
    icon: "📏",
    tools: [
      { id: "date-range", label: "Date Range" },
      { id: "info-line", label: "Info" },
      { id: "projection", label: "Projection" },
      { id: "forecast", label: "Forecast" },
    ],
  },
];

const ChartDrawingTools: React.FC<ChartDrawingToolsProps> = ({
  tools,
  onToolsChange,
}) => {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const colors = {
    background: isDark ? "#1e222d" : "#f5f5f5",
    border: isDark ? "#2a2e39" : "#e0e0e0",
    text: isDark ? "#d1d4dc" : "#333333",
    textMuted: isDark ? "#758696" : "#888888",
  };

  const toggleTool = (toolId: string) => {
    console.log("🔧 Tool toggled:", toolId); // 👈 ЭНД ХАРАХ
    if (tools.includes(toolId)) {
      onToolsChange([]);
    } else {
      onToolsChange([toolId]);
    }
    setOpenGroup(null);
    setDropdownPosition(null);
  };

  const handleGroupClick = (groupId: string) => {
    if (openGroup === groupId) {
      setOpenGroup(null);
      setDropdownPosition(null);
    } else {
      const button = buttonRefs.current[groupId];
      if (button) {
        const rect = button.getBoundingClientRect();
        setDropdownPosition({
          top: rect.top,
          left: rect.right + 4,
        });
      }
      setOpenGroup(groupId);
    }
  };

  const handleGroupHover = (groupId: string | null) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (groupId) {
      timeoutRef.current = setTimeout(() => {
        const button = buttonRefs.current[groupId];
        if (button) {
          const rect = button.getBoundingClientRect();
          setDropdownPosition({
            top: rect.top,
            left: rect.right + 4,
          });
        }
        setOpenGroup(groupId);
      }, 300);
    } else {
      timeoutRef.current = setTimeout(() => {
        setOpenGroup(null);
        setDropdownPosition(null);
      }, 400);
    }
  };

  const isToolActive = (toolId: string) => tools.includes(toolId);
  const isGroupOpen = (groupId: string) => openGroup === groupId;

  const isGroupActive = (groupTools: (typeof TOOL_GROUPS)[0]["tools"]) => {
    return groupTools.some((t) => tools.includes(t.id));
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(event.target as Node)
      ) {
        setOpenGroup(null);
        setDropdownPosition(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Auto open group when tool is selected
  useEffect(() => {
    if (tools.length > 0) {
      const activeToolId = tools[0];
      const group = TOOL_GROUPS.find((g) =>
        g.tools.some((t) => t.id === activeToolId),
      );
      if (group && openGroup !== group.id) {
        const button = buttonRefs.current[group.id];
        if (button) {
          const rect = button.getBoundingClientRect();
          setDropdownPosition({
            top: rect.top,
            left: rect.right + 4,
          });
        }
        setOpenGroup(group.id);
      }
    }
  }, [tools]);

  // Render icon helper
  const renderIcon = (toolId: string) => {
    const IconComponent = ToolIcons[toolId as keyof typeof ToolIcons];
    if (IconComponent) {
      return <IconComponent />;
    }
    // Fallback: first letter of tool id
    return (
      <span className="text-[10px]">{toolId.charAt(0).toUpperCase()}</span>
    );
  };

  return (
    <div
      ref={toolbarRef}
      className="flex-shrink-0 relative z-50 h-full"
      style={{ width: "44px" }}
    >
      {/* Main Toolbar */}
      <div
        className="rounded-lg shadow-2xl border p-1 flex flex-col h-full transition-colors duration-300"
        style={{
          width: "42px",
          backgroundColor: colors.background,
          borderColor: colors.border,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-center mb-1 pb-1 border-b flex-shrink-0"
          style={{
            borderColor: colors.border,
          }}
        >
          <span className="text-[11px]" style={{ color: colors.textMuted }}>
            ✏️
          </span>
        </div>

        {/* Tool groups */}
        <div
          className="flex-1 overflow-y-auto"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: isDark
              ? "#4a4f5a transparent"
              : "#cccccc transparent",
          }}
        >
          <style>{`
            div::-webkit-scrollbar {
              width: 2px;
            }
            div::-webkit-scrollbar-track {
              background: transparent;
            }
            div::-webkit-scrollbar-thumb {
              background: ${isDark ? "#4a4f5a" : "#cccccc"};
              border-radius: 2px;
            }
          `}</style>

          {TOOL_GROUPS.map((group) => {
            const groupActive = isGroupActive(group.tools);
            const isOpen = isGroupOpen(group.id);

            return (
              <div key={group.id} className="relative">
                {/* Group button */}
                <button
                  ref={(el) => {
                    buttonRefs.current[group.id] = el;
                  }}
                  onClick={() => handleGroupClick(group.id)}
                  onMouseEnter={() => handleGroupHover(group.id)}
                  onMouseLeave={() => handleGroupHover(null)}
                  className={`
                    w-full h-8 rounded flex items-center justify-center text-base transition-all relative
                    ${isOpen ? "bg-opacity-20" : ""}
                    ${
                      groupActive
                        ? "text-blue-400"
                        : "hover:text-white hover:bg-opacity-10"
                    }
                  `}
                  style={{
                    backgroundColor: isOpen
                      ? isDark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.08)"
                      : "transparent",
                    color: groupActive ? "#60a5fa" : colors.textMuted,
                  }}
                  title={group.name}
                >
                  <span className="text-[16px]">{group.icon}</span>
                  {groupActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-400 rounded-full" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom indicator */}
        {tools.length > 0 && (
          <div
            className="mt-1 pt-1 border-t flex items-center justify-center flex-shrink-0"
            style={{
              borderColor: colors.border,
            }}
          >
            <span className="text-[8px]" style={{ color: colors.textMuted }}>
              {tools.length}
            </span>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isGroupOpen(openGroup || "") && dropdownPosition && (
        <div
          className="fixed rounded-lg shadow-2xl border p-1.5"
          style={{
            minWidth: "170px",
            maxHeight: "400px",
            overflowY: "auto",
            zIndex: 99999,
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            backgroundColor: colors.background,
            borderColor: colors.border,
          }}
          onMouseEnter={() => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
          }}
          onMouseLeave={() => {
            timeoutRef.current = setTimeout(() => {
              setOpenGroup(null);
              setDropdownPosition(null);
            }, 300);
          }}
        >
          {openGroup && (
            <>
              <div
                className="text-[10px] font-medium px-2 py-1 border-b mb-1 flex items-center gap-1.5"
                style={{
                  color: colors.textMuted,
                  borderColor: colors.border,
                }}
              >
                <span className="text-base">
                  {TOOL_GROUPS.find((g) => g.id === openGroup)?.icon}
                </span>
                <span>{TOOL_GROUPS.find((g) => g.id === openGroup)?.name}</span>
              </div>

              {TOOL_GROUPS.find((g) => g.id === openGroup)?.tools.map(
                (tool) => (
                  <button
                    key={tool.id}
                    onClick={() => toggleTool(tool.id)}
                    className={`
                      w-full flex items-center gap-2.5 px-2 py-1.5 rounded transition-all text-sm
                      ${
                        isToolActive(tool.id)
                          ? "bg-blue-500 text-white"
                          : "hover:bg-opacity-10"
                      }
                    `}
                    style={{
                      color: isToolActive(tool.id) ? "white" : colors.text,
                    }}
                    title={tool.label}
                  >
                    <span className="w-5 h-5 flex items-center justify-center text-current">
                      {renderIcon(tool.id)}
                    </span>
                    <span className="flex-1 text-left truncate text-xs">
                      {tool.label}
                    </span>
                    {isToolActive(tool.id) && (
                      <span className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
                    )}
                  </button>
                ),
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChartDrawingTools;
