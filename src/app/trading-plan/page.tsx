// app/(app)/trading-plan/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { RichTextEditor } from "@/app/components/ui/RichTextEditor";

type Section = {
  id: string;
  title: string;
  icon: string;
  placeholder: string;
  defaultContent: string;
};

// Default content with box styles
const defaultContents = {
  strategy: `<div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
  <h2 style="color: #1E3A8A; margin-top: 0;">Алхам 1: Зах зээлийн бүтэц ба чиглэл (Market Structure &amp; Trend)</h2>
  <p>Өдөр тутмын (<strong>Daily, D1</strong>) болон 4 цагийн (<strong>4H, H4</strong>) графикаас зах зээлийн <strong>бүтэц ба чиглэлийг тодорхойлно</strong>.</p>
  <ul>
    <li><strong>Чиглэлтэйгээ нийцсэн (in line with trend)</strong> арилжааг илүү өндөр магадлалтай гэж үзнэ.</li>
    <li>H4 болон H1-г ашиглан бүтцээ <strong>нарийвчлан тодорхойлж (refined structure)</strong>, өмнөх түвшин, mitigation-ийг санаж, одоогийн үнийн байршлыг ойлгоно.</li>
  </ul>
</div>

<div style="background-color: #F5F3FF; border-left: 4px solid #8B5CF6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
  <h2 style="color: #4C1D95; margin-top: 0;">Алхам 2: Сонирхолтой бүс (Points of Interest, POI)</h2>
  <ul>
    <li>Одоогийн тренд дотор <strong>imbalanced supply/demand</strong> бүсийг хайж, үнэ татах боломжтой бүсийг тодорхойлно.</li>
    <li>Өмнөх ёроолуудаас "<strong>liquidity sweep</strong>" хийх боломжтой бүсийг ч анхаарна.</li>
  </ul>
  <h3>Хүчинтэй POI-ийн шалгуур:</h3>
  <ul>
    <li>✓ Одоогийн тренд дотор байрлах supply/demand бүс байгаа эсэх</li>
    <li>✓ <strong>Premium</strong> эсвэл <strong>discount</strong> дээр (50%-ийн retracement-ээс дээш/доош)</li>
    <li>✓ Бүтэц дотор <strong>imbalance үүсгэсэн (created imbalance)</strong> эсэх</li>
    <li>✓ Supply-бүсийн доор, эсвэл demand-бүсийн дээр <strong>liquidity</strong> байгаа эсэх</li>
  </ul>
</div>

<div style="background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
  <h2 style="color: #065F46; margin-top: 0;">Алхам 3: Оруулах цэг (Entry Setup, M5)</h2>
  <ul>
    <li>Үнэ POI-д хүрсний дараа <strong>M5 график</strong> дээр шилжиж, зах зээлийн бүтцийг <strong>тодорхойлно</strong>.</li>
    <li><strong>CHoCH (Change of Character)</strong>-г хүлээнэ</li>
    <li>M5 дээрх <strong>imbalanced supply/demand areas</strong>-ийг тодорхойлно</li>
    <li>Эдгээр бүсэд <strong>limit order</strong> тавина</li>
    <li><strong style="color: #2563EB;">Процессийг механик байлгаж, илүү их бодохгүй байх.</strong></li>
  </ul>
</div>

<div style="background-color: #FFF7ED; border-left: 4px solid #F97316; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
  <h2 style="color: #9A3412; margin-top: 0;">Алхам 4: SL &amp; TP (Stop Loss &amp; Take Profit)</h2>
  <ul>
    <li><strong>SL:</strong> CHoCH-ийн өмнөх <strong>high/low</strong>-оос хэдэн pip-ийн зайтай байрлуулна.</li>
    <li><strong>TP:</strong> Хүрэх цэг илэрхий тодорхой биш байвал <strong>mechanical 1:3 R:R</strong>, эсвэл өмнөх <strong>liquidity zones</strong></li>
  </ul>
</div>`,

  riskManagement: `<div style="background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
  <h2 style="color: #065F46; margin-top: 0;">💰 Live дансууд (Live Accounts)</h2>
  <ul>
    <li><strong>1% эрсдэл (risk)</strong> нэг арилжаанд</li>
    <li>Сэтгэл хөдлөлөөс үл хамааран <strong>consistent risk</strong></li>
    <li><strong>No breakeven, no partials</strong> – SL эсвэл TP хүртэл барих</li>
    <li><strong>1:3 mechanical TP</strong> дүрэм дагах</li>
  </ul>
</div>

<div style="background-color: #FEFCE8; border-left: 4px solid #EAB308; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
  <h2 style="color: #854D0E; margin-top: 0;">🏆 Funded дансууд</h2>
  <ul>
    <li><strong>1-р шат:</strong> 2% эрсдэл</li>
    <li><strong>2-р шат:</strong> 1% эрсдэл</li>
    <li><strong>Live funded:</strong> 1% эрсдэл (secure refund first)</li>
  </ul>
</div>

<div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
  <h2 style="color: #1E3A8A; margin-top: 0;">📈 Дансны хэмжээг өсгөх дүрэм (Scaling Rule)</h2>
  <ul>
    <li>Дараагийн challenge-г зөвхөн <strong>≥3x challenge fee</strong> орсон тохиолдолд авна.</li>
  </ul>
  <p><strong>Жишээ:</strong> Challenge төлбөр: $75, Ашиг хуваах хэмжээ: 95% (30 хоногт 1 удаа татах)<br/>
  → Дараагийн challenge авахдаа ≥ $225-с дээш ашиг орсон байх<br/>
  → Ингэснээр <strong>risk:reward ≥1:3</strong> хадгалагдана.</p>
</div>`,

  keyProcesses: `<div style="background-color: #F5F3FF; border-left: 4px solid #8B5CF6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
  <h2 style="color: #4C1D95; margin-top: 0;">📓 Арилжааны дэвтэр (Trade Journaling)</h2>
  <p>Өдөр бүр:</p>
  <ul>
    <li>Price action recap</li>
    <li>Алдаатай буюу авалгүй өнгөрсөн <strong>valid setups</strong></li>
    <li><strong>Technical overview</strong> + <strong>psychology notes</strong></li>
    <li>Алдаж орхисон арилжаа: <strong>reason under psychology</strong> тэмдэглэх</li>
  </ul>
</div>

<div style="background-color: #EEF2FF; border-left: 4px solid #6366F1; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
  <h2 style="color: #3730A3; margin-top: 0;">📊 Weekly/Monthly/Quarterly ASR (Analyze, Summarize, Review)</h2>
  <ul>
    <li>Өмнөх хугацааг <strong>backtest</strong> хийх (week/month/quarter)</li>
    <li><strong>Rewind price</strong> ба бар бүрээр судлах</li>
    <li>Алдаатай арилжаа, bias шалгах</li>
    <li>Алдаж орхисон арилжааг тэмдэглэх</li>
  </ul>
</div>`,
};

