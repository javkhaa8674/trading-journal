"use client";

import { useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useAccounts } from "@/lib/hooks/useAccounts";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { getStatusIcon } from "@/lib/utils/statusUtils";

type ParsedTrade = {
  symbol: string;
  type: string;
  entry_price: number;
  exit_price: number;
  lot_size: number;
  open_time: string;
  close_time: string;
  stop_loss: number;
  take_profit: number;
  profit: number;
};

type ValidationError = {
  row: number;
  line: string;
  errors: string[];
};

export default function TradeForm() {
  const accounts = useAccounts();
  const router = useRouter();

  const [accountId, setAccountId] = useState("");
  const [symbol, setSymbol] = useState("");
  const [type, setType] = useState("buy");
  const [entry, setEntry] = useState<string>("");
  const [exit, setExit] = useState<string>("");
  const [tp, setTp] = useState<string>("");
  const [sl, setSl] = useState<string>("");
  const [lot, setLot] = useState<string>("");

  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [profit, setProfit] = useState<string>("");

  // 📌 BULK INPUT STATE
  const [bulkText, setBulkText] = useState("");
  const [parsedTrades, setParsedTrades] = useState<ParsedTrade[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [showPreview, setShowPreview] = useState(false);

  // 📌 MT4/MT5 FORMAT STATE (бусад state-уудын хамт нэмэх)
  const [mt4Text, setMt4Text] = useState("");
  const [mt5Text, setMt5Text] = useState("");
  const [jforexText, setJforexText] = useState("");

  const [activeTab, setActiveTab] = useState<"jforex" | "mt4" | "mt5">("mt5");
  // -------------------------
  // SINGLE TRADE SUBMIT
  // -------------------------
  const handleSubmit = async () => {
    const user = await getCurrentUser();

    if (!user) return alert("Хэрэглэгч нэвтрээгүй байна");
    if (!accountId) return alert("Данс сонгоно уу");
    if (!symbol) return alert("Хослолын нэр оруулна уу");

    const { error } = await supabase.from("trades").insert({
      user_id: user.id,
      account_id: accountId,
      symbol,
      type,
      entry_price: parseFloat(entry),
      exit_price: parseFloat(exit),
      profit,
      stop_loss: sl === "" ? 0 : parseFloat(sl),
      take_profit: tp === "" ? 0 : parseFloat(tp),
      lot_size: lot === "" ? 0.1 : parseFloat(lot),
      open_time: openTime ? new Date(openTime) : new Date(),
      close_time: closeTime ? new Date(closeTime) : new Date(),
    });

    if (error) {
      console.log(error);
      alert("Арилжаа хадгалах үед алдаа гарлаа");
      return;
    }

    alert("Арилжаа амжилттай нэмэгдлээ!");

    setAccountId("");
    setSymbol("");
    setType("buy");
    setEntry("");
    setExit("");
    setSl("");
    setTp("");
    setLot("");
    setOpenTime("");
    setCloseTime("");
    setProfit("");

    router.replace("/trades");
  };

  // Numeric parse helper (truncate to 2 decimals)
  const truncateTo2Decimals = (num: number): number => {
    return Math.trunc(num * 100) / 100;
  };

  const cleanNumber = (value: string): string => {
    return value.replace(/\s/g, ""); // Бүх space-г арилгах
  };
  // 📌 MT4/MT5 ПАРСЕР (validationErrors-ийг handle хийсэн)
  // MT5 ПАРСЕР (Commission + Swap + Profit = Нийт ашиг)
  const parseMT5 = (
    text: string,
  ): { validTrades: ParsedTrade[]; errors: ValidationError[] } => {
    const lines = text.split("\n").filter((line) => line.trim().length > 0);
    const validTrades: ParsedTrade[] = [];
    const errors: ValidationError[] = [];

    lines.forEach((line, index) => {
      // Tab-ээр тусгаарлагдсан column-ууд
      const columns = line.split("\t").map((col) => col.trim());

      // Хүлээгдэж буй баганын тоо: 14 (таны жишээ мөрөөс хархад)
      if (columns.length < 14) {
        errors.push({
          row: index + 1,
          line,
          errors: [
            `14 багана хүлээгдэж байсан боловч ${columns.length} олдлоо`,
          ],
        });
        return;
      }

      try {
        const openTimeStr = columns[0]; // Time (Open)
        const ticket = columns[1]; // Ticket number (алгасах)
        const symbol = columns[2]; // Symbol
        const typeRaw = columns[3]; // Type ✅ ЗАССАН: columns[1] -> columns[3]
        const volume = parseFloat(columns[4]); // Volume
        const openPrice = parseFloat(cleanNumber(columns[5])); // Open Price (хоосон зайтай)
        const sl = parseFloat(cleanNumber(columns[6])) || 0; // S/L
        const tp = parseFloat(cleanNumber(columns[7])) || 0; // T/P
        const closeTimeStr = columns[8]; // Time (Close)
        const closePrice = parseFloat(cleanNumber(columns[9])); // Close Price
        const commissionRaw = columns[10]; // Commission ("-" байж болно)
        const swap = parseFloat(columns[11].replace(/\s/g, "")) || 0; // Swap
        const profit = parseFloat(columns[12].replace(/\s/g, "")) || 0; // Profit

        // Commission-ийг зөв парслах ("-" байвал 0)
        let commission = 0;
        if (commissionRaw !== "-" && commissionRaw !== "") {
          commission = parseFloat(commissionRaw.replace(/\s/g, "")) || 0;
        }

        // ✅ НИЙТ АШИГ = Commission + Swap + Profit
        let totalProfit = commission + swap + profit;
        totalProfit = truncateTo2Decimals(totalProfit);

        // Type шалгах
        let tradeType = "";
        if (typeRaw.toLowerCase() === "buy") tradeType = "buy";
        else if (typeRaw.toLowerCase() === "sell") tradeType = "sell";
        else {
          errors.push({
            row: index + 1,
            line,
            errors: [
              `Төрөл нь "buy" эсвэл "sell" байх ёстой. Олдсон: ${typeRaw}`,
            ],
          });
          return;
        }

        // Огноо формат шалгах (2026.05.14 16:49:33)
        const openDate = new Date(openTimeStr.replace(/\./g, "-"));
        const closeDate = new Date(closeTimeStr.replace(/\./g, "-"));

        if (isNaN(openDate.getTime())) {
          errors.push({
            row: index + 1,
            line,
            errors: [`Нээлтийн огнооны формат буруу: ${openTimeStr}`],
          });
          return;
        }

        if (isNaN(closeDate.getTime())) {
          errors.push({
            row: index + 1,
            line,
            errors: [`Хаалтын огнооны формат буруу: ${closeTimeStr}`],
          });
          return;
        }

        validTrades.push({
          symbol: symbol,
          type: tradeType,
          entry_price: openPrice,
          exit_price: closePrice,
          lot_size: volume,
          open_time: openTimeStr.replace(/\./g, "-"),
          close_time: closeTimeStr.replace(/\./g, "-"),
          stop_loss: sl,
          take_profit: tp,
          profit: totalProfit,
        });
      } catch (err) {
        errors.push({
          row: index + 1,
          line,
          errors: [`Өгөгдөл боловсруулахад алдаа гарлаа: ${err}`],
        });
      }
    });

    return { validTrades, errors };
  };

  // 📌 MT PREVIEW HANDLER (алдаануудыг setValidationErrors-ээр хадгална)
  const handleMt5Preview = () => {
    if (!mt5Text.trim()) {
      alert("MT5 History-с буулгасан арилжааны жагсаалтыг оруулна уу.");
      return;
    }

    const { validTrades, errors } = parseMT5(mt5Text);

    setParsedTrades(validTrades);
    setValidationErrors(errors);
    setShowPreview(true);

    if (errors.length > 0) {
      alert(
        `${errors.length} мөрөнд алдаа байна. Дэлгэрэнгүйг preview хэсгээс харна уу.`,
      );
    } else if (validTrades.length === 0) {
      alert("Хүчинтэй арилжаа олдсонгүй");
    } else {
      alert(`${validTrades.length} арилжаа амжилттай боловсруулагдлаа!`);
    }
  };

  // MT4 ПАРСЕР (Commission + Taxes + Swap + Profit = Нийт ашиг)
  const parseMT4 = (
    text: string,
  ): { validTrades: ParsedTrade[]; errors: ValidationError[] } => {
    const lines = text.split("\n").filter((line) => line.trim().length > 0);
    const validTrades: ParsedTrade[] = [];
    const errors: ValidationError[] = [];

    lines.forEach((line, index) => {
      // Tab-ээр тусгаарлагдсан column-ууд
      const columns = line.split("\t").map((col) => col.trim());

      // Хүлээгдэж буй баганын тоо: 14 (Ticket, Open Time, Type, Size, Item, Price, S/L, T/P, Close Time, Price, Commission, Taxes, Swap, Profit)
      if (columns.length < 14) {
        errors.push({
          row: index + 1,
          line,
          errors: [
            `14 багана хүлээгдэж байсан боловч ${columns.length} олдлоо`,
          ],
        });
        return;
      }

      try {
        // Зөвхөн trade (buy/sell) мөрүүдийг шүүж, balance мөрийг алгасах
        const typeRaw = columns[2].toLowerCase();
        if (typeRaw === "balance") {
          return; // balance мөрийг алгасах
        }

        const openTimeStr = columns[1]; // Open Time
        const closeTimeStr = columns[8]; // Close Time
        const symbol = columns[4].toUpperCase(); // Item (xauusd -> XAUUSD)
        const type = typeRaw; // Type (buy/sell)
        const size = parseFloat(columns[3]); // Size
        const openPrice = parseFloat(cleanNumber(columns[5])); // Price
        const closePrice = parseFloat(cleanNumber(columns[9])); // Price
        const sl = parseFloat(cleanNumber(columns[6])) || 0; // S/L
        const tp = parseFloat(cleanNumber(columns[7])) || 0; // T/P
        const commission = parseFloat(columns[10]) || 0; // Commission
        const taxes = parseFloat(columns[11].replace(/\s/g, "")) || 0; // Taxes
        const swap = parseFloat(columns[12].replace(/\s/g, "")) || 0; // Swap
        const profit = parseFloat(columns[13].replace(/\s/g, "")) || 0; // Profit

        // ✅ НИЙТ АШИГ = Commission + Taxes + Swap + Profit
        let totalProfit = commission + taxes + swap + profit;
        totalProfit = truncateTo2Decimals(totalProfit);

        // Огноо формат шалгах (2026.01.20 14:04:18)
        const openDate = new Date(openTimeStr.replace(/\./g, "-"));
        const closeDate = new Date(closeTimeStr.replace(/\./g, "-"));

        if (isNaN(openDate.getTime())) {
          errors.push({
            row: index + 1,
            line,
            errors: [`Нээлтийн огнооны формат буруу: ${openTimeStr}`],
          });
          return;
        }

        if (isNaN(closeDate.getTime())) {
          errors.push({
            row: index + 1,
            line,
            errors: [`Хаалтын огнооны формат буруу: ${closeTimeStr}`],
          });
          return;
        }

        validTrades.push({
          symbol: symbol,
          type: type,
          entry_price: openPrice,
          exit_price: closePrice,
          lot_size: size,
          open_time: openTimeStr.replace(/\./g, "-"),
          close_time: closeTimeStr.replace(/\./g, "-"),
          stop_loss: sl,
          take_profit: tp,
          profit: totalProfit, // ✅ Нийт ашгийг хадгалж байна
        });
      } catch (err) {
        errors.push({
          row: index + 1,
          line,
          errors: [`Өгөгдөл боловсруулахад алдаа гарлаа: ${err}`],
        });
      }
    });

    return { validTrades, errors };
  };

  // 📌 MT4 PREVIEW HANDLER
  const handleMt4Preview = () => {
    if (!mt4Text.trim()) {
      alert("MT4 History-с буулгасан арилжааны жагсаалтыг оруулна уу.");
      return;
    }

    const { validTrades, errors } = parseMT4(mt4Text);

    setParsedTrades(validTrades);
    setValidationErrors(errors);
    setShowPreview(true);

    if (errors.length > 0) {
      alert(
        `${errors.length} мөрөнд алдаа байна. Дэлгэрэнгүйг preview хэсгээс харна уу.`,
      );
    } else if (validTrades.length === 0) {
      alert("Хүчинтэй арилжаа олдсонгүй");
    } else {
      alert(`${validTrades.length} арилжаа амжилттай боловсруулагдлаа!`);
    }
  };

  // JFOREX ПАРСЕР
  const parseJForex = (
    text: string,
  ): { validTrades: ParsedTrade[]; errors: ValidationError[] } => {
    const lines = text.split("\n").filter((line) => line.trim().length > 0);
    const validTrades: ParsedTrade[] = [];
    const errors: ValidationError[] = [];

    lines.forEach((line, index) => {
      const columns = line.split("\t").map((col) => col.trim());

      // Хүлээгдэж буй баганын тоо: 13 (Label, Amount, Direction, Open price, Close price, Profit/Loss, Profit/Loss in pips, Open date, Close date, Comment, SL, TP, Symbol)
      if (columns.length < 13) {
        errors.push({
          row: index + 1,
          line,
          errors: [
            `13 багана хүлээгдэж байсан боловч ${columns.length} олдлоо`,
          ],
        });
        return;
      }

      try {
        const amount = parseFloat(columns[1]);
        const directionRaw = columns[2];
        const openPrice = parseFloat(columns[3]);
        const closePrice = parseFloat(columns[4]);
        const profitRaw = parseFloat(columns[5].replace(/\s/g, ""));
        const openDateRaw = columns[7];
        const closeDateRaw = columns[8];
        const sl = parseFloat(columns[10]) || 0;
        const tp = parseFloat(columns[11]) || 0;
        const symbol = columns[12]; // Symbol багана

        let tradeType = "";
        if (directionRaw.toLowerCase() === "buy") tradeType = "buy";
        else if (directionRaw.toLowerCase() === "sell") tradeType = "sell";
        else {
          errors.push({
            row: index + 1,
            line,
            errors: [
              `Төрөл нь "BUY" эсвэл "SELL" байх ёстой. Олдсон: ${directionRaw}`,
            ],
          });
          return;
        }

        const formatDate = (dateStr: string): string => {
          const parts = dateStr.split(" ");
          const dateParts = parts[0].split("/");
          const timePart = parts[1] || "00:00";
          const formattedDate = `${dateParts[2]}-${dateParts[0].padStart(2, "0")}-${dateParts[1].padStart(2, "0")}`;
          return `${formattedDate} ${timePart}`;
        };

        const openTimeStr = formatDate(openDateRaw);
        const closeTimeStr = formatDate(closeDateRaw);

        const openDate = new Date(openTimeStr);
        const closeDate = new Date(closeTimeStr);

        if (isNaN(openDate.getTime())) {
          errors.push({
            row: index + 1,
            line,
            errors: [`Нээлтийн огнооны формат буруу: ${openDateRaw}`],
          });
          return;
        }

        if (isNaN(closeDate.getTime())) {
          errors.push({
            row: index + 1,
            line,
            errors: [`Хаалтын огнооны формат буруу: ${closeDateRaw}`],
          });
          return;
        }

        validTrades.push({
          symbol: symbol,
          type: tradeType,
          entry_price: openPrice,
          exit_price: closePrice,
          lot_size: amount,
          open_time: openTimeStr,
          close_time: closeTimeStr,
          stop_loss: sl,
          take_profit: tp,
          profit: profitRaw,
        });
      } catch (err) {
        errors.push({
          row: index + 1,
          line,
          errors: [`Өгөгдөл боловсруулахад алдаа гарлаа: ${err}`],
        });
      }
    });

    return { validTrades, errors };
  };

  // 📌 JFOREX PREVIEW HANDLER
  const handleJForexPreview = () => {
    if (!jforexText.trim()) {
      alert("JForex-ээс буулгасан арилжааны жагсаалтыг оруулна уу.");
      return;
    }

    const { validTrades, errors } = parseJForex(jforexText);

    setParsedTrades(validTrades);
    setValidationErrors(errors);
    setShowPreview(true);

    if (errors.length > 0) {
      alert(
        `${errors.length} мөрөнд алдаа байна. Дэлгэрэнгүйг preview хэсгээс харна уу.`,
      );
    } else if (validTrades.length === 0) {
      alert("Хүчинтэй арилжаа олдсонгүй");
    } else {
      alert(`${validTrades.length} арилжаа амжилттай боловсруулагдлаа!`);
    }
  };

  // -------------------------
  // BULK SUBMIT
  // -------------------------
  const handleBulkSubmit = async () => {
    if (parsedTrades.length === 0) {
      alert("Булк хийх хүчинтэй арилжаа байхгүй байна.");
      return;
    }

    if (validationErrors.length > 0) {
      alert(`${validationErrors.length} алдааг засаарай.`);
      return;
    }

    const user = await getCurrentUser();

    if (!user) return alert("Хэрэглэгч нэвтрээгүй байна");
    if (!accountId) return alert("Данс сонгоно уу");

    const formatted = parsedTrades.map((t) => ({
      user_id: user.id,
      account_id: accountId,
      symbol: t.symbol,
      type: t.type,
      entry_price: t.entry_price,
      exit_price: t.exit_price,
      profit: t.profit,
      lot_size: t.lot_size,
      open_time: new Date(t.open_time),
      close_time: new Date(t.close_time),
      stop_loss: t.stop_loss,
      take_profit: t.take_profit,
    }));

    const sortedFormatted = formatted.sort(
      (a, b) =>
        new Date(a.open_time).getTime() - new Date(b.open_time).getTime(),
    );

    const { error } = await supabase.from("trades").insert(sortedFormatted);

    if (error) {
      console.log("error", error);
      alert("Булк хийхэд алдаа гарлаа: " + error.message);
      return;
    }

    alert(`${sortedFormatted.length} арилжаа амжилттай хадгалагдлаа!`);

    setBulkText("");
    setParsedTrades([]);
    setValidationErrors([]);
    setShowPreview(false);
    router.replace("/trades");
  };

  // MT5 цэвэрлэх
  const handleClearMt4 = () => {
    setMt4Text("");
    setShowPreview(false);
    setParsedTrades([]);
    setValidationErrors([]);
  };
  const handleClearMt5 = () => {
    setMt5Text("");
    setShowPreview(false);
    setParsedTrades([]);
    setValidationErrors([]);
  };

  // JForex цэвэрлэх
  const handleClearJForex = () => {
    setJforexText("");
    setShowPreview(false);
    setParsedTrades([]);
    setValidationErrors([]);
  };

  // Other (Bulk) цэвэрлэх
  const handleClearBulk = () => {
    setShowPreview(false);
    setParsedTrades([]);
    setValidationErrors([]);
    setBulkText("");
    setMt4Text("");
    setMt5Text("");
    setJforexText("");
    setActiveTab("mt5");
  };

  const filtedAccounts = accounts.filter((acc) => acc.status === "active");

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-4xl mx-auto p-6">
        <div className="border rounded-xl shadow space-y-4 bg-white dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Шинэ арилжаа нэмэх
          </h2>

          {/* ACCOUNT */}
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          >
            <option value="">Данс сонгох</option>
            {filtedAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {getStatusIcon(acc.status)} {acc.name} - $
                {acc.balance.toLocaleString()}
              </option>
            ))}
          </select>

          {/* SYMBOL + TYPE */}
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Хослол (EURUSD)"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>

          {/* PRICES */}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Нээлтийн ханш"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              className="p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
            <input
              type="number"
              placeholder="Хаалтын ханш"
              value={exit}
              onChange={(e) => setExit(e.target.value)}
              className="p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <input
              type="number"
              placeholder="SL"
              value={sl}
              onChange={(e) => setSl(e.target.value)}
              className="p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
            <input
              type="number"
              placeholder="TP"
              value={tp}
              onChange={(e) => setTp(e.target.value)}
              className="p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
            <input
              type="number"
              placeholder="Лот хэмжээ"
              value={lot}
              onChange={(e) => setLot(e.target.value)}
              className="p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
            <input
              type="number"
              placeholder="Ашиг"
              value={profit}
              onChange={(e) => setProfit(e.target.value)}
              className="p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          {/* TIME */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Нээлтийн огноо
              </label>
              <input
                type="datetime-local"
                value={openTime || ""}
                onChange={(e) => setOpenTime(e.target.value)}
                className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Хаалтын огноо
              </label>
              <input
                type="datetime-local"
                value={closeTime || ""}
                onChange={(e) => setCloseTime(e.target.value)}
                className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* SINGLE SUBMIT */}
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-colors"
          >
            💾 Арилжааг хадгалах
          </button>

          <hr className="my-4 dark:border-gray-700" />

          {/* TAB ХЭСЭГ - Олон арилжаа нэмэх */}
          <div className="mt-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActiveTab("mt5");
                    setShowPreview(false);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === "mt5"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <Image
                    src="/mt-logo.svg" // Таны SVG файлын зам (public хавтаснаас эхэлнэ)
                    alt="MT4 Logo"
                    width={40}
                    height={40}
                  />
                  <span>MT5</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("mt4");
                    setShowPreview(false);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === "mt4"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <Image
                    src="/mt-logo.svg" // Таны SVG файлын зам (public хавтаснаас эхэлнэ)
                    alt="MT4 Logo"
                    width={40}
                    height={40}
                  />
                  <span>MT4</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("jforex");
                    setShowPreview(false);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === "jforex"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <Image
                    src="/jforex.svg" // Таны SVG файлын зам (public хавтаснаас эхэлнэ)
                    alt="MT4 Logo"
                    width={40}
                    height={40}
                  />
                  <span>JForex</span>
                </button>
              </div>
            </div>

            <div className="mt-4">
              {/* MT5 TAB */}
              {activeTab === "mt5" && (
                <div className="space-y-3">
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded text-sm">
                    <p className="font-medium mb-2 text-gray-900 dark:text-gray-200">
                      🎯 MT5 History-с Export хийсэн өгөгдлөө буулгана уу
                    </p>
                    <code className="text-xs bg-gray-200 dark:bg-gray-800 dark:text-gray-300 p-2 block rounded">
                      Time Position Symbol Type Volume Price S/L T/P Time Price
                      Commission Swap Profit
                    </code>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      💡 Дээрх дарааллын дагуу өгөгдөл байх ёстой.
                    </p>
                  </div>

                  <textarea
                    placeholder="MT5 History-с буулгасан өгөгдлөө буулгана уу (Tab-ээр тусгаарлагдсан)..."
                    value={mt5Text}
                    onChange={(e) => {
                      setMt5Text(e.target.value);
                      setShowPreview(false);
                    }}
                    className="w-full p-2 border rounded h-32 font-mono text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  />

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleMt5Preview}
                      className={`${
                        mt5Text ? "sm:w-1/2" : "w-full"
                      } bg-green-600 hover:bg-green-700 text-white p-2 rounded transition-colors`}
                    >
                      🔍 Шалгах
                    </button>
                    {mt5Text && (
                      <button
                        onClick={handleClearMt5}
                        className="w-full sm:w-1/2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500 p-2 transition-colors"
                      >
                        ✖️ Цэвэрлэх
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* MT4 TAB */}
              {activeTab === "mt4" && (
                <div className="space-y-3">
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded text-sm">
                    <p className="font-medium mb-2 text-gray-900 dark:text-gray-200">
                      🎯 MT4 History-с Export хийсэн өгөгдлөө буулгана уу
                    </p>
                    <code className="text-xs bg-gray-200 dark:bg-gray-800 dark:text-gray-300 p-2 block rounded">
                      Ticket Open Time Type Size Item Price S/L T/P Close Time
                      Price Commission Taxes Swap Profit
                    </code>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      💡 Дээрх дарааллын дагуу өгөгдөл байх ёстой.
                    </p>
                  </div>

                  <textarea
                    placeholder="MT4 History-с буулгасан өгөгдлөө буулгана уу (Tab-ээр тусгаарлагдсан)..."
                    value={mt4Text}
                    onChange={(e) => {
                      setMt4Text(e.target.value);
                      setShowPreview(false);
                    }}
                    className="w-full p-2 border rounded h-32 font-mono text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  />

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleMt4Preview}
                      className={`${
                        mt4Text ? "sm:w-1/2" : "w-full"
                      } bg-green-600 hover:bg-green-700 text-white p-2 rounded transition-colors`}
                    >
                      🔍 Шалгах
                    </button>
                    {mt4Text && (
                      <button
                        onClick={handleClearMt4}
                        className="w-full sm:w-1/2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500 p-2 transition-colors"
                      >
                        ✖️ Цэвэрлэх
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* JFOREX TAB */}
              {activeTab === "jforex" && (
                <div className="space-y-3">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded text-sm">
                    <p className="font-medium mb-2 text-gray-900 dark:text-gray-200">
                      🎯 JForex Platform-с Export хийсэн өгөгдлөө буулгана уу
                    </p>
                    <code className="text-xs bg-gray-200 dark:bg-gray-800 dark:text-gray-300 p-2 block rounded whitespace-pre-wrap">
                      Label Amount Direction Open price Close price Profit/Loss
                      Profit/Loss in pips Open date Close date Comment SL TP
                      Symbol
                    </code>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      💡 Дээрх дарааллын дагуу өгөгдөл байх ёстой.
                    </p>
                  </div>

                  <textarea
                    placeholder="JForex-с буулгасан өгөгдлөө буулгана уу (Tab-ээр тусгаарлагдсан)..."
                    value={jforexText}
                    onChange={(e) => {
                      setJforexText(e.target.value);
                      setShowPreview(false);
                    }}
                    className="w-full p-2 border rounded h-32 font-mono text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  />

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleJForexPreview}
                      className={`${
                        jforexText ? "sm:w-1/2" : "w-full"
                      } bg-green-600 hover:bg-green-700 text-white p-2 rounded transition-colors`}
                    >
                      🔍 Шалгах
                    </button>
                    {jforexText && (
                      <button
                        onClick={handleClearJForex}
                        className="w-full sm:w-1/2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500 p-2 transition-colors"
                      >
                        ✖️ Цэвэрлэх
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Clear button */}
            {(bulkText || mt4Text || mt5Text || jforexText) && (
              <button
                onClick={handleClearBulk}
                className="mt-3 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                🗑️ Бүх өгөгдлийг цэвэрлэх
              </button>
            )}
          </div>
          {/* PREVIEW SECTION */}
          {showPreview && (
            <div className="space-y-3 border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Шалгалт: {parsedTrades.length} хүчинтэй арилжаа
                </h4>
                {validationErrors.length > 0 && (
                  <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                    {validationErrors.length} алдаа
                  </span>
                )}
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                  <h5 className="font-medium text-red-800 dark:text-red-300 mb-2">
                    ⚠️ Алдаанууд:
                  </h5>
                  <div className="space-y-2 max-h-60 overflow-auto">
                    {validationErrors.map((err, idx) => (
                      <div
                        key={idx}
                        className="text-sm border-b border-red-100 dark:border-red-800 pb-2"
                      >
                        <p className="font-mono text-red-700 dark:text-red-400">
                          {err.row} -р мөр:
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs break-all">
                          Мөр: {err.line}
                        </p>
                        <ul className="list-disc list-inside text-red-600 dark:text-red-400 text-xs ml-2">
                          {err.errors.map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Valid Trades Preview Table */}
              {parsedTrades.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                    Хүчинтэй арилжаанууд:
                  </h5>
                  <div className="overflow-x-auto max-h-80 overflow-auto">
                    <table className="min-w-full text-xs border-collapse">
                      <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800">
                        <tr className="border-b dark:border-gray-600">
                          <th className="p-2 text-left text-gray-900 dark:text-white">
                            #
                          </th>
                          <th className="p-2 text-left text-gray-900 dark:text-white">
                            Хослол
                          </th>
                          <th className="p-2 text-left text-gray-900 dark:text-white">
                            Төрөл
                          </th>
                          <th className="p-2 text-right text-gray-900 dark:text-white">
                            Нээлт
                          </th>
                          <th className="p-2 text-right text-gray-900 dark:text-white">
                            Хаалт
                          </th>
                          <th className="p-2 text-right text-gray-900 dark:text-white">
                            Лот
                          </th>
                          <th className="p-2 text-left text-gray-900 dark:text-white">
                            Нээсэн огноо
                          </th>
                          <th className="p-2 text-left text-gray-900 dark:text-white">
                            Хаасан огноо
                          </th>
                          <th className="p-2 text-right text-gray-900 dark:text-white">
                            SL
                          </th>
                          <th className="p-2 text-right text-gray-900 dark:text-white">
                            TP
                          </th>
                          <th className="p-2 text-right text-gray-900 dark:text-white">
                            Ашиг
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedTrades.slice(0, 20).map((trade, idx) => (
                          <tr
                            key={idx}
                            className="border-b dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            <td className="p-2 text-gray-900 dark:text-white">
                              {idx + 1}
                            </td>
                            <td className="p-2 font-medium text-gray-900 dark:text-white">
                              {trade.symbol}
                            </td>
                            <td
                              className={`p-2 ${trade.type === "buy" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                            >
                              {trade.type === "buy" ? "Buy" : "Sell"}
                            </td>
                            <td className="p-2 text-right text-gray-900 dark:text-white">
                              {trade.entry_price}
                            </td>
                            <td className="p-2 text-right text-gray-900 dark:text-white">
                              {trade.exit_price}
                            </td>
                            <td className="p-2 text-right text-gray-900 dark:text-white">
                              {trade.lot_size}
                            </td>
                            <td className="p-2 text-gray-900 dark:text-white">
                              {new Date(trade.open_time).toLocaleString()}
                            </td>
                            <td className="p-2 text-gray-900 dark:text-white">
                              {new Date(trade.close_time).toLocaleString()}
                            </td>
                            <td className="p-2 text-right text-gray-900 dark:text-white">
                              {trade.stop_loss}
                            </td>
                            <td className="p-2 text-right text-gray-900 dark:text-white">
                              {trade.take_profit}
                            </td>
                            <td
                              className={`p-2 text-right font-medium ${trade.profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                            >
                              {trade.profit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedTrades.length > 20 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 p-2">
                        Эхний 20-ыг харуулж байна. Нийт {parsedTrades.length}{" "}
                        арилжаа
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              {parsedTrades.length > 0 && validationErrors.length === 0 && (
                <button
                  onClick={handleBulkSubmit}
                  className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded mt-2 transition-colors"
                >
                  📤 {parsedTrades.length} арилжааг хадгалах
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
