// src/components/report/ReportButtonGroup.tsx

"use client";

import React from "react";
import { ReportDownloadButton } from "./ReportDownloadButton";

interface ReportButtonGroupProps {
  accountId?: string;
  strategyId?: string;
  includeRawData?: boolean;
  className?: string;
}

export function ReportButtonGroup({
  accountId,
  strategyId,
  includeRawData = true,
  className = "",
}: ReportButtonGroupProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* ✅ MD Button */}
      <ReportDownloadButton
        accountId={accountId}
        strategyId={strategyId}
        format="markdown"
        includeRawData={includeRawData}
        variant="primary"
        size="sm"
      />

      {/* ✅ TXT Button */}
      <ReportDownloadButton
        accountId={accountId}
        strategyId={strategyId}
        format="text"
        includeRawData={includeRawData}
        variant="secondary"
        size="sm"
      />

      {/* ✅ JSON Button */}
      <ReportDownloadButton
        accountId={accountId}
        strategyId={strategyId}
        format="json"
        includeRawData={includeRawData}
        variant="outline"
        size="sm"
      />
    </div>
  );
}
