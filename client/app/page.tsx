import Link from "next/link";
import BudgetComparisonChart from "@/components/dashboard/BudgetComparisonChart";
import CategoryDonutChart from "@/components/dashboard/CategoryDonutChart";
import MonthlyTrendChart from "@/components/dashboard/MonthlyTrendChart";
import { formatCurrency } from "@/components/dashboard/format";

const previewTrend = [
  { label: "Dec", amount: 980 },
  { label: "Jan", amount: 1240 },
  { label: "Feb", amount: 1105 },
  { label: "Mar", amount: 1620 },
  { label: "Apr", amount: 1390 },
  { label: "May", amount: 1242 },
];

const previewCategories = [
  { category: "Food & Dining", amount: 412 },
  { category: "Bills & Utilities", amount: 305 },
  { category: "Shopping", amount: 248 },
  { category: "Transportation", amount: 168 },
  { category: "Entertainment", amount: 109 },
];

const previewComparison = [
  { month: "2026-02", label: "Feb", budget: 1500, spent: 1105 },
  { month: "2026-03", label: "Mar", budget: 1500, spent: 1620 },
  { month: "2026-04", label: "Apr", budget: 1400, spent: 1390 },
  { month: "2026-05", label: "May", budget: 1500, spent: 1242 },
  { month: "2026-06", label: "Jun", budget: null, spent: 0 },
  { month: "2026-07", label: "Jul", budget: null, spent: 0 },
  { month: "2026-08", label: "Aug", budget: null, spent: 0 },
];

const rankingTiers = [
  { label: "Excellent", swatch: "bg-emerald-500", description: "Under 50% of budget used" },
  { label: "OK", swatch: "bg-sky-500", description: "50–80% used — comfortable pace" },
  { label: "Fair", swatch: "bg-amber-500", description: "80–100% used — getting close" },
  { label: "Bad", swatch: "bg-red-500", description: "Over budget — time to course-correct" },
];

const features = [
  {
    icon: "📝",
    color: "bg-amber-100",
    title: "Effortless Expense Logging",
    description:
      "Log purchases in seconds, or scan a receipt and let OCR read the total automatically.",
  },
  {
    icon: "📈",
    color: "bg-orange-100",
    title: "Visual Spending Insights",
    description:
      "Monthly trend charts and category donuts so you instantly see where money goes — and how it changes over time.",
  },
  {
    icon: "🏆",
    color: "bg-yellow-100",
    title: "Smart Budget Analyzer",
    description:
      "Set a monthly budget and get a clear ranking — Excellent, OK, Fair, or Bad — plus a Budget vs Actual chart over the surrounding months.",
  },
  {
    icon: "🔎",
    color: "bg-lime-100",
    title: "Powerful Filter & Search",
    description:
      "Search expenses by keyword, narrow by year and month, and watch the totals and trend chart adapt instantly.",
  },
  {
    icon: "🗂️",
    color: "bg-stone-100",
    title: "Smart Categories",
    description:
      "Color-coded categories (Food, Travel, Bills, and more) with category-aware totals on every dashboard.",
  },
  {
    icon: "🔒",
    color: "bg-teal-100",
    title: "Private & Secure",
    description:
      "Your data is tied to your account and never shared. Sign in from any device — your history is always there.",
  },
];

