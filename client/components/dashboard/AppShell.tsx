"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { AuthUser } from "@/lib/api";
import { clearCurrentUser } from "@/lib/api";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "[]" },
  { href: "/expenses", label: "Expenses", icon: "$" },
  { href: "/budget", label: "Budget", icon: "%" },
];

interface AppShellProps {
  user: AuthUser;
  children: React.ReactNode;
}

export default function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  function handleSignOut() {
    clearCurrentUser();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 lg:flex">
      <aside className="flex flex-col border-b border-amber-100 bg-amber-50 text-stone-800 shadow-sm lg:fixed lg:inset-y-0 lg:w-72 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-4 border-b border-amber-100 px-6 py-7">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-2xl font-black text-white shadow-sm">
            $
          </div>
          <div>
            <p className="text-2xl font-black leading-none text-amber-600">
              BudgetFlow
            </p>
            <p className="mt-1 text-sm font-medium text-stone-500">
              Expense Tracker
            </p>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-4 py-5 lg:block lg:flex-1 lg:space-y-2 lg:overflow-visible">
          <p className="hidden px-3 pb-3 text-xs font-bold uppercase tracking-[0.25em] text-amber-700 lg:block">
            Main Menu
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-max items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors lg:text-base ${
                  isActive
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-stone-600 hover:bg-amber-100 hover:text-stone-950"
                }`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-current/30 text-base">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-amber-100 p-4">
          <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-700">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-stone-900">
                  {user.username}
                </p>
                <p className="truncate text-sm text-stone-500">{user.email}</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-4 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold text-stone-500 transition-colors hover:bg-amber-100 hover:text-stone-900"
          >
            <span className="text-xl">-&gt;</span>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="w-full px-4 py-6 sm:px-6 lg:ml-72 lg:px-10 lg:py-8">
        {children}
      </main>
    </div>
  );
}
