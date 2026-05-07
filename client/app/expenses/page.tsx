"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/dashboard/AppShell";
import ImageImportAction from "@/components/dashboard/ImageImportAction";
import ImageImportModal from "@/components/dashboard/ImageImportModal";
import MonthlyTrendChart from "@/components/dashboard/MonthlyTrendChart";
import {
  categories,
  expenseLabel,
  formatCurrency,
  formatDate,
  getCategoryClass,
  toDateInputValue,
} from "@/components/dashboard/format";
import { useRequireUser } from "@/components/dashboard/useRequireUser";
import type {
  CreateExpenseInput,
  Expense,
  ExpenseListData,
  ExpenseSortBy,
  ExpenseTrendData,
  SortOrder,
  UpdateExpenseInput,
} from "@/lib/api";
import {
  createExpense,
  deleteExpense,
  getExpenseTrend,
  getExpenseYears,
  getExpenses,
  updateExpense,
} from "@/lib/api";

const PAGE_LIMIT = 10;
const MONTH_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];
const defaultForm = {
  title: "",
  amount: "",
  category: "Food & Dining",
  date: new Date().toISOString().slice(0, 10),
  description: "",
};

interface EditFormState {
  title: string;
  amount: string;
  category: string;
  date: string;
  description: string;
}

function ModalShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 px-4 py-8">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        {children}
      </div>
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="fixed inset-0 -z-10 cursor-default"
      />
    </div>
  );
}

function SortButton({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
}: {
  label: string;
  field: ExpenseSortBy;
  sortBy: ExpenseSortBy;
  sortOrder: SortOrder;
  onSort: (field: ExpenseSortBy) => void;
}) {
  const isActive = sortBy === field;

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-2 font-bold text-stone-500 hover:text-stone-900"
    >
      {label}
      <span className={isActive ? "text-amber-600" : "text-stone-300"}>
        {isActive && sortOrder === "asc" ? "^" : "v"}
      </span>
    </button>
  );
}