function PreviewStatCard({
  title,
  value,
  detail,
  icon,
  iconBg,
  iconText,
}: {
  title: string;
  value: string;
  detail: string;
  icon: string;
  iconBg: string;
  iconText: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-6">
        <p className="text-sm font-bold text-stone-500">{title}</p>
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black ${iconBg} ${iconText}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-6 text-3xl font-black tracking-tight text-stone-950">
        {value}
      </p>
      <p className="mt-2 text-sm font-medium text-stone-400">{detail}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* ── Navbar ── */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-xl font-bold text-amber-600">BudgetFlow</span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-stone-600 hover:text-stone-900"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-b from-amber-50 to-stone-100 px-6 pb-24 pt-16 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="inline-block rounded-full bg-amber-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber-700">
            ✦ Free · No Credit Card Required
          </span>

          <h1 className="mt-6 text-5xl font-extrabold leading-tight text-stone-900 md:text-6xl">
            Stop Guessing Where
            <br />
            <span className="text-amber-500">Your Money Goes</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-stone-600">
            Track daily spending, set monthly budgets, and watch trends unfold
            with built-in charts. Snap a receipt to log it instantly with OCR —
            all in one clean dashboard.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-amber-500 px-7 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors"
            >
              Start Tracking Free →
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-stone-300 bg-white px-7 py-3.5 text-base font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Sign In
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-stone-500">
            <span>✓ Free forever</span>
            <span>✓ Takes 30 seconds to set up</span>
            <span>✓ Private &amp; secure</span>
          </div>
        </div>
      </section>

      {/* ── Live Preview ── */}
      <section className="bg-stone-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <span className="rounded-full bg-indigo-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-600">
              ◉ Live Preview
            </span>
            <h2 className="mt-4 text-4xl font-bold text-stone-900">
              See Your Spending at a Glance
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-stone-500">
              A real preview of your dashboard — stat cards, trend charts, and
              category breakdowns powered by your own data once you sign in.
            </p>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xl sm:p-8">
            <div className="grid gap-5 md:grid-cols-3">
              <PreviewStatCard
                title="Spent This Month"
                value={formatCurrency(1242)}
                detail="38 transactions"
                icon="$"
                iconBg="bg-amber-50"
                iconText="text-amber-600"
              />
              <PreviewStatCard
                title="Total Expenses"
                value={formatCurrency(14890)}
                detail="412 all-time records"
                icon="%"
                iconBg="bg-amber-50"
                iconText="text-amber-600"
              />
              <PreviewStatCard
                title="Budget Status"
                value="62%"
                detail={`${formatCurrency(758)} remaining`}
                icon="🎯"
                iconBg="bg-emerald-50"
                iconText="text-emerald-600"
              />
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <MonthlyTrendChart
                  data={previewTrend}
                  title="Monthly Spending Trend"
                  subtitle="Last 6 months"
                />
              </div>
              <CategoryDonutChart data={previewCategories} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex justify-center">
            <span className="rounded-full bg-amber-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber-600">
              ⚡ Features
            </span>
          </div>
          <h2 className="text-center text-4xl font-bold text-stone-900">
            Everything You Need to Track Spending
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-stone-500">
            No bloat. No complicated setup. BudgetFlow gives you exactly the
            tools you need to understand and control your personal finances.
          </p>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm"
              >
                <div
                  className={`${f.color} mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl text-2xl`}
                >
                  {f.icon}
                </div>
                <h3 className="mb-2 font-semibold text-stone-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-stone-500">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Budget Spotlight ── */}
      <section className="bg-stone-50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="rounded-full bg-indigo-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-600">
                ✦ Budgeting
              </span>
              <h2 className="mt-4 text-4xl font-bold text-stone-900">
                Plan, then prove it.
              </h2>
              <p className="mt-4 text-lg text-stone-600">
                Set a monthly budget and BudgetFlow does the rest — calculating
                what you have left, ranking your performance, and stacking your
                budget against actual spending across the surrounding months.
              </p>
              <ul className="mt-8 space-y-3">
                {rankingTiers.map((tier) => (
                  <li key={tier.label} className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className={`h-3.5 w-3.5 rounded-full ${tier.swatch}`}
                    />
                    <span className="font-semibold text-stone-900">
                      {tier.label}
                    </span>
                    <span className="text-sm text-stone-500">
                      — {tier.description}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <BudgetComparisonChart data={previewComparison} />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA + Footer ── */}
      <section className="bg-stone-800 px-6 py-24 text-center text-white">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-4xl font-bold">
            Ready to Take Control of Your Finances?
          </h2>
          <p className="mt-4 text-stone-400">
            Join users who use BudgetFlow to track daily expenses, plan budgets,
            and understand their spending habits.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-amber-500 px-7 py-3.5 text-base font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              Create Free Account →
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-stone-600 px-7 py-3.5 text-base font-semibold text-stone-300 hover:bg-stone-700 transition-colors"
            >
              Sign In Instead
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-stone-500">
            <span>✓ Free forever</span>
            <span>✦ Private &amp; secure</span>
            <span>⚡ No setup required</span>
          </div>
        </div>
      </section>

      <footer className="bg-stone-800 border-t border-stone-700 px-6 py-6 text-center text-sm text-stone-500">
        © 2026 BudgetFlow. All rights reserved.
      </footer>
    </div>
  );
}
