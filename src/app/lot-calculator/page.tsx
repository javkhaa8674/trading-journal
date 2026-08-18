"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    RemoteCalc?: (config: Record<string, unknown>) => void;
  }
}

const WIDGET_ID = "position-size-calculator-191876";

export default function ChartPage() {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let themeObserver: MutationObserver | null = null;
    let symbolObserver: MutationObserver | null = null;

    // ============================================================
    // FIND AND SELECT XAU/USD
    // ============================================================

    const selectXAUUSD = (): boolean => {
      if (cancelled) return false;

      const xauRow = document.querySelector(
        '#primary .item-row[data-ticker="IC Markets:XAUUSD"]',
      ) as HTMLElement | null;

      if (!xauRow) {
        return false;
      }

      console.log(
        "%c[FxVerify] XAU/USD found",
        "color: #22c55e; font-weight: bold;",
      );

      xauRow.click();

      return true;
    };

    // ============================================================
    // OPEN SYMBOL SEARCH
    // ============================================================

    const openSymbolSearch = (): boolean => {
      if (cancelled) return false;

      /*
       * FxVerify/TradingView-style widget дээр EUR/USD гэсэн
       * symbol selector-ийг хайна.
       */

      const elements = Array.from(
        document.querySelectorAll<HTMLElement>(
          "#primary button, #primary div, #primary span",
        ),
      );

      const eurElement = elements.find((element) => {
        const text = element.textContent?.trim();

        return text === "EUR/USD";
      });

      if (!eurElement) {
        return false;
      }

      console.log(
        "%c[FxVerify] EUR/USD selector found",
        "color: #3b82f6; font-weight: bold;",
      );

      eurElement.click();

      return true;
    };

    // ============================================================
    // INITIALIZE XAUUSD
    // ============================================================

    const initializeXAUUSD = () => {
      if (cancelled) return;

      /*
       * Эхлээд XAU/USD modal аль хэдийн нээгдсэн эсэхийг шалгана.
       */
      if (selectXAUUSD()) {
        symbolObserver?.disconnect();
        return;
      }

      /*
       * Modal байхгүй бол EUR/USD selector дээр дарж modal нээнэ.
       */
      openSymbolSearch();

      /*
       * Modal үүссэний дараа XAU/USD мөрийг дахин хайна.
       */
      let attempts = 0;

      const retry = () => {
        if (cancelled) return;

        attempts++;

        if (selectXAUUSD()) {
          return;
        }

        if (attempts < 100) {
          window.setTimeout(retry, 100);
        }
      };

      retry();
    };

    // ============================================================
    // RENDER FXVERIFY WIDGET
    // ============================================================

    const renderWidget = () => {
      if (cancelled || !widgetRef.current) return;

      const isDark = document.documentElement.classList.contains("dark");

      /*
       * Өмнөх widget-ийг цэвэрлэнэ.
       */
      widgetRef.current.innerHTML = "";

      /*
       * Хуучин symbol observer-ийг устгана.
       */
      symbolObserver?.disconnect();

      // ============================================================
      // FXVERIFY SCRIPT
      // ============================================================

      const script = document.createElement("script");

      script.type = "text/javascript";
      script.src = "https://fxverify.com/Content/remote/remote-widgets.js";

      script.onload = () => {
        if (cancelled || !widgetRef.current || !window.RemoteCalc) {
          return;
        }

        // ========================================================
        // REMOTE CALCULATOR
        // ========================================================

        window.RemoteCalc({
          Url: "https://fxverify.com",

          // ------------------------------------------------------
          // TOP PANE
          // ------------------------------------------------------

          TopPaneStyle: btoa(
            isDark
              ? `
                background: #111827;
                color: #f9fafb;
                border: solid 1px #374151;
                border-bottom: none;
              `
              : `
                background: linear-gradient(
                  #ffffff 20%,
                  #f5f5f5 45%
                );
                color: #000000;
                border: solid 1px #aaaaaa;
                border-bottom: none;
              `,
          ),

          // ------------------------------------------------------
          // BOTTOM PANE
          // ------------------------------------------------------

          BottomPaneStyle: btoa(
            isDark
              ? `
                background: #030712;
                border: solid 1px #374151;
                color: #f9fafb;
              `
              : `
                background: #f3f3f3;
                border: solid 1px #aaaaaa;
                color: #000000;
              `,
          ),

          // ------------------------------------------------------
          // BUTTON
          // ------------------------------------------------------

          ButtonStyle: btoa(
            isDark
              ? `
                background: #2563eb;
                color: #ffffff;
                border-radius: 20px;
              `
              : `
                background: #343540;
                color: #ffffff;
                border-radius: 20px;
              `,
          ),

          // ------------------------------------------------------
          // TITLE
          // ------------------------------------------------------

          TitleStyle: btoa(
            isDark
              ? `
                text-align: left;
                font-size: 40px;
                font-weight: 500;
                color: #f9fafb;
              `
              : `
                text-align: left;
                font-size: 40px;
                font-weight: 500;
                color: #111827;
              `,
          ),

          // ------------------------------------------------------
          // TEXTBOX
          // ------------------------------------------------------

          TextboxStyle: btoa(
            isDark
              ? `
                background-color: #111827;
                color: #f9fafb;
                border: solid 1px #4b5563;
              `
              : `
                background-color: #ffffff;
                color: #000000;
                border: solid 1px #aaaaaa;
              `,
          ),

          // ------------------------------------------------------
          // GENERAL
          // ------------------------------------------------------

          ContainerWidth: "665",

          HighlightColor: isDark ? "#854d0e" : "#ffff00",

          IsDisplayTitle: false,
          IsShowChartLinks: true,
          IsShowEmbedButton: true,

          CompactType: "large",

          Calculator: "position-size-calculator",

          ContainerId: WIDGET_ID,
        });

        // ========================================================
        // WAIT FOR FXVERIFY DOM
        // ========================================================

        let initialized = false;

        const tryInitialize = () => {
          if (cancelled || initialized) return;

          /*
           * XAU/USD аль хэдийн гарсан байвал шууд сонгоно.
           */
          if (selectXAUUSD()) {
            initialized = true;
            symbolObserver?.disconnect();
            return;
          }

          /*
           * Эхлээд symbol search нээнэ.
           */
          openSymbolSearch();

          /*
           * XAU/USD мөрийг дахин хайна.
           */
          const selected = selectXAUUSD();

          if (selected) {
            initialized = true;
            symbolObserver?.disconnect();
          }
        };

        /*
         * Widget DOM-оо үүсгэж дуусах хүртэл ажиглана.
         */
        symbolObserver = new MutationObserver(() => {
          if (initialized || cancelled) return;

          const xauRow = document.querySelector(
            '#primary .item-row[data-ticker="IC Markets:XAUUSD"]',
          );

          if (xauRow) {
            console.log(
              "%c[FxVerify] Automatically selecting XAU/USD",
              "color: #22c55e; font-weight: bold;",
            );

            selectXAUUSD();

            initialized = true;
            symbolObserver?.disconnect();
          }
        });

        symbolObserver.observe(document.body, {
          childList: true,
          subtree: true,
        });

        /*
         * Initial attempt.
         */
        window.setTimeout(tryInitialize, 500);

        /*
         * Зарим үед FxVerify symbol selector DOM дээр
         * гарч ирэх хүртэл арай удаан байдаг.
         */
        window.setTimeout(tryInitialize, 1000);
        window.setTimeout(tryInitialize, 2000);
        window.setTimeout(tryInitialize, 3000);
      };

      script.onerror = () => {
        console.error("[FxVerify] Failed to load remote-widgets.js");
      };

      widgetRef.current.appendChild(script);
    };

    // ============================================================
    // INITIAL RENDER
    // ============================================================

    renderWidget();

    // ============================================================
    // DARK / LIGHT MODE
    // ============================================================

    themeObserver = new MutationObserver(() => {
      if (cancelled) return;

      /*
       * html class:
       *
       * <html class="dark">
       *
       * өөрчлөгдөх үед widget-ийг дахин үүсгэнэ.
       */

      renderWidget();
    });

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // ============================================================
    // CLEANUP
    // ============================================================

    return () => {
      cancelled = true;

      symbolObserver?.disconnect();
      themeObserver?.disconnect();

      if (widgetRef.current) {
        widgetRef.current.innerHTML = "";
      }
    };
  }, []);

  // ==============================================================
  // PAGE
  // ==============================================================

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-950">
      <main className="flex min-h-screen w-full items-start justify-center overflow-auto p-4">
        <div ref={widgetRef} id={WIDGET_ID} className="w-full max-w-[665px]" />
      </main>
    </div>
  );
}
