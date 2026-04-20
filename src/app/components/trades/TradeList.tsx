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

type Trade = {
  id: string;
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

type Props = {
  trades: Trade[];
  onDelete: (ids: string[]) => void;
  onEdit: (id: string) => void;
};

export default function TradeList({ trades, onDelete, onEdit }: Props) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [rowSelection, setRowSelection] = useState({});
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Column definitions - Select column зөвхөн isSelectMode үед л харагдана
  const columns = useMemo<ColumnDef<Trade>[]>(() => {
    const cols: ColumnDef<Trade>[] = [];

    // Select column - зөвхөн select mode үед л нэмэгдэнэ
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

    // Symbol column
    cols.push({
      accessorKey: "symbol",
      header: "Symbol",
      cell: (info) => (
        <span className="font-medium">{info.getValue() as string}</span>
      ),
    });

    // Type column
    cols.push({
      accessorKey: "type",
      header: "Type",
      cell: (info) => {
        const type = info.getValue() as string;
        return (
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              type === "buy" || type === "long"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                : "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
            }`}
          >
            {type.toUpperCase()}
          </span>
        );
      },
    });

    // Entry Price
    cols.push({
      accessorKey: "entry_price",
      header: "Entry",
      cell: (info) => `$${(info.getValue() as number).toFixed(2)}`,
    });

    // Exit Price
    cols.push({
      accessorKey: "exit_price",
      header: "Exit",
      cell: (info) => `$${(info.getValue() as number).toFixed(2)}`,
    });

    // Lot Size
    cols.push({
      accessorKey: "lot_size",
      header: "Lot",
      cell: (info) => (info.getValue() as number).toFixed(2),
    });

    // Open Date
    cols.push({
      accessorKey: "open_time",
      header: "Open Date",
      cell: (info) => new Date(info.getValue() as string).toLocaleDateString(),
    });

    // Close Date
    cols.push({
      accessorKey: "close_time",
      header: "Close Date",
      cell: (info) => new Date(info.getValue() as string).toLocaleDateString(),
    });

    // Profit
    cols.push({
      accessorKey: "profit",
      header: "Profit",
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

    // Actions column - Edit only (Delete removed)
    cols.push({
      id: "actions",
      header: "Action",
      cell: (info) => (
        <button
          onClick={() => onEdit(info.row.original.id)}
          className="rounded bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600"
        >
          Edit
        </button>
      ),
    });

    return cols;
  }, [isSelectMode, onEdit]);

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

  // Get selected row IDs
  const selectedRowIds = table
    .getSelectedRowModel()
    .rows.map((row) => row.original.id);
  const selectedCount = selectedRowIds.length;

  // Handle delete selected
  const handleDeleteSelected = () => {
    if (selectedCount === 0) return;

    if (
      confirm(
        `Are you sure you want to delete ${selectedCount} selected trade(s)?`,
      )
    ) {
      onDelete(selectedRowIds);
      setRowSelection({});
      setIsSelectMode(false); // Exit select mode after delete
    }
  };

  // Cancel select mode
  const cancelSelectMode = () => {
    setIsSelectMode(false);
    setRowSelection({});
  };

  // Enter select mode
  const enterSelectMode = () => {
    setIsSelectMode(true);
  };

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
        <div className="mb-2 text-4xl">📭</div>
        <h3 className="text-lg font-semibold">No trades yet</h3>
        <p className="mb-4 text-gray-500">Start by adding your first trade</p>
        <button
          onClick={() => router.push("/trades/new")}
          className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          + Add Trade
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Search and Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search by symbol..."
              className="w-64 rounded-lg border px-4 py-2 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {trades.length} total trades
          </span>
        </div>

        <div className="flex gap-2">
          {isSelectMode ? (
            <>
              {/* Select Mode Active */}
              <button
                onClick={handleDeleteSelected}
                disabled={selectedCount === 0}
                className={`rounded-lg px-4 py-2 text-sm text-white ${
                  selectedCount > 0
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                🗑️ Delete Trade({selectedCount})
              </button>
              <button
                onClick={cancelSelectMode}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              {/* Normal Mode */}
              <button
                onClick={() => router.push("/trades/new")}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
              >
                + Add Trade
              </button>
              <button
                onClick={enterSelectMode}
                className="rounded-lg border px-4 py-2 text-sm text-red-500 hover:bg-red-50"
              >
                🗑️ Delete Trade
              </button>
            </>
          )}
        </div>
      </div>

      {/* Selection info bar (only in select mode) */}
      {isSelectMode && selectedCount > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
          <span className="text-sm text-blue-800 dark:text-blue-300">
            ✓ {selectedCount} trade(s) selected
          </span>
          <button
            onClick={() => setRowSelection({})}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
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
                        asc: " ↑",
                        desc: " ↓",
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

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="rounded border px-2 py-1 text-sm"
          >
            {[5, 10, 20, 30, 50].map((size) => (
              <option key={size} value={size}>
                Show {size}
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
            ← Previous
          </button>
          {Array.from({ length: Math.min(5, table.getPageCount()) }, (_, i) => {
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
          })}
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded border px-3 py-1 text-sm disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
