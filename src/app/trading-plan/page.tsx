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
  strategy: `<div style="margin-bottom: 1rem;">
  <!-- Step 1 - Blue Box -->
  <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; --dark-mode-bg: rgba(59, 130, 246, 0.15);">
    <h4 style="color: #1E3A8A; font-weight: 600; margin: 0 0 0.5rem 0; --dark-mode-text: #ffffff;">
      Алхам 1: Зах зээлийн бүтэц ба чиглэл (Market Structure &amp; Trend)
    </h4>
    <ul style="margin: 0.5rem 0 0 1.5rem; padding-left: 0; list-style-type: disc;">
      <li style="margin: 0.25rem 0; color: #374151; --dark-mode-text: #d1d5db;">Өдөр тутмын (<span style="font-family: monospace;">Daily, D1</span>) болон 4 цагийн (<span style="font-family: monospace;">4H, H4</span>) графикаас зах зээлийн <strong>бүтэц ба чиглэлийг тодорхойлно</strong>.</li>
      <li style="margin: 0.25rem 0; color: #374151; --dark-mode-text: #d1d5db;"><strong>Чиглэлтэйгээ нийцсэн (in line with trend)</strong> арилжааг илүү өндөр магадлалтай гэж үзнэ.</li>
      <li style="margin: 0.25rem 0; color: #374151; --dark-mode-text: #d1d5db;">H4 болон H1-г ашиглан бүтцээ <strong>нарийвчлан тодорхойлж (refined structure)</strong>, өмнөх түвшин, mitigation-ийг санаж, одоогийн үнийн байршлыг ойлгоно.</li>
    </ul>
  </div>

  <!-- Step 2 - Purple Box -->
  <div style="background-color: #F5F3FF; border-left: 4px solid #8B5CF6; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; --dark-mode-bg: rgba(139, 92, 246, 0.15);">
    <h4 style="color: #4C1D95; font-weight: 600; margin: 0 0 0.5rem 0; --dark-mode-text: #ffffff;">
      Алхам 2: Сонирхолтой бүс (Points of Interest, POI)
    </h4>
    <ul style="margin: 0.5rem 0 0 1.5rem; padding-left: 0; list-style-type: disc;">
      <li style="margin: 0.25rem 0; color: #374151; --dark-mode-text: #d1d5db;">Одоогийн тренд дотор <strong>imbalanced supply/demand</strong> бүсийг хайж, үнэ татах боломжтой бүсийг тодорхойлно.</li>
      <li style="margin: 0.25rem 0; color: #374151; --dark-mode-text: #d1d5db;">Өмнөх ёроолуудаас "<strong>liquidity sweep</strong>" хийх боломжтой бүсийг ч анхаарна.</li>
      <li style="margin: 0.5rem 0 0 0; font-weight: 500; --dark-mode-text: #d1d5db;">Хүчинтэй эсэх POI-ийн шалгуур:</li>
      <ul style="margin: 0.25rem 0 0 1.5rem; padding-left: 0; list-style-type: circle;">
        <li style="margin: 0.25rem 0; color: #374151; --dark-mode-text: #d1d5db;">✓ Одоогийн тренд дотор байрлах supply/demand бүс байгаа эсэх</li>
        <li style="margin: 0.25rem 0; color: #374151; --dark-mode-text: #d1d5db;">✓ <strong>Premium</strong> эсвэл <strong>discount</strong> дээр (50%-ийн retracement-ээс дээш/доош)</li>
        <li style="margin: 0.25rem 0; color: #374151; --dark-mode-text: #d1d5db;">✓ Бүтэц дотор <strong>imbalance үүсгэсэн (created imbalance)</strong> эсэх</li>
        <li style="margin: 0.25rem 0; color: #374151; --dark-mode-text: #d1d5db;">✓ Supply-бүсийн доор, эсвэл demand-бүсийн дээр <strong>liquidity</strong> байгаа эсэх</li>
      </ul>
      <li style="margin: 0.5rem 0 0 0; color: #6B7280; --dark-mode-text: #9ca3af;"><strong>Тэмдэглэл:</strong> Хэрэв үнэ хурдтай хөдөлж байвал <strong>high momentum</strong>-тэй учраас таны том цагийн POI-д хүрэхгүй байх магадлалтай. Ийм тохиолдолд <strong>доод хугацааны график (lower timeframes)</strong> ашиглан бүтцээ нарийвчлан харах.</li>
    </ul>
  </div>

  <!-- Step 3 - Green Box -->
  <div style="background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; --dark-mode-bg: rgba(16, 185, 129, 0.15);">
    <h4 style="color: #065F46; font-weight: 600; margin: 0 0 0.5rem 0; --dark-mode-text: #ffffff;">
      Алхам 3: Оруулах цэг (Entry Setup, M5)
    </h4>
    <ul style="margin: 0.5rem 0 0 1.5rem; padding-left: 0; list-style-type: disc;">
      <li style="margin: 0.25rem 0; color: #374151; --dark-mode-text: #d1d5db;">Үнэ POI-д хүрсний дараа <strong>M5 график</strong> дээр шилжиж, зах зээлийн бүтцийг <strong>тодорхойлно</strong>.</li>
      <li style="margin: 0.25rem 0; color: #374151; --dark-mode-text: #d1d5db;"><strong>CHoCH (Change of Character)</strong>-г хүлээнэ:
        <ul style="margin: 0.25rem 0 0 1.5rem; padding-left: 0; list-style-type: circle;">
          <li style="margin: 0.25rem 0; color: #374151; --dark-mode-text: #d1d5db;">Одоогийн <strong>higher low</strong> хаагдах (wick тооцохгүй)</li>
          <li style="margin: 0.25rem 0; color: #374151; --dark-mode-text: #d1d5db;">Одоогийн <strong>lower high</strong> хаагдах</li>
        </ul>
      </li>
      <li style="margin: 0.25rem 0; color: #374151; --dark-mode-text: #d1d5db;">M5 дээрх <strong>imbalanced supply/demand areas</strong>-ийг тодорхойлно.</li>
      <li style="margin: 0.25rem 0; color: #374151; --dark-mode-text: #d1d5db;">Эдгээр бүсэд <strong>limit order</strong> тавина.</li>
      <li style="margin: 0.25rem 0; color: #374151; --dark-mode-text: #d1d5db;"><strong style="color: #2563EB;">Процессийг механик байлгаж, илүү их бодохгүй байх.</strong></li>
    </ul>
  </div>

  <!-- Step 4 - Orange Box -->
  <div style="background-color: #FFF7ED; border-left: 4px solid #F97316; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; --dark-mode-bg: rgba(249, 115, 22, 0.15);">
    <h4 style="color: #9A3412; font-weight: 600; margin: 0 0 0.5rem 0; --dark-mode-text: #ffffff;">
      Алхам 4: SL &amp; TP (Stop Loss &amp; Take Profit)
    </h4>
    <ul style="margin: 0.5rem 0 0 1.5rem; padding-left: 0; list-style-type: disc;">
      <li style="margin: 0.25rem 0; color: #374151; --dark-mode-text: #d1d5db;"><strong>SL:</strong> CHoCH-ийн өмнөх <strong>high/low</strong>-оос хэдэн pip-ийн зайтай байрлуулна.</li>
      <li style="margin: 0.25rem 0; color: #374151; --dark-mode-text: #d1d5db;"><strong>TP:</strong>
        <ul style="margin: 0.25rem 0 0 1.5rem; padding-left: 0; list-style-type: circle;">
          <li style="margin: 0.25rem 0; color: #374151; --dark-mode-text: #d1d5db;">Хүрэх цэг илэрхий тодорхой биш байвал <strong>mechanical 1:3 R:R</strong></li>
          <li style="margin: 0.25rem 0; color: #374151; --dark-mode-text: #d1d5db;">Өмнөх <strong>liquidity zones</strong>, хамгийн багадаа <strong>1:3 R:R</strong></li>
        </ul>
      </li>
    </ul>
  </div>
</div>

<style>
  /* Dark mode styles - CSS variables approach */
  .dark div[style*="background-color: #EFF6FF"] {
    background-color: rgba(59, 130, 246, 0.15) !important;
  }
  .dark div[style*="background-color: #F5F3FF"] {
    background-color: rgba(139, 92, 246, 0.15) !important;
  }
  .dark div[style*="background-color: #ECFDF5"] {
    background-color: rgba(16, 185, 129, 0.15) !important;
  }
  .dark div[style*="background-color: #FFF7ED"] {
    background-color: rgba(249, 115, 22, 0.15) !important;
  }
  .dark h4[style*="color: #1E3A8A"],
  .dark h4[style*="color: #4C1D95"],
  .dark h4[style*="color: #065F46"],
  .dark h4[style*="color: #9A3412"] {
    color: #ffffff !important;
  }
  .dark li[style*="color: #374151"],
  .dark li[style*="color: #6B7280"] {
    color: #d1d5db !important;
  }
</style>`,
  risk_management: `<div style="margin-bottom: 1rem;">
  <!-- Live Accounts - Green Box -->
  <div style="background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
    <h4 style="color: #065F46; font-weight: 600; margin: 0 0 0.5rem 0;">
      💰 Live дансууд (Live Accounts)
    </h4>
    <ul style="margin: 0.5rem 0 0 1.5rem; padding-left: 0; list-style-type: disc;">
      <li style="margin: 0.25rem 0; color: #374151;"><strong>1% эрсдэл (risk)</strong> нэг арилжаанд</li>
      <li style="margin: 0.25rem 0; color: #374151;">Сэтгэл хөдлөлөөс үл хамааран <strong>consistent risk</strong></li>
      <li style="margin: 0.25rem 0; color: #374151;"><strong>No breakeven, no partials</strong> – SL эсвэл TP хүртэл барих</li>
      <li style="margin: 0.25rem 0; color: #374151;"><strong>1:3 mechanical TP</strong> дүрэм дагах</li>
    </ul>
  </div>

  <!-- Funded Accounts - Yellow Box -->
  <div style="background-color: #FEFCE8; border-left: 4px solid #EAB308; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
    <h4 style="color: #854D0E; font-weight: 600; margin: 0 0 0.5rem 0;">
      🏆 Funded дансууд
    </h4>
    <ul style="margin: 0.5rem 0 0 1.5rem; padding-left: 0; list-style-type: disc;">
      <li style="margin: 0.25rem 0; color: #374151;"><strong>1-р шат:</strong> 2% эрсдэл</li>
      <li style="margin: 0.25rem 0; color: #374151;"><strong>2-р шат:</strong> 1% эрсдэл</li>
      <li style="margin: 0.25rem 0; color: #374151;"><strong>Live funded:</strong> 1% эрсдэл (secure refund first)</li>
    </ul>
  </div>

  <!-- Scaling Rule - Blue Box -->
  <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
    <h4 style="color: #1E3A8A; font-weight: 600; margin: 0 0 0.5rem 0;">
      📈 Дансны хэмжээг өсгөх дүрэм (Scaling Rule)
    </h4>
    <ul style="margin: 0.5rem 0 0 1.5rem; padding-left: 0; list-style-type: disc;">
      <li style="margin: 0.25rem 0; color: #374151;">Дараагийн challenge-г зөвхөн <strong>≥3x challenge fee</strong> орсон тохиолдолд авна.</li>
      <li style="margin: 0.5rem 0 0 0; background-color: #F3F4F6; padding: 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; color: #374151;">
        <strong>Жишээ:</strong> Challenge төлбөр: $75, Ашиг хуваах хэмжээ: 95% (30 хоногт 1 удаа татах)<br/>
        → Дараагийн challenge авахдаа ≥ $225-с дээш ашиг орсон байх<br/>
        → Ингэснээр <strong>risk:reward ≥1:3</strong> хадгалагдана.
      </li>
    </ul>
  </div>
</div>

<style>
  /* Dark mode styles */
  .dark div[style*="background-color: #ECFDF5"] {
    background-color: rgba(16, 185, 129, 0.15) !important;
  }
  .dark div[style*="background-color: #FEFCE8"] {
    background-color: rgba(234, 179, 8, 0.15) !important;
  }
  .dark div[style*="background-color: #EFF6FF"] {
    background-color: rgba(59, 130, 246, 0.15) !important;
  }
  .dark h4[style*="color: #065F46"],
  .dark h4[style*="color: #854D0E"],
  .dark h4[style*="color: #1E3A8A"] {
    color: #ffffff !important;
  }
  .dark li[style*="color: #374151"] {
    color: #d1d5db !important;
  }
  .dark li[style*="background-color: #F3F4F6"] {
    background-color: rgba(55, 65, 81, 0.5) !important;
    color: #d1d5db !important;
  }
</style>`,
  key_processes: `<div style="margin-bottom: 1rem;">
  <!-- Trade Journaling - Purple Box -->
  <div style="background-color: #F5F3FF; border-left: 4px solid #8B5CF6; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
    <h4 style="color: #4C1D95; font-weight: 600; margin: 0 0 0.5rem 0;">
      📓 Арилжааны дэвтэр (Trade Journaling)
    </h4>
    <ul style="margin: 0.5rem 0 0 1.5rem; padding-left: 0; list-style-type: disc;">
      <li style="margin: 0.25rem 0; color: #374151;">Бүх арилжааг <strong>Trading Journal</strong> -д тэмдэглэнэ.</li>
      <li style="margin: 0.5rem 0 0 0; font-weight: 500; color: #374151;">Өдөр бүр:</li>
      <ul style="margin: 0.25rem 0 0 1.5rem; padding-left: 0; list-style-type: circle;">
        <li style="margin: 0.25rem 0; color: #374151;">Price action recap</li>
        <li style="margin: 0.25rem 0; color: #374151;">Алдаатай буюу авалгүй өнгөрсөн <strong>valid setups</strong></li>
        <li style="margin: 0.25rem 0; color: #374151;"><strong>Technical overview</strong> + <strong>psychology notes</strong></li>
        <li style="margin: 0.25rem 0; color: #374151;">Алдаж орхисон арилжаа: <strong>reason under psychology</strong> тэмдэглэх</li>
      </ul>
    </ul>
  </div>

  <!-- Weekly/Monthly/Quarterly ASR - Indigo Box -->
  <div style="background-color: #EEF2FF; border-left: 4px solid #6366F1; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
    <h4 style="color: #3730A3; font-weight: 600; margin: 0 0 0.5rem 0;">
      📊 Weekly/Monthly/Quarterly ASR (Analyze, Summarize, Review)
    </h4>
    <ul style="margin: 0.5rem 0 0 1.5rem; padding-left: 0; list-style-type: disc;">
      <li style="margin: 0.25rem 0; color: #374151;"><strong>Өөрийн зохиосон загвар</strong> ашиглах</li>
      <li style="margin: 0.25rem 0; color: #374151;">Өмнөх хугацааг <strong>backtest</strong> хийх (week/month/quarter)
        <ul style="margin: 0.25rem 0 0 1.5rem; padding-left: 0; list-style-type: circle;">
          <li style="margin: 0.25rem 0; color: #374151;"><strong>Rewind price</strong> ба бар бүрээр судлах</li>
          <li style="margin: 0.25rem 0; color: #374151;">Алдаатай арилжаа, bias шалгах</li>
          <li style="margin: 0.25rem 0; color: #374151;">Алдаж орхисон арилжааг template-д тэмдэглэх</li>
        </ul>
      </li>
    </ul>
  </div>
</div>

<style>
  /* Dark mode styles */
  .dark div[style*="background-color: #F5F3FF"] {
    background-color: rgba(139, 92, 246, 0.15) !important;
  }
  .dark div[style*="background-color: #EEF2FF"] {
    background-color: rgba(99, 102, 241, 0.15) !important;
  }
  .dark h4[style*="color: #4C1D95"],
  .dark h4[style*="color: #3730A3"] {
    color: #ffffff !important;
  }
  .dark li[style*="color: #374151"] {
    color: #d1d5db !important;
  }
</style>`,
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
    id: "risk_management",
    title: "⚖️ 2. Эрсдэлийн удирдлага (Risk Management)",
    icon: "⚖️",
    placeholder:
      "Enter your risk management rules...\n\n• 1% risk per trade\n• Consistent risk\n• No breakeven, no partials\n• 1:3 mechanical TP",
    defaultContent: defaultContents.risk_management,
  },
  {
    id: "key_processes",
    title: "📝 3. Гол процессууд (Key Processes)",
    icon: "📝",
    placeholder:
      "Enter your key processes...\n\n• Daily trade journaling\n• Weekly/Monthly ASR\n• Price action recap",
    defaultContent: defaultContents.key_processes,
  },
];