export default function ExpensesPage() {
  const { user, isCheckingUser } = useRequireUser();
  const [expenseData, setExpenseData] = useState<ExpenseListData | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<ExpenseSortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [monthFilter, setMonthFilter] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [trend, setTrend] = useState<ExpenseTrendData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isImportingImage, setIsImportingImage] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const editForm = useMemo<EditFormState | null>(() => {
    if (!editingExpense) {
      return null;
    }

    return {
      title: editingExpense.title,
      amount: String(editingExpense.amount),
      category: editingExpense.category,
      date: toDateInputValue(editingExpense.date),
      description: editingExpense.description ?? "",
    };
  }, [editingExpense]);

  const [form, setForm] = useState<EditFormState>(defaultForm);

  useEffect(() => {
    if (editForm) {
      setForm(editForm);
      setFormError("");
    }
  }, [editForm]);

  function openAddExpenseModal() {
    setForm(defaultForm);
    setFormError("");
    setIsAddingExpense(true);
  }

  function closeExpenseForm() {
    setIsAddingExpense(false);
    setEditingExpense(null);
    setFormError("");
  }

  function handleImageImportSaved() {
    setIsImportingImage(false);
    setPage(1);
    setSortBy("date");
    setSortOrder("desc");
    loadAvailableYears();

    if (page === 1 && sortBy === "date" && sortOrder === "desc") {
      loadExpenses();
    }
  }

  function loadExpenses() {
    if (!user) {
      return;
    }

    const filters = {
      year: yearFilter ?? undefined,
      month: yearFilter && monthFilter ? monthFilter : undefined,
      search: searchQuery,
    };

    setIsLoading(true);
    Promise.all([
      getExpenses(user.id, page, PAGE_LIMIT, sortBy, sortOrder, filters),
      getExpenseTrend(user.id, filters),
    ])
      .then(([listData, trendData]) => {
        setExpenseData(listData);
        setTrend(trendData);
        setError("");
      })
      .catch((error) => {
        setError(
          error instanceof Error ? error.message : "Failed to load expenses",
        );
      })
      .finally(() => setIsLoading(false));
  }

  function loadAvailableYears() {
    if (!user) {
      return;
    }

    getExpenseYears(user.id)
      .then((data) => setAvailableYears(data.years))
      .catch(() => {
        // non-fatal: dropdown will fall back to "All Years" only
      });
  }

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, sortBy, sortOrder, yearFilter, monthFilter, searchQuery]);

  useEffect(() => {
    loadAvailableYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  function handleYearChange(value: string) {
    setPage(1);
    if (value === "all") {
      setYearFilter(null);
      setMonthFilter(null);
      return;
    }
    setYearFilter(Number(value));
  }

  function handleMonthChange(value: string) {
    setPage(1);
    setMonthFilter(value === "all" ? null : Number(value));
  }

  function handleSort(field: ExpenseSortBy) {
    setPage(1);
    if (sortBy === field) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(field);
    setSortOrder("asc");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!editingExpense && !isAddingExpense) {
      return;
    }

    const parsedAmount = Number(form.amount);

    if (!form.title.trim() || !form.category || !form.date || parsedAmount <= 0) {
      setFormError("Please fill out title, amount, category, and date.");
      return;
    }

    const payload: UpdateExpenseInput = {
      title: form.title.trim(),
      amount: parsedAmount,
      category: form.category,
      date: form.date,
      description: form.description.trim(),
    };

    setIsSaving(true);
    setFormError("");

    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, payload);
      } else if (user) {
        const createPayload: CreateExpenseInput = {
          ...payload,
          userId: user.id,
        };
        await createExpense(createPayload);
        setPage(1);
        setSortBy("date");
        setSortOrder("desc");
      }

      closeExpenseForm();
      loadExpenses();
      loadAvailableYears();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to save expense",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingExpense) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteExpense(deletingExpense.id);
      setDeletingExpense(null);
      loadExpenses();
      loadAvailableYears();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete expense",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (isCheckingUser || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-amber-50 text-stone-500">
        Loading...
      </main>
    );
  }

  const pagination = expenseData?.pagination;

  let trendRangeLabel: string;
  let trendSubtitle: string;
  if (yearFilter && monthFilter) {
    trendRangeLabel = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(new Date(yearFilter, monthFilter - 1, 1));
    trendSubtitle = "By day";
  } else if (yearFilter) {
    trendRangeLabel = String(yearFilter);
    trendSubtitle = "By month";
  } else {
    trendRangeLabel = "All Time";
    trendSubtitle = "By year";
  }

  return (
    <AppShell user={user}>
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-stone-950">
            Expense Records
          </h1>
          <p className="mt-2 text-lg font-medium text-stone-500">
            Manage and review all your expense transactions.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={openAddExpenseModal}
            className="inline-flex items-center justify-center gap-3 rounded-2xl bg-amber-500 px-6 py-4 text-lg font-black text-white shadow-sm transition-colors hover:bg-amber-600"
          >
            <span className="text-2xl leading-none">+</span>
            Add Expense
          </button>
          <ImageImportAction onImport={() => setIsImportingImage(true)} />
        </div>
      </section>

      <div className="mx-auto mt-8 grid w-full max-w-3xl grid-cols-2 gap-5">
        <div className="rounded-2xl border border-stone-100 bg-white px-6 py-6 text-center shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-stone-500">
            Total Records
          </p>
          <p className="mt-3 text-4xl font-black tracking-tight text-stone-950">
            {pagination?.totalRecords ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-100 bg-white px-6 py-6 text-center shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-stone-500">
            Filtered Total
          </p>
          <p className="mt-3 text-4xl font-black tracking-tight text-stone-950">
            {formatCurrency(expenseData?.filteredTotal ?? 0)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
            🔍
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search expenses..."
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-3 pl-11 pr-4 text-base font-medium outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
              ▾
            </span>
            <select
              value={yearFilter ?? "all"}
              onChange={(e) => handleYearChange(e.target.value)}
              className="appearance-none rounded-2xl border-2 border-indigo-300 bg-white py-3 pl-10 pr-8 text-base font-semibold text-stone-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="all">All Years</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="relative">
            <span
              className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${
                yearFilter ? "text-stone-400" : "text-stone-300"
              }`}
            >
              ▾
            </span>
            <select
              value={monthFilter ?? "all"}
              onChange={(e) => handleMonthChange(e.target.value)}
              disabled={!yearFilter}
              className={`appearance-none rounded-2xl border-2 py-3 pl-10 pr-8 text-base font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 ${
                yearFilter
                  ? "border-indigo-300 bg-white text-stone-900"
                  : "cursor-not-allowed border-stone-200 bg-stone-50 text-stone-400"
              }`}
            >
              <option value="all">All Months</option>
              {MONTH_OPTIONS.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 font-medium text-red-600">
          {error}
        </div>
      )}

      <section className="mt-8 overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">
        <div className="hidden grid-cols-[1fr_2fr_1.5fr_1fr_1fr] gap-4 border-b border-stone-100 bg-stone-50 px-6 py-4 text-sm sm:grid">
          <SortButton
            label="Date"
            field="date"
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
          <SortButton
            label="Description"
            field="title"
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
          <SortButton
            label="Category"
            field="category"
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
          <SortButton
            label="Amount"
            field="amount"
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
          <span className="text-right font-bold text-stone-500">Actions</span>
        </div>

        {isLoading ? (
          <p className="px-6 py-8 text-stone-500">Loading expenses...</p>
        ) : expenseData && expenseData.expenses.length > 0 ? (
          expenseData.expenses.map((expense) => (
            <div
              key={expense.id}
              className="grid gap-4 border-b border-stone-100 px-6 py-5 last:border-b-0 sm:grid-cols-[1fr_2fr_1.5fr_1fr_1fr] sm:items-center"
            >
              <p className="font-medium text-stone-600">
                {formatDate(expense.date)}
              </p>
              <p className="text-lg font-bold text-stone-800">
                {expenseLabel(expense)}
              </p>
              <div>
                <span
                  className={`inline-flex rounded-xl px-3 py-2 text-sm font-bold ${getCategoryClass(
                    expense.category,
                  )}`}
                >
                  {expense.category}
                </span>
              </div>
              <p className="text-lg font-black text-stone-950">
                {formatCurrency(expense.amount)}
              </p>
              <div className="flex gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setEditingExpense(expense)}
                  className="rounded-xl bg-amber-50 px-4 py-2 font-bold text-amber-700 hover:bg-amber-100"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingExpense(expense)}
                  className="rounded-xl bg-red-50 px-4 py-2 font-bold text-red-600 hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="px-6 py-8 text-stone-500">No expenses found.</p>
        )}

        {pagination && pagination.totalRecords > 0 && (
          <div className="flex flex-col gap-4 border-t border-stone-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium text-stone-400">
              Showing {pagination.showingFrom}-{pagination.showingTo} of{" "}
              {pagination.totalRecords}
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: pagination.totalPages }, (_, index) => {
                const pageNumber = index + 1;

                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    className={`h-11 min-w-11 rounded-xl border px-4 font-black ${
                      page === pageNumber
                        ? "border-amber-500 bg-amber-500 text-white"
                        : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="mt-8">
        <MonthlyTrendChart
          data={trend?.points ?? []}
          title={`Spending Trend – ${trendRangeLabel}`}
          subtitle={trendSubtitle}
        />
      </section>

      {(editingExpense || isAddingExpense) && (
        <ModalShell onClose={closeExpenseForm}>
          <form onSubmit={handleSave}>
            <div className="flex items-start justify-between border-b border-stone-100 px-7 py-6">
              <div>
                <p className="text-3xl font-black text-stone-950">
                  {editingExpense ? "Edit Expense" : "Add New Expense"}
                </p>
                <p className="mt-1 text-stone-500">
                  {editingExpense
                    ? "Update the expense details below."
                    : "Fill in the details to record your expense."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeExpenseForm}
                className="rounded-2xl bg-stone-100 px-4 py-3 text-xl font-bold text-stone-500 hover:bg-stone-200"
              >
                X
              </button>
            </div>

            <div className="space-y-5 px-7 py-6">
              <label className="block">
                <span className="font-bold text-stone-700">Title *</span>
                <input
                  value={form.title}
                  placeholder="What was this expense for?"
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-amber-400"
                />
              </label>
              <label className="block">
                <span className="font-bold text-stone-700">Amount *</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  placeholder="0.00"
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-amber-400"
                />
              </label>
              <label className="block">
                <span className="font-bold text-stone-700">Category *</span>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="font-bold text-stone-700">Date *</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-amber-400"
                />
              </label>
              <label className="block">
                <span className="font-bold text-stone-700">Description</span>
                <textarea
                  value={form.description}
                  placeholder="Optional notes"
                  maxLength={100}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="mt-2 min-h-28 w-full rounded-2xl border border-stone-200 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="mt-1 block text-right text-sm text-stone-400">
                  {form.description.length}/100
                </span>
              </label>
              {formError && (
                <p className="rounded-xl bg-red-50 px-4 py-3 font-medium text-red-600">
                  {formError}
                </p>
              )}
            </div>

            <div className="grid gap-3 px-7 pb-7 sm:grid-cols-2">
              <button
                type="button"
                onClick={closeExpenseForm}
                className="rounded-2xl border border-stone-200 px-5 py-4 text-lg font-black text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-2xl bg-amber-500 px-5 py-4 text-lg font-black text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving
                  ? "Saving..."
                  : editingExpense
                    ? "Save Changes"
                    : "Add Expense"}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {deletingExpense && (
        <ModalShell onClose={() => setDeletingExpense(null)}>
          <div className="px-8 py-9 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-3xl font-black text-red-600">
              !
            </div>
            <h2 className="mt-6 text-3xl font-black text-stone-950">
              Delete Expense?
            </h2>
            <p className="mt-4 text-xl font-medium text-stone-500">
              {expenseLabel(deletingExpense)}
            </p>
            <p className="mt-3 text-2xl font-black text-stone-950">
              {formatCurrency(deletingExpense.amount)}
            </p>
            <p className="mt-8 text-lg font-medium text-stone-400">
              This action cannot be undone.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDeletingExpense(null)}
                className="rounded-2xl border border-stone-200 px-5 py-4 text-lg font-black text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-2xl bg-red-600 px-5 py-4 text-lg font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {isImportingImage && (
        <ImageImportModal
          userId={user.id}
          onClose={() => setIsImportingImage(false)}
          onSaved={handleImageImportSaved}
        />
      )}
    </AppShell>
  );
}
