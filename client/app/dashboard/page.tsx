"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/dashboard/AppShell";
import CategoryDonutChart from "@/components/dashboard/CategoryDonutChart";
import ImageImportAction from "@/components/dashboard/ImageImportAction";
import ExpenseRow from "@/components/dashboard/ExpenseRow";
import ImageImportModal from "@/components/dashboard/ImageImportModal";
import MonthlyTrendChart from "@/components/dashboard/MonthlyTrendChart";
import {
  categories,
  formatCurrency,
  formatMonth,
  rankingStyles,
} from "@/components/dashboard/format";
import { useRequireUser } from "@/components/dashboard/useRequireUser";
import type {
  BudgetAnalysis,
  CreateExpenseInput,
  DashboardData,
} from "@/lib/api";
import { createExpense, getBudget, getDashboard } from "@/lib/api";

const defaultForm = {
  title: "",
  amount: "",
  category: "Food & Dining",
  date: new Date().toISOString().slice(0, 10),
  description: "",
};

function StatCard({
  title,
  amount,
  detail,
  icon,
}: {
  title: string;
  amount: number;
  detail: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-6">
        <p className="text-lg font-bold text-stone-500">{title}</p>
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl font-black text-amber-600">
          {icon}
        </span>
      </div>
      <p className="mt-10 text-4xl font-black tracking-tight text-stone-950">
        {formatCurrency(amount)}
      </p>
      <p className="mt-4 text-lg font-medium text-stone-400">{detail}</p>
    </div>
  );
}

