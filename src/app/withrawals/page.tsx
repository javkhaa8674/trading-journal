"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
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
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/lib/getCurrentUser";

type Account = {
  id: string;
  name: string;
  balance: number;
  mode: string;
  status: string;
};

type Withdrawal = {
  id: string;
  user_id: string;
  account_id: string;
  amount: number;
  method: "bank_transfer" | "crypto" | "paypal" | "other";
  transaction_id?: string;
  description?: string;
  account_details?: string;
  date: string;
  created_at: string;
  account_name?: string;
};

const withdrawalMethods = [
  { id: "bank_transfer", nameMn: "Банкны шилжүүлэг", icon: "🏦" },
  { id: "crypto", nameMn: "Крипто валют", icon: "₿" },
  { id: "paypal", nameMn: "PayPal", icon: "💙" },
  { id: "other", nameMn: "Бусад", icon: "💵" },
];

export default function WithrawalsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState({});
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter states
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [selectedMethod, setSelectedMethod] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      const user = await getCurrentUser();
      if (!user) return;

      const { data: accountsData } = await supabase
        .from("accounts")
        .select("id, name, balance, mode, status")
        .eq("user_id", user.id);

      setAccounts(accountsData || []);

      const { data: withdrawalsData } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      const withdrawalsWithAccountName = (withdrawalsData || []).map(
        (withdrawal) => ({
          ...withdrawal,
          account_name:
            accountsData?.find((a) => a.id === withdrawal.account_id)?.name ||
            withdrawal.account_id,
        }),
      );

      setWithdrawals(withdrawalsWithAccountName);
      setLoading(false);
    };

    loadData();
  }, []);

  const getMethodIcon = (method: string) => {
    const m = withdrawalMethods.find((m) => m.id === method);
    return m ? m.icon : "💵";
  };

  const getMethodName = (method: string) => {
    const m = withdrawalMethods.find((m) => m.id === method);
    return m ? m.nameMn : "Бусад";
  };

  // Apply filters
  const filteredData = useMemo(() => {
    let filtered = [...withdrawals];

    if (selectedAccount !== "all") {
      filtered = filtered.filter((w) => w.account_id === selectedAccount);
    }
    if (selectedMethod !== "all") {
      filtered = filtered.filter((w) => w.method === selectedMethod);
    }
    if (dateFrom) {
      filtered = filtered.filter((w) => w.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((w) => w.date <= dateTo);
    }

    return filtered;
  }, [withdrawals, selectedAccount, selectedMethod, dateFrom, dateTo]);

  // Column definitions
  const columns = useMemo<ColumnDef<Withdrawal>[]>(() => {
    const cols: ColumnDef<Withdrawal>[] = [];

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

    cols.push({
      accessorKey: "date",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-1 hover:text-blue-500"
        >
          📅 Огноо
          {column.getIsSorted() === "asc" && " ↑"}
          {column.getIsSorted() === "desc" && " ↓"}
        </button>
      ),
      cell: (info) => new Date(info.getValue() as string).toLocaleDateString(),
    });

    cols.push({
      accessorKey: "account_name",
      header: "🏦 Данс",
      cell: (info) => info.getValue(),
    });

    cols.push({
      accessorKey: "method",
      header: "💳 Төлбөрийн хэрэгсэл",
      cell: (info) => (
        <span className="flex items-center gap-1">
          {getMethodIcon(info.getValue() as string)}{" "}
          {getMethodName(info.getValue() as string)}
        </span>
      ),
    });

    cols.push({
      accessorKey: "amount",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-1 hover:text-blue-500"
        >
          💰 Дүн
          {column.getIsSorted() === "asc" && " ↑"}
          {column.getIsSorted() === "desc" && " ↓"}
        </button>
      ),
      cell: (info) => (
        <span className="font-semibold text-red-600">
          -${(info.getValue() as number).toLocaleString()}
        </span>
      ),
    });

    cols.push({
      accessorKey: "transaction_id",
      header: "🔢 Гүйлгээний ID",
      cell: (info) => info.getValue() || "-",
    });

    cols.push({
      accessorKey: "account_details",
      header: "🏦 Дансны дэлгэрэнгүй",
      cell: (info) => {
        const value = info.getValue() as string | undefined;
        return (
          <div className="max-w-xs truncate" title={value || ""}>
            {value || "-"}
          </div>
        );
      },
    });

    if (!isSelectMode) {
      cols.push({
        id: "actions",
        header: "⚙️ Үйлдэл",
        cell: (info) => (
          <button
            onClick={() => router.push(`/withrawals/${info.row.original.id}`)}
            className="rounded bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600"
          >
            Засах
          </button>
        ),
      });
    }

    return cols;
  }, [isSelectMode, router]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter, pagination, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedRowIds = table
    .getSelectedRowModel()
    .rows.map((row) => row.original.id);
  const selectedCount = selectedRowIds.length;
  const totalAmount = filteredData.reduce((sum, w) => sum + w.amount, 0);
  const filteredAccounts = accounts.filter((acc) => acc.status === "active");

  const handleDeleteSelected = async () => {
    if (selectedCount === 0) return;
    if (!confirm(`${selectedCount} гүйлгээ устгахдаа итгэлтэй байна уу?`))
      return;

    setIsDeleting(true);
    const user = await getCurrentUser();
    if (!user) {
      alert("Нэвтрэнэ үү");
      setIsDeleting(false);
      return;
    }

    const { error } = await supabase
      .from("withdrawals")
      .delete()
      .in("id", selectedRowIds)
      .eq("user_id", user.id);

    if (error) {
      alert(`Алдаа гарлаа: ${error.message}`);
    } else {
      setWithdrawals(withdrawals.filter((w) => !selectedRowIds.includes(w.id)));
      setRowSelection({});
      setIsSelectMode(false);
      alert(`${selectedCount} гүйлгээ амжилттай устгагдлаа`);
    }
    setIsDeleting(false);
  };

  const resetFilters = () => {
    setSelectedAccount("all");
    setSelectedMethod("all");
    setDateFrom("");
    setDateTo("");
    setGlobalFilter("");
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-2xl">💸</div>
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">💸 Мөнгө татах</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Арилжааны данснаас мөнгө татах гүйлгээнүүд
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-3 sm:p-4 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-base sm:text-lg">💰</span>
            <span className="text-xs sm:text-sm">Нийт татсан мөнгө</span>
          </div>
          <div className="mt-1 sm:mt-2 text-lg sm:text-2xl font-bold text-orange-600">
            ${totalAmount.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-3 sm:p-4 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-base sm:text-lg">📊</span>
            <span className="text-xs sm:text-sm">Нийт гүйлгээ</span>
          </div>
          <div className="mt-1 sm:mt-2 text-lg sm:text-2xl font-bold">
            {filteredData.length}
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-lg border bg-white p-3 sm:p-4 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-base sm:text-lg">🏦</span>
            <span className="text-xs sm:text-sm">Идэвхтэй данс</span>
          </div>
          <div className="mt-1 sm:mt-2 text-lg sm:text-2xl font-bold">
            {filteredAccounts.length}
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-semibold">🔍 Шүүлтүүр</h3>
          <button
            onClick={resetFilters}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            Цэвэрлэх
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Данс</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full rounded-lg border p-2 text-sm bg-white dark:bg-gray-800"
            >
              <option value="all">Бүх данс</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Төлбөрийн хэрэгсэл
            </label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full rounded-lg border p-2 text-sm bg-white dark:bg-gray-800"
            >
              <option value="all">Бүх төрөл</option>
              {withdrawalMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.icon} {method.nameMn}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Огноо (эхлэх)
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border p-2 text-sm bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Огноо (дуусах)
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border p-2 text-sm bg-white dark:bg-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Header with Search and Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <input
              type="text"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Гүйлгээний ID, тайлбараар хайх..."
              className="w-full sm:w-80 rounded-lg border px-4 py-2 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {filteredData.length} гүйлгээ
          </span>
        </div>

        <div className="flex gap-2">
          {isSelectMode ? (
            <>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedCount === 0 || isDeleting}
                className={`rounded-lg px-4 py-2 text-sm text-white ${
                  selectedCount > 0 && !isDeleting
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {isDeleting
                  ? "Устгаж байна..."
                  : `🗑️ Устгах (${selectedCount})`}
              </button>
              <button
                onClick={() => {
                  setIsSelectMode(false);
                  setRowSelection({});
                }}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
              >
                Цуцлах
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/withrawals/new")}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
              >
                + Мөнгө татах
              </button>
              <button
                onClick={() => setIsSelectMode(true)}
                className="rounded-lg border px-4 py-2 text-sm text-red-500 hover:bg-red-50"
              >
                🗑️ Устгах
              </button>
            </>
          )}
        </div>
      </div>

      {/* Selection info bar */}
      {isSelectMode && selectedCount > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
          <span className="text-sm text-blue-800 dark:text-blue-300">
            {selectedCount} гүйлгээ сонгогдсон (нийт $
            {selectedRowIds
              .map((id) => withdrawals.find((w) => w.id === id)?.amount || 0)
              .reduce((a, b) => a + b, 0)
              .toLocaleString()}
            )
          </span>
          <button
            onClick={() => setRowSelection({})}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Сонголтыг арилгах
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 text-center text-gray-500"
                >
                  📭 Гүйлгээ байхгүй
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
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
                      className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredData.length > 0 && (
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
                  {size} харуулах
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
              { length: Math.min(5, table.getPageCount()) },
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
      )}
    </div>
  );
}
