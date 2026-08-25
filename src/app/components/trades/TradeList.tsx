// src/components/trades/TradeList.tsx

"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import { Trade } from "@/types/trade";

type Props = {
  trades: Trade[];
  onDelete: (ids: string[]) => void;
  onEdit: (id: string) => void;
  onChart: (id: string) => void;
  onReview: (id: string) => void;
};

/* =====================================================
   PRICE FORMATTER
===================================================== */

const getPriceDecimals = (symbol: string): number => {
  const normalizedSymbol = symbol.toUpperCase();
  if (normalizedSymbol === "XAUUSD") {
    return 3;
  }
  return 5;
};

const formatPrice = (price: number, symbol: string): string => {
  return price.toFixed(getPriceDecimals(symbol));
};

/* =====================================================
   TIME FORMATTER
===================================================== */

const formatTradeTime = (value: string): string => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return "-";
  }
  return `${date.toISOString().slice(0, 19).replace("T", " ")} UTC`;
};

/* =====================================================
   🆕 PSYCHOLOGY STATUS COMPONENT - CLICKABLE PROGRESS BAR
===================================================== */

function PsychologyStatus({
  hasPsychology,
  hasBehavior,
  hasPostTrade,
  hasSetup,
  onReview,
  tradeId,
}: {
  hasPsychology: boolean;
  hasBehavior: boolean;
  hasPostTrade: boolean;
  hasSetup: boolean;
  onReview: (id: string) => void;
  tradeId: string;
}) {
  const items = [
    { label: "Сэтгэл зүй", value: hasPsychology },
    { label: "Зан төлөв", value: hasBehavior },
    { label: "Дүгнэлт", value: hasPostTrade },
    { label: "Нөхцөл", value: hasSetup },
  ];

  const completed = items.filter((item) => item.value).length;
  const total = items.length;
  const percentage = Math.round((completed / total) * 100);

  const getColor = () => {
    if (percentage === 100) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-gray-300";
  };

  const getLabel = () => {
    if (percentage === 100) return "✅ Бүрэн";
    if (percentage >= 50) return `⏳ ${percentage}%`;
    return `⬜ ${percentage}%`;
  };

  const getLabelColor = () => {
    if (percentage === 100) return "text-green-600 dark:text-green-400";
    if (percentage >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-gray-400";
  };

  return (
    <button
      onClick={() => onReview(tradeId)}
      className="
                  group
                  relative
                  flex
                  flex-col
                  gap-1
                  min-w-[130px]
                  w-full
                  hover:bg-gray-50
                  dark:hover:bg-gray-800
                  rounded-lg
                  p-2
                  transition-colors
                  cursor-pointer
                  text-left
                "
    >
      {/* Tooltip */}
      <span
        className="
                    pointer-events-none
                    absolute
                    -top-2
                    left-1/2
                    -translate-x-1/2
                    -translate-y-full
                    whitespace-nowrap
                    rounded
                    bg-gray-800
                    px-3
                    py-1.5
                    text-xs
                    text-white
                    opacity-0
                    transition-opacity
                    duration-200
                    group-hover:opacity-100
                    dark:bg-gray-700
                    dark:text-white
                    z-50
                  "
      >
        {getLabel()} - Дэлгэрэнгүй харах
      </span>

      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${getLabelColor()}`}>
          {getLabel()}
        </span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </button>
  );
}

/* =====================================================
   MAIN COMPONENT
===================================================== */

export default function TradeList({
  trades,
  onDelete,
  onEdit,
  onChart,
  onReview,
}: Props) {
  const router = useRouter();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [rowSelection, setRowSelection] = useState({});
  const [isSelectMode, setIsSelectMode] = useState(false);

  /* =====================================================
     COLUMNS
  ===================================================== */

  const columns = useMemo<ColumnDef<Trade>[]>(() => {
    const cols: ColumnDef<Trade>[] = [];

    /* =================================================
       SELECT COLUMN
    ================================================= */

    if (isSelectMode) {
      cols.push({
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="h-4 w-4 rounded border-gray-300"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="h-4 w-4 rounded border-gray-300"
          />
        ),
      });
    }

    /* =================================================
       SYMBOL
    ================================================= */

    cols.push({
      accessorKey: "symbol",
      header: "Хослол",
      cell: (info) => (
        <span className="font-medium">{info.getValue() as string}</span>
      ),
    });

    /* =================================================
       TYPE
    ================================================= */

    cols.push({
      accessorKey: "type",
      header: "Төрөл",
      cell: (info) => {
        const type = info.getValue() as string;
        return (
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              type === "buy" || type === "long"
                ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
            }`}
          >
            {type.toUpperCase()}
          </span>
        );
      },
    });

    /* =================================================
       ENTRY PRICE
    ================================================= */

    cols.push({
      accessorKey: "entry_price",
      header: "Нээлтийн ханш",
      cell: (info) => {
        const row = info.row.original;
        return formatPrice(info.getValue() as number, row.symbol);
      },
    });

    /* =================================================
       EXIT PRICE
    ================================================= */

    cols.push({
      accessorKey: "exit_price",
      header: "Хаалтын ханш",
      cell: (info) => {
        const row = info.row.original;
        return formatPrice(info.getValue() as number, row.symbol);
      },
    });

    /* =================================================
       LOT SIZE
    ================================================= */

    cols.push({
      accessorKey: "lot_size",
      header: "Лот хэмжээ",
      cell: (info) => (info.getValue() as number).toFixed(2),
    });

    /* =================================================
       STOP LOSS
    ================================================= */

    cols.push({
      accessorKey: "stop_loss",
      header: "SL",
      cell: (info) => {
        const row = info.row.original;
        const value = info.getValue() as number;
        if (!value) {
          return "-";
        }
        return formatPrice(value, row.symbol);
      },
    });

    /* =================================================
       TAKE PROFIT
    ================================================= */

    cols.push({
      accessorKey: "take_profit",
      header: "TP",
      cell: (info) => {
        const row = info.row.original;
        const value = info.getValue() as number;
        if (!value) {
          return "-";
        }
        return formatPrice(value, row.symbol);
      },
    });

    /* =================================================
       OPEN DATE
    ================================================= */

    cols.push({
      accessorKey: "open_time",
      header: "Нээлтийн огноо",
      cell: (info) => formatTradeTime(info.getValue() as string),
    });

    /* =================================================
       CLOSE DATE
    ================================================= */

    cols.push({
      accessorKey: "close_time",
      header: "Хаалтын огноо",
      cell: (info) => formatTradeTime(info.getValue() as string),
    });

    /* =================================================
       PROFIT
    ================================================= */

    cols.push({
      accessorKey: "profit",
      header: "Ашиг",
      cell: (info) => {
        const profit = info.getValue() as number;
        return (
          <span
            className={`font-semibold ${
              profit > 0
                ? "text-green-600"
                : profit < 0
                  ? "text-red-600"
                  : "text-gray-500"
            }`}
          >
            ${profit}
          </span>
        );
      },
    });

    /* =================================================
       🆕 PSYCHOLOGY STATUS - CLICKABLE PROGRESS BAR
    ================================================= */

    cols.push({
      id: "psychology_status",
      header: "🧠 Сэтгэл зүй",
      cell: (info) => {
        const trade = info.row.original;

        return (
          <PsychologyStatus
            hasPsychology={trade.hasPsychology || false}
            hasBehavior={trade.hasBehavior || false}
            hasPostTrade={trade.hasPostTrade || false}
            hasSetup={trade.hasSetup || false}
            onReview={onReview}
            tradeId={trade.id}
          />
        );
      },
    });

    /* =================================================
       🆕 ACTIONS - Зөвхөн Chart, Edit (Review товч хасагдсан)
    ================================================= */

    cols.push({
      id: "actions",
      header: "Үйлдэл",
      cell: (info) => {
        const tradeId = info.row.original.id;
        return (
          <div className="flex items-center gap-2">
            {/* CHART */}
            <button
              type="button"
              onClick={() => onChart(tradeId)}
              className="group relative rounded bg-green-500 px-3 py-1 text-xs text-white hover:bg-green-600 transition-colors"
            >
              📈
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                Чарт
              </span>
            </button>

            {/* EDIT */}
            <button
              type="button"
              onClick={() => onEdit(tradeId)}
              className="group relative rounded bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600 transition-colors"
            >
              ✎
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                Засварлах
              </span>
            </button>

            {/* 🆕 REVIEW товч ХАСАГДСАН */}
            {/* Сэтгэл зүй column дээр дарж review руу орно */}
          </div>
        );
      },
    });

    return cols;
  }, [isSelectMode, onEdit, onChart, onReview]);

  /* =====================================================
     TABLE
  ===================================================== */

  const table = useReactTable({
    data: trades,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
      rowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  /* =====================================================
     SELECTED ROWS
  ===================================================== */

  const selectedRowIds = table
    .getSelectedRowModel()
    .rows.map((row) => row.original.id);

  const selectedCount = selectedRowIds.length;

  /* =====================================================
     DELETE SELECTED
  ===================================================== */

  const handleDeleteSelected = () => {
    if (selectedCount === 0) {
      return;
    }
    if (
      confirm(
        `Are you sure you want to delete ${selectedCount} selected trade(s)?`,
      )
    ) {
      onDelete(selectedRowIds);
      setRowSelection({});
      setIsSelectMode(false);
    }
  };

  /* =====================================================
     SELECT MODE
  ===================================================== */

  const cancelSelectMode = () => {
    setIsSelectMode(false);
    setRowSelection({});
  };

  const enterSelectMode = () => {
    setIsSelectMode(true);
  };

  /* =====================================================
     EMPTY
  ===================================================== */

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
        <div className="mb-2 text-4xl">📭</div>
        <h3 className="text-lg font-semibold">Арилжаа олдсонгүй</h3>
        <p className="mb-4 text-gray-500">
          Эхлээд хамгийн эхний арилжааг нэмнэ үү
        </p>
        <button
          onClick={() => router.push("/trades/new")}
          className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          + Нэмэх
        </button>
      </div>
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Хайх..."
              className="w-64 rounded-lg border px-4 py-2 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {trades.length} Нийт арилжаа
          </span>
        </div>

        <div className="flex gap-2">
          {isSelectMode ? (
            <>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedCount === 0}
                className={`rounded-lg px-4 py-2 text-sm text-white ${
                  selectedCount > 0
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                🗑️ Устгах({selectedCount})
              </button>
              <button
                onClick={cancelSelectMode}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
              >
                Цуцлах
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/trades/new")}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
              >
                + Нэмэх
              </button>
              <button
                type="button"
                onClick={() => router.push(`/psychology/drafts`)}
                className="
                            group
                            relative
                            rounded-lg
                            border
                            px-4
                            py-2
                            text-sm
                            text-yellow-500
                            hover:bg-yellow-50
                            transition-colors
                            dark:border-yellow-800
                            dark:text-yellow-400
                            dark:hover:bg-yellow-950/20
                          "
              >
                📝 Түр тэмдэглэл
                {/* Tooltip */}
                <span
                  className="
                              pointer-events-none
                              absolute
                              bottom-full
                              left-1/2
                              mb-2
                              -translate-x-1/2
                              whitespace-nowrap
                              rounded
                              bg-gray-800
                              px-3
                              py-1.5
                              text-xs
                              text-white
                              opacity-0
                              transition-opacity
                              duration-200
                              group-hover:opacity-100
                              dark:bg-gray-700
                            "
                >
                  Арилжааны setup, сэтгэл зүйн мэдээллийг урьдчилан хадгалах
                </span>
              </button>
              <button
                onClick={enterSelectMode}
                className="rounded-lg border px-4 py-2 text-sm text-red-500 hover:bg-red-50"
              >
                🗑️ Устгах
              </button>
            </>
          )}
        </div>
      </div>

      {/* SELECTION INFO */}
      {isSelectMode && selectedCount > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
          <span className="text-sm text-blue-800 dark:text-blue-300">
            {selectedCount} сонгогдсон арилжаа
          </span>
          <button
            onClick={() => setRowSelection({})}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Сонголтыг арилгах
          </button>
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 dark:bg-gray-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 ${
                      header.column.getCanSort()
                        ? "cursor-pointer select-none"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {{
                        өсөх: " ↑",
                        буурах: " ↓",
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white dark:bg-gray-900">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  isSelectMode && row.getIsSelected()
                    ? "bg-blue-50 dark:bg-blue-950/50"
                    : ""
                }`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="whitespace-nowrap px-4 py-3 text-sm"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>
            Хуудас {table.getState().pagination.pageIndex + 1} /{" "}
            {table.getPageCount()}
          </span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="rounded border px-2 py-1 text-sm"
          >
            {[5, 10, 20, 30, 50].map((size) => (
              <option key={size} value={size}>
                Харуулах {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded border px-3 py-1 text-sm disabled:opacity-50"
          >
            ← Өмнөх
          </button>

          {Array.from(
            {
              length: Math.min(5, table.getPageCount()),
            },
            (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => table.setPageIndex(pageNum - 1)}
                  className={`rounded px-3 py-1 text-sm ${
                    table.getState().pagination.pageIndex === pageNum - 1
                      ? "bg-blue-500 text-white"
                      : "border hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            },
          )}

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded border px-3 py-1 text-sm disabled:opacity-50"
          >
            Дараах →
          </button>
        </div>
      </div>
    </div>
  );
}