const sections: Section[] = [
  {
    id: "strategy",
    title: "📈 1. Стратеги (Strategy)",
    icon: "📈",
    placeholder:
      "Enter your trading strategy...\n\n• Market Structure & Trend\n• Points of Interest (POI)\n• Entry Setup (M5)\n• SL & TP Rules",
    defaultContent: defaultContents.strategy,
  },
  {
    id: "risk-management",
    title: "⚖️ 2. Эрсдэлийн удирдлага (Risk Management)",
    icon: "⚖️",
    placeholder:
      "Enter your risk management rules...\n\n• 1% risk per trade\n• Consistent risk\n• No breakeven, no partials\n• 1:3 mechanical TP",
    defaultContent: defaultContents.riskManagement,
  },
  {
    id: "key-processes",
    title: "📝 3. Гол процессууд (Key Processes)",
    icon: "📝",
    placeholder:
      "Enter your key processes...\n\n• Daily trade journaling\n• Weekly/Monthly ASR\n• Price action recap",
    defaultContent: defaultContents.keyProcesses,
  },
];

export default function TradingPlanPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [planData, setPlanData] = useState({
    strategy: defaultContents.strategy,
    riskManagement: defaultContents.riskManagement,
    keyProcesses: defaultContents.keyProcesses,
  });
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["strategy", "risk-management", "key-processes"]),
  );

  // Load user's trading plan
  useEffect(() => {
    const loadPlan = async () => {
      const user = await getCurrentUser();
      if (!user) {
        setPlanData({
          strategy: defaultContents.strategy,
          riskManagement: defaultContents.riskManagement,
          keyProcesses: defaultContents.keyProcesses,
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("trading_plans")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data && !error) {
        setPlanData({
          strategy: data.strategy || defaultContents.strategy,
          riskManagement:
            data.risk_management || defaultContents.riskManagement,
          keyProcesses: data.key_processes || defaultContents.keyProcesses,
        });
      } else {
        setPlanData({
          strategy: defaultContents.strategy,
          riskManagement: defaultContents.riskManagement,
          keyProcesses: defaultContents.keyProcesses,
        });
      }
      setLoading(false);
    };

    loadPlan();
  }, []);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleSave = async () => {
    setSaving(true);
    const user = await getCurrentUser();
    if (!user) {
      alert("Please login first");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("trading_plans").upsert(
      {
        user_id: user.id,
        strategy: planData.strategy,
        risk_management: planData.riskManagement,
        key_processes: planData.keyProcesses,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) {
      alert("Error saving: " + error.message);
    } else {
      alert("Trading plan saved successfully!");
      setIsEditing(false);
    }
    setSaving(false);
  };

  // Safe HTML render function
  const renderSafeHTML = (html: string | undefined): string => {
    if (!html || typeof html !== "string" || html.trim() === "") {
      return '<p class="text-gray-400 italic">No content yet. Click "Edit Plan" to add your trading strategy.</p>';
    }
    return html;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-2xl">📋</div>
          <div className="text-gray-500 dark:text-gray-400">
            Loading trading plan...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">
            📋 Trading Plan
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            My personal trading strategy, risk management rules, and key
            processes
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() =>
              setExpandedSections(
                new Set(["strategy", "risk-management", "key-processes"]),
              )
            }
            className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Expand All
          </button>
          <button
            onClick={() => setExpandedSections(new Set())}
            className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Collapse All
          </button>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-lg bg-blue-500 px-4 py-1 text-sm text-white hover:bg-blue-600"
            >
              ✏️ Edit Plan
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-green-500 px-4 py-1 text-sm text-white hover:bg-green-600 disabled:opacity-50"
              >
                {saving ? "Saving..." : "💾 Save"}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  window.location.reload();
                }}
                className="rounded-lg border px-4 py-1 text-sm hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <div
            key={section.id}
            className="overflow-hidden rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-800"
          >
            <button
              onClick={() => toggleSection(section.id)}
              className="flex w-full items-center justify-between p-4 text-left font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <span className="text-lg dark:text-white">{section.title}</span>
              <span className="text-xl dark:text-white">
                {expandedSections.has(section.id) ? "▼" : "▶"}
              </span>
            </button>
            {expandedSections.has(section.id) && (
              <div className="border-t p-4 dark:border-gray-800">
                {isEditing ? (
                  <RichTextEditor
                    value={
                      planData[section.id as keyof typeof planData] ||
                      section.defaultContent
                    }
                    onChange={(value) =>
                      setPlanData({ ...planData, [section.id]: value })
                    }
                    placeholder={section.placeholder}
                    className="min-h-[300px]"
                  />
                ) : (
                  <div
                    className="trading-plan-content prose prose-sm max-w-none dark:prose-invert
                      [&_div]:rounded-lg [&_div]:p-4 [&_div]:my-4
                      [&_div_h2]:mt-0 [&_div_h2]:mb-2
                      [&_div_h3]:mt-2 [&_div_h3]:mb-1
                      [&_div_ul]:my-2 [&_div_li]:my-1
                      [&_div_strong]:text-blue-600 dark:[&_div_strong]:text-blue-400"
                    dangerouslySetInnerHTML={{
                      __html: renderSafeHTML(
                        planData[section.id as keyof typeof planData],
                      ),
                    }}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Summary Card */}
      <div className="rounded-lg border bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🎯</div>
          <div>
            <h3 className="font-semibold">Trading Plan Summary</h3>
            <p className="text-sm opacity-90">
              Strategy: ICT / Smart Money Concepts | Risk: 1-2% per trade | R:R:
              Minimum 1:3
            </p>
          </div>
        </div>
      </div>

      {/* PDF Export Button */}
      <div className="flex justify-end">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          🖨️ Print / Save as PDF
        </button>
      </div>
    </div>
  );
}
