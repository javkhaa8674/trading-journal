"use client";

import { useState } from "react";
import Image from "next/image";
import { useTrades } from "@/lib/hooks/useTrades";
import { useAccounts } from "@/lib/hooks/useAccounts";
import { useRouter } from "next/navigation";
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
  const { addTrade, bulkAddTrades } = useTrades();

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

  // ============================================================
  // SERVER TIME OFFSET
  //
  // Broker-ийн server time-г UTC руу хөрвүүлэхэд хэрэглэнэ.
  //
  // Жишээ:
  // Broker Server = UTC+3
  // Input          = 2026-08-13 09:10:00
  // DB UTC         = 2026-08-13T06:10:00.000Z
  //
  // Broker Server = UTC+2
  // Input          = 2026-08-13 09:10:00
  // DB UTC         = 2026-08-13T07:10:00.000Z
  //
  // 0 = аль хэдийн UTC
  // ============================================================

  const [serverOffset, setServerOffset] = useState("0");

  // -------------------------
  // BULK INPUT STATE
  // -------------------------

  const [bulkText, setBulkText] = useState("");
  const [parsedTrades, setParsedTrades] = useState<ParsedTrade[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [showPreview, setShowPreview] = useState(false);

  // -------------------------
  // MT4 / MT5 / JFOREX STATE
  // -------------------------

  const [mt4Text, setMt4Text] = useState("");
  const [mt5Text, setMt5Text] = useState("");
  const [jforexText, setJforexText] = useState("");

  const [activeTab, setActiveTab] = useState<"jforex" | "mt4" | "mt5">("mt5");

  // ============================================================
  // SERVER OFFSET OPTIONS
  // ============================================================

  const serverOffsetOptions = Array.from(
    { length: 27 },
    (_, index) => index - 12,
  );

  // ============================================================
  // TIME HELPERS
  // ============================================================

  /**
   * Broker/server time-ийг UTC ISO string болгоно.
   *
   * Жишээ:
   *
   * input:
   * 2026-08-13 09:10:00
   *
   * offset:
   * +3
   *
   * result:
   * 2026-08-13T06:10:00.000Z
   *
   * Browser timezone огт ашиглахгүй.
   */
  const convertServerTimeToUTC = (
    timeString: string,
    offsetHours: number,
  ): string => {
    const normalized = timeString.trim();

    const match = normalized.match(
      /^(\d{4})[-.](\d{1,2})[-.](\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
    );

    if (!match) {
      throw new Error(`Огнооны формат буруу: ${timeString}`);
    }

    const [, year, month, day, hour, minute, second = "0"] = match;

    const localServerMillis = Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    );

    const utcMillis = localServerMillis - offsetHours * 60 * 60 * 1000;

    return new Date(utcMillis).toISOString();
  };

  /**
   * JForex:
   *
   * 1/7/2026 16:14
   *
   * -> 2026-01-07 16:14:00
   *
   * Мөн секундтэй format зөвшөөрнө:
   *
   * 1/7/2026 16:14:30
   */
  const formatJForexDate = (dateStr: string): string => {
    const parts = dateStr.trim().split(/\s+/);

    if (parts.length < 2) {
      throw new Error(`JForex огнооны формат буруу: ${dateStr}`);
    }

    const dateParts = parts[0].split("/");

    if (dateParts.length !== 3) {
      throw new Error(`JForex огнооны формат буруу: ${dateStr}`);
    }

    const timeParts = parts[1].split(":");

    if (timeParts.length < 2) {
      throw new Error(`JForex цагийн формат буруу: ${dateStr}`);
    }

    const year = Number(dateParts[2]);
    const month = Number(dateParts[0]);
    const day = Number(dateParts[1]);

    const hour = Number(timeParts[0]);
    const minute = Number(timeParts[1]);
    const second = timeParts[2] ? Number(timeParts[2]) : 0;

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      !Number.isInteger(day) ||
      !Number.isInteger(hour) ||
      !Number.isInteger(minute) ||
      !Number.isInteger(second)
    ) {
      throw new Error(`JForex огнооны формат буруу: ${dateStr}`);
    }

    if (
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31 ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59 ||
      second < 0 ||
      second > 59
    ) {
      throw new Error(`JForex огнооны утга буруу: ${dateStr}`);
    }

    return (
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
        2,
        "0",
      )} ` +
      `${String(hour).padStart(2, "0")}:${String(minute).padStart(
        2,
        "0",
      )}:${String(second).padStart(2, "0")}`
    );
  };

  /**
   * Preview дээр UTC-г browser local timezone руу шилжүүлэхгүйгээр
   * шууд UTC хэлбэрээр харуулна.
   */
  const formatUTCForDisplay = (isoString: string): string => {
    const date = new Date(isoString);

    if (isNaN(date.getTime())) {
      return isoString;
    }

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const hour = String(date.getUTCHours()).padStart(2, "0");
    const minute = String(date.getUTCMinutes()).padStart(2, "0");
    const second = String(date.getUTCSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hour}:${minute}:${second} UTC`;
  };

  /**
   * datetime-local input нь timezone information агуулахгүй.
   *
   * Тиймээс input дээр байгаа цагийг UTC гэж үзээд
   * шууд UTC ISO string үүсгэнэ.
   *
   * Browser-ийн local timezone ашиглахгүй.
   */
  const convertDateTimeLocalAsUTC = (value: string): string => {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);

    if (!match) {
      throw new Error(`Datetime format буруу: ${value}`);
    }

    const [, year, month, day, hour, minute] = match;

    return new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        0,
      ),
    ).toISOString();
  };

  // ============================================================
  // SINGLE TRADE SUBMIT
  // ============================================================

  const handleSubmit = async () => {
    if (!accountId) {
      alert("Данс сонгоно уу");
      return;
    }

    if (!symbol) {
      alert("Хослолын нэр оруулна уу");
      return;
    }

    const entryPrice = parseFloat(entry);
    const exitPrice = parseFloat(exit);
    const profitValue = parseFloat(profit);

    if (!Number.isFinite(entryPrice)) {
      alert("Нээлтийн ханш оруулна уу");
      return;
    }

    if (!Number.isFinite(exitPrice)) {
      alert("Хаалтын ханш оруулна уу");
      return;
    }

    if (!Number.isFinite(profitValue)) {
      alert("Ашгийн утга оруулна уу");
      return;
    }

    let openTimeUTC: string;
    let closeTimeUTC: string;

    try {
      openTimeUTC = openTime
        ? convertDateTimeLocalAsUTC(openTime)
        : new Date().toISOString();

      closeTimeUTC = closeTime
        ? convertDateTimeLocalAsUTC(closeTime)
        : new Date().toISOString();
    } catch (error) {
      console.error(error);
      alert("Огноо боловсруулах үед алдаа гарлаа");
      return;
    }

    const result = await addTrade({
      account_id: accountId,
      symbol,
      type: type as "buy" | "sell",
      entry_price: entryPrice,
      exit_price: exitPrice,
      profit: profitValue,
      stop_loss: sl === "" ? 0 : parseFloat(sl),
      take_profit: tp === "" ? 0 : parseFloat(tp),
      lot_size: lot === "" ? 0.1 : parseFloat(lot),
      open_time: openTimeUTC,
      close_time: closeTimeUTC,
    });

    if (result.error) {
      console.error(result.error);
      alert("Арилжаа хадгалах үед алдаа гарлаа: " + result.error);
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

  // ============================================================
  // NUMERIC HELPERS
  // ============================================================

  const truncateTo2Decimals = (num: number): number => {
    return Math.trunc(num * 100) / 100;
  };

  const cleanNumber = (value: string): string => {
    return value.replace(/\s/g, "");
  };

  // ============================================================
  // MT5 PARSER
  // ============================================================

  const parseMT5 = (
    text: string,
  ): { validTrades: ParsedTrade[]; errors: ValidationError[] } => {
    const lines = text.split("\n").filter((line) => line.trim().length > 0);

    const validTrades: ParsedTrade[] = [];
    const errors: ValidationError[] = [];

    lines.forEach((line, index) => {
      const columns = line.split("\t").map((col) => col.trim());

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
        const openTimeStr = columns[0];
        const symbol = columns[2];
        const typeRaw = columns[3];
        const volume = parseFloat(columns[4]);
        const openPrice = parseFloat(cleanNumber(columns[5]));
        const sl = parseFloat(cleanNumber(columns[6])) || 0;
        const tp = parseFloat(cleanNumber(columns[7])) || 0;
        const closeTimeStr = columns[8];
        const closePrice = parseFloat(cleanNumber(columns[9]));
        const commissionRaw = columns[10];
        const swap = parseFloat(columns[11].replace(/\s/g, "")) || 0;
        const profit = parseFloat(columns[12].replace(/\s/g, "")) || 0;

        let commission = 0;

        if (commissionRaw !== "-" && commissionRaw !== "") {
          commission = parseFloat(commissionRaw.replace(/\s/g, "")) || 0;
        }

        const effectiveSwap = swap > 0 ? 0 : swap;

        let totalProfit = commission + effectiveSwap + profit;

        totalProfit = truncateTo2Decimals(totalProfit);

        let tradeType = "";

        if (typeRaw.toLowerCase() === "buy") {
          tradeType = "buy";
        } else if (typeRaw.toLowerCase() === "sell") {
          tradeType = "sell";
        } else {
          errors.push({
            row: index + 1,
            line,
            errors: [
              `Төрөл нь "buy" эсвэл "sell" байх ёстой. Олдсон: ${typeRaw}`,
            ],
          });

          return;
        }

        // ======================================================
        // MT5 SERVER TIME -> UTC
        // ======================================================

        let openTimeUTC: string;
        let closeTimeUTC: string;

        try {
          openTimeUTC = convertServerTimeToUTC(
            openTimeStr,
            Number(serverOffset),
          );
        } catch (error) {
          errors.push({
            row: index + 1,
            line,
            errors: [
              `Нээлтийн огнооны формат буруу эсвэл UTC хөрвүүлэлт амжилтгүй: ${openTimeStr}`,
            ],
          });

          return;
        }

        try {
          closeTimeUTC = convertServerTimeToUTC(
            closeTimeStr,
            Number(serverOffset),
          );
        } catch (error) {
          errors.push({
            row: index + 1,
            line,
            errors: [
              `Хаалтын огнооны формат буруу эсвэл UTC хөрвүүлэлт амжилтгүй: ${closeTimeStr}`,
            ],
          });

          return;
        }

        const openDate = new Date(openTimeUTC);
        const closeDate = new Date(closeTimeUTC);

        if (isNaN(openDate.getTime())) {
          errors.push({
            row: index + 1,
            line,
            errors: [`Нээлтийн UTC огноо буруу: ${openTimeStr}`],
          });

          return;
        }

        if (isNaN(closeDate.getTime())) {
          errors.push({
            row: index + 1,
            line,
            errors: [`Хаалтын UTC огноо буруу: ${closeTimeStr}`],
          });

          return;
        }

        validTrades.push({
          symbol,
          type: tradeType,
          entry_price: openPrice,
          exit_price: closePrice,
          lot_size: volume,
          open_time: openTimeUTC,
          close_time: closeTimeUTC,
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

  // ============================================================
  // MT5 PREVIEW
  // ============================================================

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

  // ============================================================
  // MT4 PARSER
  // ============================================================

  const parseMT4 = (
    text: string,
  ): { validTrades: ParsedTrade[]; errors: ValidationError[] } => {
    const lines = text.split("\n").filter((line) => line.trim().length > 0);

    const validTrades: ParsedTrade[] = [];
    const errors: ValidationError[] = [];

    lines.forEach((line, index) => {
      const columns = line.split("\t").map((col) => col.trim());

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
        const typeRaw = columns[2].toLowerCase();

        if (typeRaw === "balance") {
          return;
        }

        const openTimeStr = columns[1];
        const closeTimeStr = columns[8];
        const symbol = columns[4].toUpperCase();
        const type = typeRaw;
        const size = parseFloat(columns[3]);
        const openPrice = parseFloat(cleanNumber(columns[5]));
        const closePrice = parseFloat(cleanNumber(columns[9]));
        const sl = parseFloat(cleanNumber(columns[6])) || 0;
        const tp = parseFloat(cleanNumber(columns[7])) || 0;
        const commission = parseFloat(columns[10]) || 0;
        const taxes = parseFloat(columns[11].replace(/\s/g, "")) || 0;
        const swap = parseFloat(columns[12].replace(/\s/g, "")) || 0;
        const profit = parseFloat(columns[13].replace(/\s/g, "")) || 0;

        const effectiveSwap = swap > 0 ? 0 : swap;

        let totalProfit = commission + taxes + effectiveSwap + profit;

        totalProfit = truncateTo2Decimals(totalProfit);

        // ======================================================
        // MT4 SERVER TIME -> UTC
        // ======================================================

        let openTimeUTC: string;
        let closeTimeUTC: string;

        try {
          const normalizedOpen = openTimeStr.replace(/\./g, "-");

          const normalizedClose = closeTimeStr.replace(/\./g, "-");

          openTimeUTC = convertServerTimeToUTC(
            normalizedOpen,
            Number(serverOffset),
          );

          closeTimeUTC = convertServerTimeToUTC(
            normalizedClose,
            Number(serverOffset),
          );
        } catch (error) {
          errors.push({
            row: index + 1,
            line,
            errors: [
              `MT4 огноог UTC болгон хөрвүүлэхэд алдаа гарлаа: ${error}`,
            ],
          });

          return;
        }

        const openDate = new Date(openTimeUTC);
        const closeDate = new Date(closeTimeUTC);

        if (isNaN(openDate.getTime())) {
          errors.push({
            row: index + 1,
            line,
            errors: [`Нээлтийн UTC огноо буруу: ${openTimeStr}`],
          });

          return;
        }

        if (isNaN(closeDate.getTime())) {
          errors.push({
            row: index + 1,
            line,
            errors: [`Хаалтын UTC огноо буруу: ${closeTimeStr}`],
          });

          return;
        }

        validTrades.push({
          symbol,
          type,
          entry_price: openPrice,
          exit_price: closePrice,
          lot_size: size,
          open_time: openTimeUTC,
          close_time: closeTimeUTC,
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

  // ============================================================
  // MT4 PREVIEW
  // ============================================================

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

  // ============================================================
  // JFOREX PARSER
  // ============================================================

  const parseJForex = (
    text: string,
  ): { validTrades: ParsedTrade[]; errors: ValidationError[] } => {
    const lines = text.split("\n").filter((line) => line.trim().length > 0);

    const validTrades: ParsedTrade[] = [];
    const errors: ValidationError[] = [];

    lines.forEach((line, index) => {
      const columns = line.split("\t").map((col) => col.trim());

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

        const symbol = columns[12];

        let tradeType = "";

        if (directionRaw.toLowerCase() === "buy") {
          tradeType = "buy";
        } else if (directionRaw.toLowerCase() === "sell") {
          tradeType = "sell";
        } else {
          errors.push({
            row: index + 1,
            line,
            errors: [
              `Төрөл нь "BUY" эсвэл "SELL" байх ёстой. Олдсон: ${directionRaw}`,
            ],
          });

          return;
        }

        // ======================================================
        // JFOREX DATE FORMAT
        //
        // 1/7/2026 16:14
        // 1/7/2026 16:14:30
        //
        // аль алиныг зөвшөөрнө.
        // ======================================================

        const openTimeStr = formatJForexDate(openDateRaw);
        const closeTimeStr = formatJForexDate(closeDateRaw);

        // ======================================================
        // JFOREX SERVER TIME -> UTC
        // ======================================================

        let openTimeUTC: string;
        let closeTimeUTC: string;

        try {
          openTimeUTC = convertServerTimeToUTC(
            openTimeStr,
            Number(serverOffset),
          );

          closeTimeUTC = convertServerTimeToUTC(
            closeTimeStr,
            Number(serverOffset),
          );
        } catch (error) {
          errors.push({
            row: index + 1,
            line,
            errors: [
              `JForex огноог UTC болгон хөрвүүлэхэд алдаа гарлаа: ${error}`,
            ],
          });

          return;
        }

        const openDate = new Date(openTimeUTC);
        const closeDate = new Date(closeTimeUTC);

        if (isNaN(openDate.getTime())) {
          errors.push({
            row: index + 1,
            line,
            errors: [`Нээлтийн UTC огноо буруу: ${openDateRaw}`],
          });

          return;
        }

        if (isNaN(closeDate.getTime())) {
          errors.push({
            row: index + 1,
            line,
            errors: [`Хаалтын UTC огноо буруу: ${closeDateRaw}`],
          });

          return;
        }

        validTrades.push({
          symbol,
          type: tradeType,
          entry_price: openPrice,
          exit_price: closePrice,
          lot_size: amount,
          open_time: openTimeUTC,
          close_time: closeTimeUTC,
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

  // ============================================================
  // JFOREX PREVIEW
  // ============================================================

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

  // ============================================================
  // BULK SUBMIT
  // ============================================================

  const handleBulkSubmit = async () => {
    if (parsedTrades.length === 0) {
      alert("Булк хийх хүчинтэй арилжаа байхгүй байна.");
      return;
    }

    if (validationErrors.length > 0) {
      alert(`${validationErrors.length} алдааг засаарай.`);
      return;
    }

    if (!accountId) {
      alert("Данс сонгоно уу");
      return;
    }

    const formatted = parsedTrades.map((t) => ({
      account_id: accountId,
      symbol: t.symbol,
      type: t.type as "buy" | "sell",
      entry_price: t.entry_price,
      exit_price: t.exit_price,
      profit: t.profit,
      lot_size: t.lot_size,

      // Parser аль хэдийн UTC ISO string үүсгэсэн.
      // Browser timezone ашиглахгүй.
      open_time: t.open_time,
      close_time: t.close_time,

      stop_loss: t.stop_loss,
      take_profit: t.take_profit,
    }));

    const sortedFormatted = formatted.sort(
      (a, b) =>
        new Date(a.open_time).getTime() - new Date(b.open_time).getTime(),
    );

    const result = await bulkAddTrades(sortedFormatted);

    if (result.error) {
      console.error("error", result.error);

      alert("Булк хийхэд алдаа гарлаа: " + result.error);

      return;
    }

    alert(`${sortedFormatted.length} арилжаа амжилттай хадгалагдлаа!`);

    setBulkText("");
    setParsedTrades([]);
    setValidationErrors([]);
    setShowPreview(false);

    router.replace("/trades");
  };

  // ============================================================
  // CLEAR
  // ============================================================

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

  const handleClearJForex = () => {
    setJforexText("");
    setShowPreview(false);
    setParsedTrades([]);
    setValidationErrors([]);
  };

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

  // ============================================================
  // ACCOUNTS
  // ============================================================

  const filtedAccounts = accounts.accounts.filter(
    (acc) => acc.status === "active",
  );

  // ============================================================
  // UI
  // ============================================================

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

          {/* ================================================== */}
          {/* SERVER TIME OFFSET */}
          {/* ================================================== */}

          <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              🌐 Broker Server Time Offset
            </label>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <select
                value={serverOffset}
                onChange={(e) => {
                  setServerOffset(e.target.value);

                  // Өмнөх preview-г хүчингүй болгоно.
                  setShowPreview(false);
                  setParsedTrades([]);
                  setValidationErrors([]);
                }}
                className="p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {serverOffsetOptions.map((offset) => (
                  <option key={offset} value={offset}>
                    {offset === 0
                      ? "UTC ±0"
                      : offset > 0
                        ? `UTC +${offset}`
                        : `UTC ${offset}`}
                  </option>
                ))}
              </select>

              <div className="text-xs text-gray-600 dark:text-gray-300">
                <p>Broker-ийн server цагийг UTC руу хөрвүүлэхэд хэрэглэнэ.</p>

                <p className="mt-1">
                  Жишээ: Broker UTC+3 бол <strong>UTC +3</strong>-г сонгоно.
                </p>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
              <strong>Одоогийн сонголт:</strong>{" "}
              {Number(serverOffset) === 0
                ? "UTC"
                : Number(serverOffset) > 0
                  ? `UTC+${serverOffset}`
                  : `UTC${serverOffset}`}
            </div>
          </div>

          {/* ================================================== */}
          {/* TABS */}
          {/* ================================================== */}

          <div className="mt-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                {/* MT5 */}

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
                    src="/mt-logo.svg"
                    alt="MT5 Logo"
                    width={40}
                    height={40}
                  />

                  <span>MT5</span>
                </button>

                {/* MT4 */}

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
                    src="/mt-logo.svg"
                    alt="MT4 Logo"
                    width={40}
                    height={40}
                  />

                  <span>MT4</span>
                </button>

                {/* JFOREX */}

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
                    src="/jforex.svg"
                    alt="JForex Logo"
                    width={40}
                    height={40}
                  />

                  <span>JForex</span>
                </button>
              </div>
            </div>

            <div className="mt-4">
              {/* ================================================== */}
              {/* MT5 TAB */}
              {/* ================================================== */}

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
                      💡 Дээрх Server Time Offset сонголтоор MT5 broker-ийн
                      server цагийг UTC болгон хөрвүүлнэ.
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

              {/* ================================================== */}
              {/* MT4 TAB */}
              {/* ================================================== */}

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
                      💡 Дээрх Server Time Offset сонголтоор MT4 broker-ийн
                      server цагийг UTC болгон хөрвүүлнэ.
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

              {/* ================================================== */}
              {/* JFOREX TAB */}
              {/* ================================================== */}

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
                      💡 JForex-ийн <strong>1/7/2026 16:14</strong> шиг
                      секундгүй цагийг мөн зөвшөөрнө. Server Time Offset-оор UTC
                      болгон хөрвүүлнэ.
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

            {/* CLEAR ALL */}

            {(bulkText || mt4Text || mt5Text || jforexText) && (
              <button
                onClick={handleClearBulk}
                className="mt-3 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                🗑️ Бүх өгөгдлийг цэвэрлэх
              </button>
            )}
          </div>

          {/* ================================================== */}
          {/* PREVIEW SECTION */}
          {/* ================================================== */}

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

              {/* Valid Trades Preview */}

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
                              className={`p-2 ${
                                trade.type === "buy"
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
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

                            <td className="p-2 text-gray-900 dark:text-white whitespace-nowrap">
                              {formatUTCForDisplay(trade.open_time)}
                            </td>

                            <td className="p-2 text-gray-900 dark:text-white whitespace-nowrap">
                              {formatUTCForDisplay(trade.close_time)}
                            </td>

                            <td className="p-2 text-right text-gray-900 dark:text-white">
                              {trade.stop_loss}
                            </td>

                            <td className="p-2 text-right text-gray-900 dark:text-white">
                              {trade.take_profit}
                            </td>

                            <td
                              className={`p-2 text-right font-medium ${
                                trade.profit >= 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
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
