import Link from "next/link";

const features = [
  {
    icon: "📝",
    color: "bg-amber-100",
    title: "Effortless Expense Logging",
    description:
      "Record any purchase in seconds. Add amount, category, date, and a short description with a clean, distraction-free form.",
  },
  {
    icon: "🗂️",
    color: "bg-orange-100",
    title: "Smart Categories",
    description:
      "Organise spending into categories like Food, Transport, Shopping, and more so you always know where your money is going.",
  },
  {
    icon: "💰",
    color: "bg-yellow-100",
    title: "Monthly Budget Planner",
    description:
      "Set a monthly spending target and get an automatic grade — Excellent, Good, Fair, or Over Budget — at a glance.",
  },
  {
    icon: "📊",
    color: "bg-lime-100",
    title: "Spending Summary",
    description:
      "See your total spending and a breakdown by category so you instantly know which areas are costing the most.",
  },
  {
    icon: "✏️",
    color: "bg-stone-100",
    title: "View & Edit History",
    description:
      "Browse your full expense history, edit any record, or delete ones you no longer need — all from one clean list.",
  },
  {
    icon: "🔒",
    color: "bg-teal-100",
    title: "Private & Secure",
    description:
      "Your data is tied to your account and never shared. Log in from any device and your history is always there.",
  },
];

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
            BudgetFlow is a simple expense tracker that helps you record daily
            spending, set monthly budgets, and understand your financial habits
            — all in one clean dashboard.
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
