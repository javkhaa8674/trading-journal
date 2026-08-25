// src/app/api/report/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  getServerUser,
} from "@/lib/supabaseServer";
import { ReportGenerator } from "@/lib/report/reportGenerator";
import { TradeWithPsychology } from "@/types/trade";
import { getRMultiple } from "@/lib/analytics/insightGenerator";

export async function GET(request: NextRequest) {
  try {
    // ✅ Server-side user authentication
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 },
      );
    }

    console.log("User authenticated:", user.id);

    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get("accountId");
    const strategyId = searchParams.get("strategyId");
    const format = searchParams.get("format") || "json";
    const includeRaw = searchParams.get("includeRaw") !== "false";

    // ✅ Server-side Supabase client
    const supabase = await createServerSupabaseClient();

    // ✅ Use open_time instead of created_at
    let query = supabase
      .from("trades")
      .select(
        `
        *,
        psychology:trade_psychology(*),
        behavior:trade_behavior(*),
        postTradeReview:post_trade_review(*),
        checklistResponses:trade_checklist_responses(*)
      `,
      )
      .eq("user_id", user.id)
      .order("open_time", { ascending: false });

    if (accountId && accountId !== "all" && accountId !== "undefined") {
      query = query.eq("account_id", accountId);
    }
    if (strategyId && strategyId !== "all" && strategyId !== "undefined") {
      query = query.eq("strategy_profile_id", strategyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch data: " + error.message },
        { status: 500 },
      );
    }

    // If no data, return empty report
    if (!data || data.length === 0) {
      const emptyReport = {
        generatedAt: new Date().toISOString(),
        reportId: `report-${Date.now()}`,
        userId: user.id,
        dateRange: { from: "", to: "" },
        filters: { accountId, strategyId },
        summary: {
          totalTrades: 0,
          winRate: 0,
          avgR: 0,
          totalPnl: 0,
          maxDrawdown: 0,
          profitableTrades: 0,
          losingTrades: 0,
          bestTrade: { date: "", rMultiple: 0, pnl: 0 },
          worstTrade: { date: "", rMultiple: 0, pnl: 0 },
        },
        psychology: {
          averageStates: {
            calmness: 0,
            anxiety: 0,
            fear: 0,
            greed: 0,
            frustration: 0,
            confidence: 0,
            focus: 0,
            patience: 0,
            decisionClarity: 0,
            decisionPressure: 0,
          },
          flags: {
            fomoCount: 0,
            fomoPercentage: 0,
            rushedDecisionCount: 0,
            emotionalCarryoverCount: 0,
          },
          correlations: {
            fomoVsWinRate: 0,
            calmnessVsWinRate: 0,
            confidenceVsWinRate: 0,
            anxietyVsWinRate: 0,
          },
        },
        behavior: {
          planAdherence: { full: 0, partial: 0, violated: 0 },
          slModification: {
            none: 0,
            asPlanned: 0,
            increasedRisk: 0,
            emotional: 0,
          },
          tpModification: { none: 0, basedOnNewInfo: 0, fear: 0, greed: 0 },
          earlyExit: { no: 0, asPlanned: 0, fear: 0, impatience: 0 },
          winRateByBehavior: {
            planAdherence: {},
            earlyExit: {},
            slModification: {},
          },
        },
        setup: {
          averageScore: 0,
          distribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
          winRateByScore: { excellent: 0, good: 0, fair: 0, poor: 0 },
          avgRByScore: { excellent: 0, good: 0, fair: 0, poor: 0 },
          topPerformingItems: [],
          bottomPerformingItems: [],
        },
        postTrade: {
          averageExecutionQuality: 0,
          wouldTakeAgain: { yes: 0, yesWithChanges: 0, no: 0 },
          commonReflections: [],
          commonLessons: [],
        },
        patterns: { detected: [], strengths: [], weaknesses: [] },
        recommendations: [],
        rawData: {
          trades: [],
          psychology: [],
          behavior: [],
          setup: [],
          postTrade: [],
        },
        aiPrompt: "No data available for analysis. Please add more trades.",
      };

      // ✅ Return empty report in requested format
      if (format === "markdown" || format === "text") {
        const extension = format === "markdown" ? "md" : "txt";
        const contentType =
          format === "markdown" ? "text/markdown" : "text/plain";

        return new NextResponse(emptyReport.aiPrompt, {
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="psychology-report-${new Date().toISOString().split("T")[0]}.${extension}"`,
          },
        });
      }

      return NextResponse.json(emptyReport);
    }

    // Build TradeWithPsychology objects
    const tradesWithPsych: TradeWithPsychology[] = data.map((trade: any) => {
      const responses = trade.checklistResponses || [];
      const totalItems = responses.filter(
        (r: any) => r.response_status !== "not_applicable",
      ).length;
      const metItems = responses.filter(
        (r: any) => r.response_status === "met",
      ).length;
      const partiallyMetItems = responses.filter(
        (r: any) => r.response_status === "partially_met",
      ).length;

      const setupScore =
        totalItems > 0
          ? ((metItems + partiallyMetItems * 0.5) / totalItems) * 100
          : undefined;

      return {
        ...trade,
        pnl: trade.profit || 0,
        rMultiple: getRMultiple(trade),
        setupScore,
        psychology: trade.psychology,
        behavior: trade.behavior,
        postTradeReview: trade.postTradeReview,
      };
    });

    // Generate report
    const generator = new ReportGenerator(tradesWithPsych, {
      includeRawData: includeRaw,
      includeAIPrompt: true,
      format: format as any,
    });

    const report = generator.generate();

    // ✅ Return in requested format
    if (format === "markdown" || format === "text") {
      const extension = format === "markdown" ? "md" : "txt";
      const contentType =
        format === "markdown" ? "text/markdown" : "text/plain";

      return new NextResponse(report.aiPrompt, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="psychology-report-${new Date().toISOString().split("T")[0]}.${extension}"`,
        },
      });
    }

    // ✅ Default: JSON format
    return NextResponse.json(report);
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      {
        error:
          "Failed to generate report: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { accountId, strategyId, includeRaw = true } = body;

    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from("trades")
      .select(
        `
        *,
        psychology:trade_psychology(*),
        behavior:trade_behavior(*),
        postTradeReview:post_trade_review(*),
        checklistResponses:trade_checklist_responses(*)
      `,
      )
      .eq("user_id", user.id)
      .order("open_time", { ascending: false });

    if (accountId && accountId !== "all" && accountId !== "undefined") {
      query = query.eq("account_id", accountId);
    }
    if (strategyId && strategyId !== "all" && strategyId !== "undefined") {
      query = query.eq("strategy_profile_id", strategyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: 500 },
      );
    }

    const tradesWithPsych: TradeWithPsychology[] = (data || []).map(
      (trade: any) => {
        const responses = trade.checklistResponses || [];
        const totalItems = responses.filter(
          (r: any) => r.response_status !== "not_applicable",
        ).length;
        const metItems = responses.filter(
          (r: any) => r.response_status === "met",
        ).length;
        const partiallyMetItems = responses.filter(
          (r: any) => r.response_status === "partially_met",
        ).length;

        const setupScore =
          totalItems > 0
            ? ((metItems + partiallyMetItems * 0.5) / totalItems) * 100
            : undefined;

        return {
          ...trade,
          pnl: trade.profit || 0,
          rMultiple: getRMultiple(trade),
          setupScore,
          psychology: trade.psychology,
          behavior: trade.behavior,
          postTradeReview: trade.postTradeReview,
        };
      },
    );

    const generator = new ReportGenerator(tradesWithPsych, {
      includeRawData: includeRaw,
      includeAIPrompt: true,
      format: "json",
    });

    const report = generator.generate();

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 },
    );
  }
}
