"use client";

import AppShell from "@/components/dashboard/AppShell";
import { useRequireUser } from "@/components/dashboard/useRequireUser";

export default function BudgetPage() {
  const { user, isCheckingUser } = useRequireUser();

  if (isCheckingUser || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-amber-50 text-stone-500">
        Loading...
      </main>
    );
  }

  return (
    <AppShell user={user}>
      <div className="rounded-2xl border border-stone-100 bg-white p-10 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-600">
          Coming Later
        </p>
        <h1 className="mt-3 text-4xl font-black text-stone-950">Budget</h1>
        <p className="mt-3 max-w-2xl text-lg text-stone-500">
          Budget planning will be added in a future iteration.
        </p>
      </div>
    </AppShell>
  );
}