function BudgetStatusCard({ budget }: { budget: BudgetAnalysis | null }) {
  const hasBudget = budget?.budget != null && budget.percentage != null;
  const styles = hasBudget && budget.ranking ? rankingStyles[budget.ranking] : null;
  const percentage = budget?.percentage ?? 0;
  const remaining = budget?.remaining ?? 0;

  return (
    <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-6">
        <p className="text-lg font-bold text-stone-500">Budget Status</p>
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${
            styles ? `${styles.pillBg} ${styles.pillText}` : "bg-stone-100 text-stone-400"
          }`}
        >
          🎯
        </span>
      </div>

      {hasBudget ? (
        <>
          <p className="mt-10 text-4xl font-black tracking-tight text-stone-950">
            {percentage.toFixed(0)}%
          </p>
          <p className="mt-4 text-lg font-medium text-stone-400">
            {remaining >= 0
              ? `${formatCurrency(remaining)} remaining`
              : `${formatCurrency(Math.abs(remaining))} over budget`}
          </p>
        </>
      ) : (
        <>
          <p className="mt-10 text-4xl font-black tracking-tight text-stone-400">
            Not set
          </p>
          <Link
            href="/budget"
            className="mt-4 inline-block text-lg font-bold text-indigo-600 hover:text-indigo-700"
          >
            Set a budget -&gt;
          </Link>
        </>
      )}
    </div>
  );
}

function MonthlyBudgetBar({ budget }: { budget: BudgetAnalysis | null }) {
  if (!budget) {
    return null;
  }

  const monthName = formatMonth(
    new Date(`${budget.month}-01T00:00:00`),
  );

  if (budget.budget == null) {
    return (
      <section className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">
        <div className="flex items-start gap-4">
          <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-amber-500 text-base font-black text-amber-600">
            !
          </span>
          <div>
            <p className="text-lg font-black text-amber-800">
              No Budget Set for {monthName}
            </p>
            <p className="mt-1 text-sm font-medium text-amber-700">
              Set a budget to track your monthly spending performance.
            </p>
          </div>
        </div>
        <Link
          href="/budget"
          className="shrink-0 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-amber-600"
        >
          Set Budget
        </Link>
      </section>
    );
  }

  const styles = budget.ranking ? rankingStyles[budget.ranking] : rankingStyles.excellent;
  const barWidth = Math.min(budget.percentage ?? 0, 100);

  return (
    <section className="mt-8 rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-stone-900">
            Monthly Budget &ndash; {monthName}
          </h2>
          <p className="mt-1 text-sm font-medium text-stone-500">
            {formatCurrency(budget.spent)} spent of {formatCurrency(budget.budget)} budget
          </p>
        </div>
        <Link
          href="/budget"
          className="text-sm font-black text-indigo-600 hover:text-indigo-700"
        >
          View Details ↗
        </Link>
      </div>

      <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
        <div
          className={`h-full rounded-full transition-all ${styles.barBg}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-sm font-semibold text-stone-400">
        <span>$0</span>
        <span>{(budget.percentage ?? 0).toFixed(0)}% used</span>
        <span>{formatCurrency(budget.budget)}</span>
      </div>
    </section>
  );
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const { user, isCheckingUser } = useRequireUser();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [budget, setBudget] = useState<BudgetAnalysis | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isImportingImage, setIsImportingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(defaultForm);

  function loadDashboard() {
    if (!user) {
      return;
    }

    setIsLoading(true);
    Promise.all([getDashboard(user.id), getBudget(user.id, currentMonthKey())])
      .then(([dashboardData, budgetData]) => {
        setDashboard(dashboardData);
        setBudget(budgetData);
        setError("");
      })
      .catch((error) => {
        setError(
          error instanceof Error ? error.message : "Failed to load dashboard",
        );
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function openAddExpenseModal() {
    setForm(defaultForm);
    setFormError("");
    setIsAddingExpense(true);
  }

  function closeAddExpenseModal() {
    setIsAddingExpense(false);
    setFormError("");
  }

  function handleImageImportSaved() {
    setIsImportingImage(false);
    loadDashboard();
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();

    if (!user) {
      return;
    }

    const parsedAmount = Number(form.amount);

    if (!form.title.trim() || !form.category || !form.date || parsedAmount <= 0) {
      setFormError("Please fill out title, amount, category, and date.");
      return;
    }

    const payload: CreateExpenseInput = {
      userId: user.id,
      title: form.title.trim(),
      amount: parsedAmount,
      category: form.category,
      date: form.date,
      description: form.description.trim(),
    };

    setIsSaving(true);
    setFormError("");

    try {
      await createExpense(payload);
      closeAddExpenseModal();
      loadDashboard();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to add expense",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isCheckingUser || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-amber-50 text-stone-500">
        Loading...
      </main>
    );
  }

  return (
    <AppShell user={user}>
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-stone-950">
            Welcome back, {user.username}!
          </h1>
          <p className="mt-3 text-lg font-medium text-stone-500">
            {formatMonth()} . Here&apos;s your spending overview
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

      {error && (
        <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 font-medium text-red-600">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="mt-8 rounded-2xl bg-white p-8 text-stone-500 shadow-sm">
          Loading dashboard...
        </div>
      ) : dashboard ? (
        <>
          <section className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Spent This Month"
              amount={dashboard.spentThisMonth.amount}
              detail={`${dashboard.spentThisMonth.transactionCount} transactions`}
              icon="$"
            />
            <StatCard
              title="Total Expenses"
              amount={dashboard.totalExpenses.amount}
              detail={`${dashboard.totalExpenses.recordCount} all-time records`}
              icon="%"
            />
            <BudgetStatusCard budget={budget} />
          </section>

          <MonthlyBudgetBar budget={budget} />

          <section className="mt-8 grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <MonthlyTrendChart
                data={dashboard.monthlyTrend}
                title="Monthly Spending Trend"
                subtitle="Last 6 months"
              />
            </div>
            <CategoryDonutChart data={dashboard.categoryBreakdown} />
          </section>

          <section className="mt-8 overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-5 sm:px-6">
              <h2 className="text-2xl font-black text-stone-900">
                Recent Expenses
              </h2>
              <Link
                href="/expenses"
                className="font-bold text-amber-600 hover:text-amber-700"
              >
                View All -&gt;
              </Link>
            </div>
            {dashboard.recentExpenses.length === 0 ? (
              <p className="border-t border-stone-100 px-6 py-8 text-stone-500">
                No expenses yet.
              </p>
            ) : (
              dashboard.recentExpenses.map((expense) => (
                <ExpenseRow key={expense.id} expense={expense} compact />
              ))
            )}
          </section>
        </>
      ) : null}

      {isAddingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 px-4 py-8">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <form onSubmit={handleAddExpense}>
              <div className="flex items-start justify-between border-b border-stone-100 px-7 py-6">
                <div>
                  <p className="text-3xl font-black text-stone-950">
                    Add New Expense
                  </p>
                  <p className="mt-1 text-stone-500">
                    Fill in the details to record your expense.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeAddExpenseModal}
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
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
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
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
                    }
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
                    onChange={(e) =>
                      setForm({ ...form, date: e.target.value })
                    }
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
                  onClick={closeAddExpenseModal}
                  className="rounded-2xl border border-stone-200 px-5 py-4 text-lg font-black text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-2xl bg-amber-500 px-5 py-4 text-lg font-black text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
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
