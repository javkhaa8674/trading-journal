// src/components/report/ReportDownloadButton.tsx

"use client";

import React, { useState } from "react";

interface ReportDownloadButtonProps {
  accountId?: string;
  strategyId?: string;
  label?: string;
  format?: "json" | "markdown" | "text";
  includeRawData?: boolean;
  className?: string;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

// ✅ Icon Components
const Icons = {
  Markdown: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 17V7l4 6 4-6v10" />
      <path d="M18 17V7l-4 6" />
      <path d="M22 17V7" />
      <path d="M2 17h2" />
      <path d="M20 17h2" />
      <rect x="2" y="2" width="20" height="20" rx="2" />
    </svg>
  ),

  Text: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7V4h16v3" />
      <path d="M9 20h6" />
      <path d="M12 4v16" />
      <path d="M8 20v-8" />
      <path d="M16 20v-8" />
      <rect x="2" y="2" width="20" height="20" rx="2" />
    </svg>
  ),

  Json: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8L2 12l4 4" />
      <path d="M18 8l4 4-4 4" />
      <path d="M14 4l-4 16" />
      <rect x="2" y="2" width="20" height="20" rx="2" />
    </svg>
  ),

  Download: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),

  Spinner: () => (
    <svg
      className="animate-spin w-4 h-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  ),
};

export function ReportDownloadButton({
  accountId,
  strategyId,
  label,
  format = "markdown",
  includeRawData = true,
  className = "",
  icon,
  variant = "primary",
  size = "md",
}: ReportDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Get icon based on format
  const getDefaultIcon = () => {
    if (icon) return icon;
    switch (format) {
      case "markdown":
        return <Icons.Markdown />;
      case "text":
        return <Icons.Text />;
      case "json":
        return <Icons.Json />;
      default:
        return <Icons.Download />;
    }
  };

  // ✅ Get label based on format
  const getDefaultLabel = () => {
    if (label) return label;
    switch (format) {
      case "markdown":
        return "MD";
      case "text":
        return "TXT";
      case "json":
        return "JSON";
      default:
        return "Татах";
    }
  };

  // ✅ Get variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700";
      case "secondary":
        return "bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600";
      case "outline":
        return "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800";
      case "ghost":
        return "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800";
      default:
        return "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700";
    }
  };

  // ✅ Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "px-2.5 py-1.5 text-xs";
      case "lg":
        return "px-5 py-2.5 text-base";
      default:
        return "px-3.5 py-2 text-sm";
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (accountId && accountId !== "all" && accountId !== "undefined") {
        params.set("accountId", accountId);
      }
      if (strategyId && strategyId !== "all" && strategyId !== "undefined") {
        params.set("strategyId", strategyId);
      }

      params.set("format", format);
      params.set("includeRaw", String(includeRawData));

      const url = `/api/report?${params.toString()}`;
      console.log("Fetching report from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      console.log("Response status:", response.status);

      if (response.status === 401) {
        setError("Та нэвтрээгүй байна. Нэвтрээд дахин оролдоно уу.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        let errorMessage = "Report generation failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // ✅ Handle different formats
      if (format === "json") {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const urlObj = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = urlObj;
        link.download = `psychology-report-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(urlObj), 1000);
      } else {
        const text = await response.text();

        let extension: string;
        let mimeType: string;

        if (format === "markdown") {
          extension = "md";
          mimeType = "text/markdown";
        } else {
          extension = "txt";
          mimeType = "text/plain";
        }

        const blob = new Blob([text], { type: mimeType });
        const urlObj = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = urlObj;
        link.download = `psychology-report-${new Date().toISOString().split("T")[0]}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(urlObj), 1000);
      }

      setLoading(false);
    } catch (err) {
      console.error("Report generation error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate report",
      );
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col items-start gap-1 ${className}`}>
      <button
        onClick={generateReport}
        disabled={loading}
        className={`rounded-lg transition-colors flex items-center gap-1.5 font-medium ${getVariantStyles()} ${getSizeStyles()} ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? <Icons.Spinner /> : getDefaultIcon()}
        {getDefaultLabel()}
      </button>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 max-w-xs">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
