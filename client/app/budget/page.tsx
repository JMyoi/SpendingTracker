"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/dashboard/AppShell";
import BudgetComparisonChart from "@/components/dashboard/BudgetComparisonChart";
import {
  formatCurrency,
  getCategoryChartColor,
  getCategoryEmoji,
  rankingStyles,
} from "@/components/dashboard/format";
import { useRequireUser } from "@/components/dashboard/useRequireUser";
import type { BudgetAnalysis, BudgetComparisonData } from "@/lib/api";
import {
  getBudget,
  getBudgetComparison,
  getBudgetYears,
  setBudget,
} from "@/lib/api";

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

function monthKey(year: number, monthNumber: number) {
  return `${year}-${String(monthNumber).padStart(2, "0")}`;
}

function monthLabel(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
}

export default function BudgetPage() {
  const { user, isCheckingUser } = useRequireUser();
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonthNumber = today.getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonthNumber, setSelectedMonthNumber] =
    useState<number>(currentMonthNumber);
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear]);
  const [analysis, setAnalysis] = useState<BudgetAnalysis | null>(null);
  const [comparison, setComparison] = useState<BudgetComparisonData | null>(
    null,
  );
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [budgetInput, setBudgetInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const selectedMonth = monthKey(selectedYear, selectedMonthNumber);

  function loadAnalysis(userId: number, month: string) {
    setIsLoading(true);
    setError("");
    return getBudget(userId, month)
      .then((data) => setAnalysis(data))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load budget");
      })
      .finally(() => setIsLoading(false));
  }

  function loadAvailableYears(userId: number) {
    return getBudgetYears(userId)
      .then((data) => {
        if (data.years.length > 0) {
          setAvailableYears(data.years);
        }
      })
      .catch(() => {
        // non-fatal: dropdown falls back to the current year only
      });
  }

  function loadComparison(userId: number, month: string) {
    return getBudgetComparison(userId, month)
      .then((data) => setComparison(data))
      .catch(() => {
        // non-fatal: chart will hide
      });
  }

  useEffect(() => {
    if (!user) {
      return;
    }
    loadAnalysis(user.id, selectedMonth);
    loadComparison(user.id, selectedMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedMonth]);

  useEffect(() => {
    if (!user) {
      return;
    }
    loadAvailableYears(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleSubmitBudget(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      return;
    }

    const parsed = Number(budgetInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setSaveError("Enter a positive amount.");
      return;
    }

    setIsSaving(true);
    setSaveError("");
    try {
      await setBudget(user.id, selectedMonth, parsed);
      setBudgetInput("");
      await Promise.all([
        loadAnalysis(user.id, selectedMonth),
        loadAvailableYears(user.id),
        loadComparison(user.id, selectedMonth),
      ]);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
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

  const selectedMonthBudget = analysis?.budget ?? null;
  const yearOptions = availableYears.includes(selectedYear)
    ? availableYears
    : [...availableYears, selectedYear].sort((a, b) => b - a);

  return (
    <AppShell user={user}>
      <section className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight text-stone-950">
          Budget
        </h1>
        <p className="text-lg font-medium text-stone-500">
          Set a monthly limit and review how your spending compares.
        </p>
      </section>

      {error && (
        <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 font-medium text-red-600">
          {error}
        </div>
      )}

      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        <form
          onSubmit={handleSubmitBudget}
          className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm"
        >
          <h2 className="text-2xl font-black text-stone-900">
            Update Budget for {monthLabel(selectedMonth)}
          </h2>
          <p className="mt-1 text-sm font-medium text-stone-500">
            Current:{" "}
            {selectedMonthBudget !== null
              ? formatCurrency(selectedMonthBudget)
              : "Not set"}
          </p>
          <div className="mt-5 flex gap-3">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-stone-400">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={budgetInput}
                placeholder={
                  selectedMonthBudget !== null
                    ? String(selectedMonthBudget)
                    : "1000"
                }
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-3 pl-10 pr-4 text-lg font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl bg-indigo-500 px-6 py-3 text-lg font-black text-white shadow-sm transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Update"}
            </button>
          </div>
          {saveError && (
            <p className="mt-3 text-sm font-semibold text-red-600">
              {saveError}
            </p>
          )}
        </form>

        <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-stone-900">
            Select Month to Analyze
          </h2>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                ▾
              </span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full appearance-none rounded-2xl border-2 border-indigo-300 bg-white py-3 pl-10 pr-8 text-base font-semibold text-stone-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <label className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                ▾
              </span>
              <select
                value={selectedMonthNumber}
                onChange={(e) =>
                  setSelectedMonthNumber(Number(e.target.value))
                }
                className="w-full appearance-none rounded-2xl border-2 border-indigo-300 bg-white py-3 pl-10 pr-8 text-base font-semibold text-stone-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                {MONTH_OPTIONS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p
            className={`mt-3 flex items-center gap-2 text-sm font-semibold ${
              analysis?.budget != null
                ? "text-emerald-600"
                : "text-stone-400"
            }`}
          >
            {analysis?.budget != null ? (
              <>
                <span aria-hidden>✓</span>
                Budget set: {formatCurrency(analysis.budget)}
              </>
            ) : (
              <>No budget recorded for this month.</>
            )}
          </p>
        </div>
      </section>

      {isLoading && !analysis ? (
        <div className="mt-8 rounded-2xl bg-white p-8 text-stone-500 shadow-sm">
          Loading budget analysis...
        </div>
      ) : analysis ? (
        <BudgetAnalysisCard analysis={analysis} />
      ) : null}

      {analysis && analysis.categoryBreakdown.length > 0 && (
        <CategorySpendingCard
          month={analysis.month}
          entries={analysis.categoryBreakdown}
        />
      )}

      {comparison && (
        <BudgetComparisonChart data={comparison.months} />
      )}
    </AppShell>
  );
}

function BudgetAnalysisCard({ analysis }: { analysis: BudgetAnalysis }) {
  if (analysis.budget === null) {
    return (
      <section className="mt-8 flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">
        <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-amber-500 text-base font-black text-amber-600">
          !
        </span>
        <div>
          <p className="text-lg font-black text-amber-800">No Budget Set</p>
          <p className="mt-1 text-sm font-medium text-amber-700">
            Set a budget for {monthLabel(analysis.month)} above to start
            tracking your spending performance.
          </p>
        </div>
      </section>
    );
  }

  const ranking = analysis.ranking ?? "excellent";
  const styles = rankingStyles[ranking];
  const percentage = analysis.percentage ?? 0;
  const barWidth = Math.min(percentage, 100);
  const remaining = analysis.remaining ?? 0;

  return (
    <section className="mt-8 rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900">
            Budget Analysis – {monthLabel(analysis.month)}
          </h2>
          <p className="mt-1 text-sm font-medium text-stone-500">
            {analysis.transactionCount} expenses recorded
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${styles.pillBg} ${styles.pillText}`}
        >
          <span aria-hidden>🎖</span>
          {styles.label}
        </span>
      </div>

      <div className="mt-6 flex items-baseline justify-between text-sm font-semibold text-stone-600">
        <span>Spent: {formatCurrency(analysis.spent)}</span>
        <span>Budget: {formatCurrency(analysis.budget)}</span>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
        <div
          className={`h-full rounded-full transition-all ${styles.barBg}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <div className="mt-3 flex items-baseline justify-between text-sm font-bold">
        <span className={styles.pillText}>
          {percentage.toFixed(0)}% of budget used
        </span>
        <span className={styles.pillText}>
          {remaining >= 0
            ? `${formatCurrency(remaining)} remaining`
            : `${formatCurrency(Math.abs(remaining))} over budget`}
        </span>
      </div>

      {analysis.message && (
        <div
          className={`mt-5 flex items-center gap-3 rounded-xl px-4 py-3 ${styles.bannerBg} ${styles.bannerText}`}
        >
          <span aria-hidden>🎖</span>
          <p className="text-sm font-semibold">{analysis.message}</p>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-stone-100 bg-stone-50 px-6 py-5 text-center">
          <p className="text-sm font-semibold text-stone-500">Daily Average</p>
          <p className="mt-2 text-3xl font-black text-stone-950">
            {formatCurrency(analysis.dailyAverage)}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-100 bg-stone-50 px-6 py-5 text-center">
          <p className="text-sm font-semibold text-stone-500">Transactions</p>
          <p className="mt-2 text-3xl font-black text-stone-950">
            {analysis.transactionCount}
          </p>
        </div>
      </div>
    </section>
  );
}

function CategorySpendingCard({
  month,
  entries,
}: {
  month: string;
  entries: BudgetAnalysis["categoryBreakdown"];
}) {
  return (
    <section className="mt-8 rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-black text-stone-900">
        Spending by Category – {monthLabel(month)}
      </h2>
      <ul className="mt-6 space-y-5">
        {entries.map((entry) => {
          const color = getCategoryChartColor(entry.category);
          const barWidth = Math.min(entry.percentage, 100);
          return (
            <li key={entry.category}>
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-3 text-base font-semibold text-stone-800">
                  <span aria-hidden className="text-xl">
                    {getCategoryEmoji(entry.category)}
                  </span>
                  {entry.category}
                </span>
                <span className="flex items-baseline gap-3 text-base">
                  <span className="font-semibold text-stone-400">
                    {entry.percentage.toFixed(0)}%
                  </span>
                  <span className="font-black text-stone-950">
                    {formatCurrency(entry.amount)}
                  </span>
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
