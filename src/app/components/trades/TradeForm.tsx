"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAccounts } from "@/lib/hooks/useAccounts";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/getCurrentUser";

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

  // -------------------------
  // VALIDATION & PARSER
  // -------------------------
  const validateTrade = (
    trade: Partial<ParsedTrade>,
    rowNum: number,
    originalLine: string,
  ): ValidationError | null => {
    const errors: string[] = [];

    if (!trade.symbol || trade.symbol.trim() === "") {
      errors.push("Хослолын нэр оруулах шаардлагатай");
    }

    if (!trade.type || !["buy", "sell"].includes(trade.type.toLowerCase())) {
      errors.push("Төрөл нь 'buy' эсвэл 'sell' байх ёстой");
    }

    if (
      !trade.entry_price ||
      isNaN(trade.entry_price) ||
      trade.entry_price <= 0
    ) {
      errors.push("Нээлтийн үнэ эерэг тоо байх ёстой");
    }

    if (!trade.exit_price || isNaN(trade.exit_price) || trade.exit_price <= 0) {
      errors.push("Хаалтын үнэ эерэг тоо байх ёстой");
    }

    if (!trade.lot_size || isNaN(trade.lot_size) || trade.lot_size <= 0) {
      errors.push("Лотын хэмжээ эерэг тоо байх ёстой");
    }

    if (!trade.open_time || trade.open_time.trim() === "") {
      errors.push("Нээлтийн огноо оруулах шаардлагатай");
    } else if (isNaN(new Date(trade.open_time).getTime())) {
      errors.push(
        "Нээлтийн огнооны формат буруу байна (Зөв формат: ЖЖЖЖ-СС-ДД ЦЦ:ММ:ССС)",
      );
    }

    if (!trade.close_time || trade.close_time.trim() === "") {
      errors.push("Хаалтын огноо оруулах шаардлагатай");
    } else if (isNaN(new Date(trade.close_time).getTime())) {
      errors.push(
        "Хаалтын огнооны формат буруу байна (Зөв формат: ЖЖЖЖ-СС-ДД ЦЦ:ММ:ССС)",
      );
    }

    if (trade.stop_loss && isNaN(trade.stop_loss)) {
      errors.push("Stop loss нь тоо байх ёстой");
    }

    if (trade.take_profit && isNaN(trade.take_profit)) {
      errors.push("Take profit нь тоо байх ёстой");
    }

    if (trade.profit && isNaN(trade.profit)) {
      errors.push("Profit нь тоо байх ёстой");
    }

    if (errors.length > 0) {
      return { row: rowNum, line: originalLine, errors };
    }

    return null;
  };

  const parseTrades = (
    text: string,
  ): { validTrades: ParsedTrade[]; errors: ValidationError[] } => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const validTrades: ParsedTrade[] = [];
    const errors: ValidationError[] = [];

    lines.forEach((line, index) => {
      const parts = line.split(/[,;\t]/).map((p) => p.trim());

      if (parts.length < 10) {
        errors.push({
          row: index + 1,
          line,
          errors: [`10 багана хүлээгдэж байсан боловч ${parts.length} олдлоо`],
        });
        return;
      }

      const [
        symbol,
        type,
        entry,
        exit,
        lot,
        openTime,
        closeTime,
        sl,
        tp,
        profit,
      ] = parts;

      const tradeData: Partial<ParsedTrade> = {
        symbol,
        type: type.toLowerCase(),
        entry_price: Number(entry),
        exit_price: Number(exit),
        lot_size: Number(lot),
        open_time: openTime,
        close_time: closeTime,
        stop_loss: Number(sl),
        take_profit: Number(tp),
        profit: Number(profit),
      };

      const validationError = validateTrade(tradeData, index + 1, line);

      if (validationError) {
        errors.push(validationError);
      } else {
        validTrades.push(tradeData as ParsedTrade);
      }
    });

    return { validTrades, errors };
  };

  // -------------------------
  // PREVIEW HANDLER
  // -------------------------
  const handlePreview = () => {
    if (!bulkText.trim()) {
      alert("Арилжааны жагсаалтыг оруулна уу.");
      return;
    }

    const { validTrades, errors } = parseTrades(bulkText);
    setParsedTrades(validTrades);
    setValidationErrors(errors);
    setShowPreview(true);

    if (errors.length > 0) {
      alert(`${errors.length} мөрөнд алдаа байна. Булкаас өмнө засаарай.`);
    } else if (validTrades.length === 0) {
      alert("Булк хийх хүчинтэй арилжаа олдсонгүй");
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

  const handleClearPreview = () => {
    setShowPreview(false);
    setParsedTrades([]);
    setValidationErrors([]);
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
            Шинэ арилжаа нэмэх / Add New Trade
          </h2>

          {/* ACCOUNT */}
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          >
            <option value="">Данс сонгох / Select Account</option>
            {filtedAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>

          {/* SYMBOL + TYPE */}
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Symbol (EURUSD)"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="buy">Buy / Худалдаж авах</option>
              <option value="sell">Sell / Зарах</option>
            </select>
          </div>

          {/* PRICES */}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Entry Price / Нээлтийн үнэ"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              className="p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
            <input
              type="number"
              placeholder="Exit Price / Хаалтын үнэ"
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
              placeholder="Lot / Лот"
              value={lot}
              onChange={(e) => setLot(e.target.value)}
              className="p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
            <input
              type="number"
              placeholder="Profit / Ашиг"
              value={profit}
              onChange={(e) => setProfit(e.target.value)}
              className="p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          {/* TIME */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Нээлтийн цаг / Open Time
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
                Хаалтын цаг / Close Time
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
            💾 Арилжааг хадгалах / Save Single Trade
          </button>

          <hr className="my-4 dark:border-gray-700" />

          {/* BULK INPUT SECTION */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Олон арилжаа нэмэх / Bulk Upload Trades
          </h3>

          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-sm">
            <p className="font-medium mb-2 text-gray-900 dark:text-gray-200">
              Хүлээгдэж буй формат (таслал эсвэл табаар тусгаарлагдсан):
            </p>
            <code className="text-xs bg-gray-200 dark:bg-gray-800 dark:text-gray-300 p-2 block rounded">
              symbol,type,entry_price,exit_price,lot_size,open_time,close_time,stop_loss,take_profit,profit
            </code>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Жишээ: EURUSD,buy,1.1000,1.1050,0.1,2024-01-01 10:00:00,2024-01-01
              15:00:00,1.0950,1.1100,50
            </p>
          </div>

          <textarea
            placeholder="Олон арилжааны мэдээллийг буулгана уу (мөр бүр нэг арилжаа)..."
            value={bulkText}
            onChange={(e) => {
              setBulkText(e.target.value);
              setShowPreview(false);
            }}
            className="w-full p-2 border rounded h-32 font-mono text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          />

          <div className="flex gap-2">
            <button
              onClick={handlePreview}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-colors"
            >
              🔍 Шалгах / Preview Trades
            </button>

            {showPreview && (
              <button
                onClick={handleClearPreview}
                className="px-4 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 p-2 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                ✖️ Цэвэрлэх / Clear
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
                              {trade.type === "buy"
                                ? "Худалдаж авах"
                                : "Худалдах"}
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
