// app/(app)/trading-plan/page.tsx
"use client";

import { useState } from "react";

type Section = {
  id: string;
  title: string;
  content: React.ReactNode;
  icon: string;
};

export default function TradingPlanPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["strategy", "risk-management", "key-processes"]),
  );

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const sections: Section[] = [
    {
      id: "strategy",
      title: "📈 1. Стратеги (Strategy)",
      icon: "📈",
      content: (
        <div className="space-y-4">
          {/* Step 1 */}
          <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-950/20">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300">
              Алхам 1: Зах зээлийн бүтэц ба чиглэл (Market Structure & Trend)
            </h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>
                Өдөр тутмын (<span className="font-mono">Daily, D1</span>) болон
                4 цагийн (<span className="font-mono">4H, H4</span>) графикаас
                зах зээлийн <strong>бүтэц ба чиглэлийг тодорхойлно</strong>.
              </li>
              <li>
                <strong>Чиглэлтэйгээ нийцсэн (in line with trend)</strong>{" "}
                арилжааг илүү өндөр магадлалтай гэж үзнэ.
              </li>
              <li>
                H4 болон H1-г ашиглан бүтцээ{" "}
                <strong>нарийвчлан тодорхойлж (refined structure)</strong>,
                өмнөх түвшин, mitigation-ийг санаж, одоогийн үнийн байршлыг
                ойлгоно.
              </li>
            </ul>
          </div>

          {/* Step 2 */}
          <div className="rounded-lg border-l-4 border-purple-500 bg-purple-50 p-4 dark:bg-purple-950/20">
            <h4 className="font-semibold text-purple-800 dark:text-purple-300">
              Алхам 2: Сонирхолтой бүс (Points of Interest, POI)
            </h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>
                Одоогийн тренд дотор <strong>imbalanced supply/demand</strong>{" "}
                бүсийг хайж, үнэ татах боломжтой бүсийг тодорхойлно.
              </li>
              <li>
                Өмнөх ёроолуудаас "<strong>liquidity sweep</strong>" хийх
                боломжтой бүсийг ч анхаарна.
              </li>
              <li className="mt-2 font-medium">
                Хүчинтэй эсэх POI-ийн шалгуур:
              </li>
              <ul className="ml-6 list-inside list-circle space-y-1">
                <li>
                  ✓ Одоогийн тренд дотор байрлах supply/demand бүс байгаа эсэх
                </li>
                <li>
                  ✓ <strong>Premium</strong> эсвэл <strong>discount</strong>{" "}
                  дээр (50%-ийн retracement-ээс дээш/доош) буюу{" "}
                  <strong>discount</strong> бүс дээр байгаа эсэх
                </li>
                <li>
                  ✓ Бүтэц дотор{" "}
                  <strong>imbalance үүсгэсэн (created imbalance)</strong> эсэх
                </li>
                <li>
                  ✓ Supply-бүсийн доор, эсвэл demand-бүсийн дээр{" "}
                  <strong>liquidity</strong> байгаа эсэх
                </li>
              </ul>
              <li className="mt-2 text-gray-500">
                <strong>Тэмдэглэл:</strong> Хэрэв үнэ хурдтай хөдөлж байвал{" "}
                <strong>high momentum</strong>-тэй учраас таны том цагийн POI-д
                хүрэхгүй байх магадлалтай. Ийм тохиолдолд{" "}
                <strong>доод хугацааны график (lower timeframes)</strong>
                ашиглан бүтцээ нарийвчлан харах.
              </li>
            </ul>
          </div>

          {/* Step 3 */}
          <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-4 dark:bg-green-950/20">
            <h4 className="font-semibold text-green-800 dark:text-green-300">
              Алхам 3: Оруулах цэг (Entry Setup, M5)
            </h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>
                Үнэ POI-д хүрсний дараа <strong>M5 график</strong> дээр шилжиж,
                зах зээлийн бүтцийг <strong>тодорхойлно</strong>.
              </li>
              <li>
                <strong>CHoCH (Change of Character)</strong>-г хүлээнэ:
                <ul className="ml-6 mt-1 list-inside list-circle">
                  <li>
                    Одоогийн <strong>higher low</strong> хаагдах (wick
                    тооцохгүй)
                  </li>
                  <li>
                    Одоогийн <strong>lower high</strong> хаагдах
                  </li>
                </ul>
              </li>
              <li>
                M5 дээрх <strong>imbalanced supply/demand areas</strong>-ийг
                тодорхойлно.
              </li>
              <li>
                Эдгээр бүсэд <strong>limit order</strong> тавина.
              </li>
              <li>
                <strong className="text-blue-600">
                  Процессийг механик байлгаж, илүү их бодохгүй байх.
                </strong>
              </li>
            </ul>
          </div>

          {/* Step 4 */}
          <div className="rounded-lg border-l-4 border-orange-500 bg-orange-50 p-4 dark:bg-orange-950/20">
            <h4 className="font-semibold text-orange-800 dark:text-orange-300">
              Алхам 4: SL &amp; TP (Stop Loss &amp; Take Profit)
            </h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>
                <strong>SL:</strong> CHoCH-ийн өмнөх <strong>high/low</strong>
                -оос хэдэн pip-ийн зайтай байрлуулна.
              </li>
              <li>
                <strong>TP:</strong>
                <ul className="ml-6 mt-1 list-inside list-circle">
                  <li>
                    Хүрэх цэг илэрхий тодорхой биш байвал{" "}
                    <strong>mechanical 1:3 R:R</strong>
                  </li>
                  <li>
                    Өмнөх <strong>liquidity zones</strong>, хамгийн багадаа{" "}
                    <strong>1:3 R:R</strong>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "risk-management",
      title: "⚖️ 2. Эрсдэлийн удирдлага (Risk Management)",
      icon: "⚖️",
      content: (
        <div className="space-y-4">
          {/* Live Accounts */}
          <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-4 dark:bg-green-950/20">
            <h4 className="font-semibold text-green-800 dark:text-green-300">
              💰 Live дансууд (Live Accounts)
            </h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>
                <strong>1% эрсдэл (risk)</strong> нэг арилжаанд
              </li>
              <li>
                Сэтгэл хөдлөлөөс үл хамааран <strong>consistent risk</strong>
              </li>
              <li>
                <strong>No breakeven, no partials</strong> – SL эсвэл TP хүртэл
                барих
              </li>
              <li>
                <strong>1:3 mechanical TP</strong> дүрэм дагах
              </li>
            </ul>
          </div>

          {/* Funded Accounts */}
          <div className="rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-950/20">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">
              🏆 Funded дансууд
            </h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>
                <strong>1-р шат:</strong> 2% эрсдэл
              </li>
              <li>
                <strong>2-р шат:</strong> 1% эрсдэл
              </li>
              <li>
                <strong>Live funded:</strong> 1% эрсдэл (secure refund first)
              </li>
            </ul>
          </div>

          {/* Scaling Rule */}
          <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-950/20">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300">
              📈 Дансны хэмжээг өсгөх дүрэм (Scaling Rule)
            </h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>
                Дараагийн challenge-г зөвхөн <strong>≥3x challenge fee</strong>{" "}
                орсон тохиолдолд авна.
              </li>
              <li className="mt-2 rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
                <strong>Жишээ:</strong> Challenge төлбөр: $75, Ашиг хуваах
                хэмжээ: 95% (30 хоногт 1 удаа татах) <br />→ Дараагийн challenge
                авахдаа ≥ $225-с дээш ашиг орсон байх <br />→ Ингэснээр{" "}
                <strong>risk:reward ≥1:3</strong> хадгалагдана.
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "key-processes",
      title: "📝 3. Гол процессууд (Key Processes)",
      icon: "📝",
      content: (
        <div className="space-y-4">
          {/* Trade Journaling */}
          <div className="rounded-lg border-l-4 border-purple-500 bg-purple-50 p-4 dark:bg-purple-950/20">
            <h4 className="font-semibold text-purple-800 dark:text-purple-300">
              📓 Арилжааны дэвтэр (Trade Journaling)
            </h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>
                Бүх арилжааг <strong>Trading Journal</strong>, -д тэмдэглэнэ.
              </li>
              <li className="mt-2 font-medium">Өдөр бүр:</li>
              <ul className="ml-6 list-inside list-circle space-y-1">
                <li>Price action recap</li>
                <li>
                  Алдаатай буюу авалгүй өнгөрсөн <strong>valid setups</strong>
                </li>
                <li>
                  <strong>Technical overview</strong> +{" "}
                  <strong>psychology notes</strong>
                </li>
                <li>
                  Алдаж орхисон арилжаа:{" "}
                  <strong>reason under psychology</strong> тэмдэглэх
                </li>
              </ul>
            </ul>
          </div>

          {/* Weekly/Monthly/Quarterly ASR */}
          <div className="rounded-lg border-l-4 border-indigo-500 bg-indigo-50 p-4 dark:bg-indigo-950/20">
            <h4 className="font-semibold text-indigo-800 dark:text-indigo-300">
              📊 Weekly/Monthly/Quarterly ASR (Analyze, Summarize, Review)
            </h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>
                <strong>Өөрийн зохиосон загвар</strong> ашиглах
              </li>
              <li>
                Өмнөх хугацааг <strong>backtest</strong> хийх
                (week/month/quarter)
                <ul className="ml-6 mt-1 list-inside list-circle">
                  <li>
                    <strong>Rewind price</strong> ба бар бүрээр судлах
                  </li>
                  <li>Алдаатай арилжаа, bias шалгах</li>
                  <li>Алдаж орхисон арилжааг template-д тэмдэглэх</li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">📋 Trading Plan</h1>
          <p className="text-sm text-gray-500">
            My personal trading strategy, risk management rules, and key
            processes
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const allIds = sections.map((s) => s.id);
              setExpandedSections(new Set(allIds));
            }}
            className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
          >
            Expand All
          </button>
          <button
            onClick={() => setExpandedSections(new Set())}
            className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <div
            key={section.id}
            className="overflow-hidden rounded-lg border bg-white dark:bg-gray-900"
          >
            <button
              onClick={() => toggleSection(section.id)}
              className="flex w-full items-center justify-between p-4 text-left font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <span className="text-lg">{section.title}</span>
              <span className="text-xl">
                {expandedSections.has(section.id) ? "▼" : "▶"}
              </span>
            </button>
            {expandedSections.has(section.id) && (
              <div className="border-t p-4">{section.content}</div>
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

      {/* PDF Export Button (Optional) */}
      <div className="flex justify-end">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
        >
          🖨️ Print / Save as PDF
        </button>
      </div>
    </div>
  );
}
