"use client";

// icon added
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";
import TradeList from "@/app/components/trades/TradeList";
import { getStatusIcon } from "@/lib/utils/statusUtils";
import { TradingChart } from "@/app/components/chart/TradingChart";
import { useTrades } from "@/lib/hooks/useTrades";

type Account = {
  id: string;
  name: string;
  status: string;
  balance: number;
};

type AccountStatus = "active" | "achieved" | "closed";

export default function TradesPage() {
  const router = useRouter();

  const [accounts, setAccounts] = useState<Account[]>([]);

  /*
   * Account status tab
   *
   * Active / Achieved / Closed
   */
  const [activeTab, setActiveTab] = useState<AccountStatus>("active");

  /*
   * Сонгогдсон account
   */
  const [activeAccount, setActiveAccount] = useState<string | null>(null);

  const [showChart, setShowChart] = useState(true);

  /*
   * TradeList дээрээс Chart товч дарахад
   * тухайн trade-ийн ID энд хадгалагдана.
   */
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);

  /*
   * Chart хэсэг рүү scroll хийхэд ашиглана.
   */
  const chartSectionRef = useRef<HTMLDivElement>(null);

  const { trades, loading, error, deleteTrade, refresh } = useTrades(
    activeAccount || undefined,
  );

  /* =====================================================
     LOAD ACCOUNTS
  ===================================================== */

  useEffect(() => {
    const loadAccounts = async () => {
      const user = await getCurrentUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("accounts")
        .select("id, name, balance, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      const loadedAccounts = data || [];

      setAccounts(loadedAccounts);

      /*
       * Default:
       * Active tab дээрх эхний account-ийг сонгоно.
       */
      const activeAccounts = loadedAccounts.filter(
        (acc) => acc.status === "active",
      );

      if (activeAccounts.length > 0) {
        setActiveTab("active");
        setActiveAccount(activeAccounts[0].id);
      } else {
        /*
         * Active account байхгүй бол
         * хамгийн эхний боломжтой status/account-ийг сонгоно.
         */
        const firstAccount = loadedAccounts[0];

        if (firstAccount) {
          const status = getValidAccountStatus(firstAccount.status);

          setActiveTab(status);
          setActiveAccount(firstAccount.id);
        } else {
          setActiveAccount(null);
        }
      }
    };

    loadAccounts();
  }, [router]);

  /* =====================================================
     ACCOUNT STATUS HELPERS
  ===================================================== */

  const getValidAccountStatus = (status: string): AccountStatus => {
    if (status === "achieved") return "achieved";
    if (status === "closed") return "closed";

    return "active";
  };

  /*
   * Одоогийн tab-ийн account-ууд
   */
  const filteredAccounts = accounts.filter(
    (account) => account.status === activeTab,
  );

  /*
   * Status тус бүрийн account count
   */
  const activeAccounts = accounts.filter(
    (account) => account.status === "active",
  );

  const achievedAccounts = accounts.filter(
    (account) => account.status === "achieved",
  );

  const closedAccounts = accounts.filter(
    (account) => account.status === "closed",
  );

  /* =====================================================
     TAB CHANGE
  ===================================================== */

  const handleTabChange = (tab: AccountStatus) => {
    setActiveTab(tab);

    /*
     * Сонгогдсон account шинэ tab-д хамаарч байгаа эсэхийг шалгана.
     */
    const accountsForTab = accounts.filter((account) => account.status === tab);

    /*
     * Шинэ tab хоосон бол account selection-ийг цэвэрлэнэ.
     */
    if (accountsForTab.length === 0) {
      setActiveAccount(null);
      setSelectedTradeId(null);
      return;
    }

    /*
     * Одоогийн account шинэ tab-д байгаа бол
     * selection-ийг хэвээр үлдээнэ.
     */
    const currentAccountExists = accountsForTab.some(
      (account) => account.id === activeAccount,
    );

    if (currentAccountExists) {
      return;
    }

    /*
     * Байхгүй бол тухайн tab-ийн эхний account-ийг сонгоно.
     */
    setActiveAccount(accountsForTab[0].id);

    /*
     * Өмнөх trade selection-ийг цэвэрлэнэ.
     */
    setSelectedTradeId(null);
  };

  /* =====================================================
     ACCOUNT CHANGE
  ===================================================== */

  const handleAccountChange = (value: string) => {
    setActiveAccount(value);

    /*
     * Account солигдоход өмнөх
     * selected trade-ийг арилгана.
     */
    setSelectedTradeId(null);
  };

  /* =====================================================
     CHART TRADE
  ===================================================== */

  const handleChartTrade = (tradeId: string) => {
    /*
     * Chart-ийг нээх
     */
    setShowChart(true);

    /*
     * Яг сонгосон trade
     */
    setSelectedTradeId(tradeId);

    /*
     * React state update хийсний
     * дараа chart хэсэг рүү scroll хийнэ.
     */
    requestAnimationFrame(() => {
      chartSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  /* =====================================================
     DELETE TRADE
  ===================================================== */

  const handleDeleteTrade = async (tradeId: string) => {
    await deleteTrade(tradeId);

    /*
     * Хэрэв chart дээр
     * устгасан trade байсан бол
     * selection-ийг цэвэрлэнэ.
     */
    if (selectedTradeId === tradeId) {
      setSelectedTradeId(null);
    }
  };

  /* =====================================================
     DELETE MULTIPLE
  ===================================================== */

  const handleDeleteTrades = async (tradeIds: string[]) => {
    for (const id of tradeIds) {
      await deleteTrade(id);
    }

    if (selectedTradeId && tradeIds.includes(selectedTradeId)) {
      setSelectedTradeId(null);
    }
  };

  /* =====================================================
     EDIT TRADE
  ===================================================== */

  const editTrade = (tradeId: string) => {
    router.push(`/trades/${tradeId}`);
  };

  const reviewTrade = (tradeId: string) => {
    router.push(`/trades/${tradeId}/review`);
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading && accounts.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-2xl">📊</div>

          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </div>
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="space-y-4">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl sm:text-2xl font-bold">📊 Арилжаанууд</h1>

            {/* Chart Toggle Button */}

            <button
              onClick={() => setShowChart(!showChart)}
              className="
                px-3 py-1.5
                text-sm
                rounded-lg
                transition-colors
                flex items-center gap-1.5

                bg-gray-100
                hover:bg-gray-200
                text-gray-700
                border border-gray-300

                dark:bg-gray-700
                dark:hover:bg-gray-600
                dark:text-gray-200
                dark:border-gray-600
              "
              title={showChart ? "Chart нуух" : "Chart харуулах"}
            >
              {showChart ? (
                <>
                  {/* Eye open */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </>
              ) : (
                <>
                  {/* Eye closed */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m3 3 18 18" />
                    <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                    <path d="M9.88 4.24A10.75 10.75 0 0 1 21.94 11.65a1 1 0 0 1 0 .7 10.75 10.75 0 0 1-4.12 5.14" />
                    <path d="M6.61 6.61A10.75 10.75 0 0 0 2.06 11.65a1 1 0 0 0 0 .7 10.75 10.75 0 0 0 5.28 5.07A10.75 10.75 0 0 0 12 18c.91 0 1.8-.11 2.65-.32" />
                  </svg>
                </>
              )}
            </button>

            {/* Refresh Button */}

            <button
              onClick={refresh}
              className="
                px-3 py-1.5
                text-sm
                rounded-lg
                transition-colors
                flex items-center gap-1.5

                bg-gray-100
                hover:bg-gray-200
                text-gray-700
                border border-gray-300

                dark:bg-gray-700
                dark:hover:bg-gray-600
                dark:text-gray-200
                dark:border-gray-600
              "
              title="Refresh"
            >
              {/* Refresh */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 0 0-15.3-6.4L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 15.3 6.4L21 16" />
                <path d="M21 21v-5h-5" />
              </svg>
            </button>
          </div>

          {/* Account Filter */}

          <select
            value={activeAccount || ""}
            onChange={(e) => handleAccountChange(e.target.value)}
            disabled={filteredAccounts.length === 0}
            className="
              rounded-lg
              border
              px-3
              py-2
              text-sm
              w-full
              sm:w-auto
              bg-white
              dark:bg-gray-800
              dark:border-gray-700
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            {filteredAccounts.length === 0 ? (
              <option value="">Энэ хэсэгт account байхгүй</option>
            ) : (
              filteredAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {getStatusIcon(account.status)} {account.name} - $
                  {account.balance.toLocaleString()}
                </option>
              ))
            )}
          </select>
        </div>

        {/* =================================================
            ACCOUNT STATUS TABS
        ================================================= */}

        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav
            className="
              -mb-px
              flex
              space-x-4
              sm:space-x-8
              min-w-max
            "
            aria-label="Account status tabs"
          >
            {/* ACTIVE */}

            <button
              onClick={() => handleTabChange("active")}
              className={`
                whitespace-nowrap
                border-b-2
                py-2
                px-1
                text-xs
                sm:text-sm
                font-medium
                transition-colors

                ${
                  activeTab === "active"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }
              `}
            >
              Active
              <span
                className="
                  ml-1.5
                  sm:ml-2
                  rounded-full
                  bg-gray-100
                  px-1.5
                  py-0.5
                  text-xs
                  text-gray-600
                  dark:bg-gray-800
                  dark:text-gray-300
                "
              >
                {activeAccounts.length}
              </span>
            </button>

            {/* ACHIEVED */}

            <button
              onClick={() => handleTabChange("achieved")}
              className={`
                whitespace-nowrap
                border-b-2
                py-2
                px-1
                text-xs
                sm:text-sm
                font-medium
                transition-colors

                ${
                  activeTab === "achieved"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }
              `}
            >
              Achieved
              <span
                className="
                  ml-1.5
                  sm:ml-2
                  rounded-full
                  bg-gray-100
                  px-1.5
                  py-0.5
                  text-xs
                  text-gray-600
                  dark:bg-gray-800
                  dark:text-gray-300
                "
              >
                {achievedAccounts.length}
              </span>
            </button>

            {/* CLOSED */}

            <button
              onClick={() => handleTabChange("closed")}
              className={`
                whitespace-nowrap
                border-b-2
                py-2
                px-1
                text-xs
                sm:text-sm
                font-medium
                transition-colors

                ${
                  activeTab === "closed"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }
              `}
            >
              Closed
              <span
                className="
                  ml-1.5
                  sm:ml-2
                  rounded-full
                  bg-gray-100
                  px-1.5
                  py-0.5
                  text-xs
                  text-gray-600
                  dark:bg-gray-800
                  dark:text-gray-300
                "
              >
                {closedAccounts.length}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* =================================================
          CHART SECTION
      ================================================= */}

      {showChart && activeAccount && (
        <div
          ref={chartSectionRef}
          className="
            bg-gray-800/30
            rounded-xl
            border
            border-gray-700
            overflow-hidden
          "
        >
          <TradingChart
            trades={trades}
            loading={loading}
            selectedAccountId={activeAccount}
            selectedTradeId={selectedTradeId}
          />
        </div>
      )}

      {/* =================================================
          EMPTY ACCOUNT STATE
      ================================================= */}

      {!activeAccount && (
        <div
          className="
            flex
            flex-col
            items-center
            justify-center
            rounded-xl
            border-2
            border-dashed
            border-gray-300
            dark:border-gray-700
            p-10
            text-center
          "
        >
          <div className="mb-3 text-4xl">📭</div>

          <h3 className="text-base font-semibold">
            {activeTab === "active"
              ? "Active account байхгүй"
              : activeTab === "achieved"
                ? "Achieved account байхгүй"
                : "Closed account байхгүй"}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Энэ хэсэгт харуулах арилжаа байхгүй байна.
          </p>
        </div>
      )}

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
          Error: {error}
        </div>
      )}

      {/* =================================================
          TRADE LIST
      ================================================= */}

      {activeAccount && (
        <TradeList
          trades={trades.map((t) => ({
            ...t,
            open_time: t.open_time?.toString() || "",
            close_time: t.close_time?.toString() || "",
          }))}
          onDelete={handleDeleteTrades}
          onEdit={editTrade}
          onChart={handleChartTrade}
          onReview={reviewTrade}
        />
      )}
    </div>
  );
}