export default function TradingPlanPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [planData, setPlanData] = useState({
    strategy: defaultContents.strategy,
    risk_management: defaultContents.risk_management,
    key_processes: defaultContents.key_processes,
  });
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["strategy", "risk_management", "key_processes"]),
  );

  // Load user's trading plan
  useEffect(() => {
    const loadPlan = async () => {
      const user = await getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("trading_plans")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data && !error) {
        // ✅ Зөвхөн database-с ирсэн утгыг ашиглах, хоосон бол default-ийг ашиглах
        setPlanData({
          strategy:
            data.strategy && data.strategy.trim() !== ""
              ? data.strategy
              : defaultContents.strategy,
          risk_management:
            data.risk_management && data.risk_management.trim() !== ""
              ? data.risk_management
              : defaultContents.risk_management,
          key_processes:
            data.key_processes && data.key_processes.trim() !== ""
              ? data.key_processes
              : defaultContents.key_processes,
        });
      } else {
        // ✅ Хэрэв data байхгүй бол default утгуудыг ашиглах
        setPlanData({
          strategy: defaultContents.strategy,
          risk_management: defaultContents.risk_management,
          key_processes: defaultContents.key_processes,
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
        risk_management: planData.risk_management,
        key_processes: planData.key_processes,
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
    if (
      !html ||
      typeof html !== "string" ||
      html.trim() === "" ||
      html === "<p></p>"
    ) {
      return '<p class="text-gray-400 italic">No content yet. Click "Edit Plan" to add your content.</p>';
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
