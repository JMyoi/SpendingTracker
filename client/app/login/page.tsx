"use client";

import { useState } from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log({ email, password });
    alert("Login submitted! (UI only — backend not connected yet)");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-amber-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        {/* Logo */}
        <Link
          href="/"
          className="block text-center text-xl font-bold text-amber-600 hover:text-amber-700"
        >
          BudgetFlow
        </Link>

        <div className="mt-6">
          <h1 className="text-2xl font-bold text-stone-900">Welcome back</h1>
          <p className="mt-1 text-sm text-stone-500">Log in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Input
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Input
            label="Password"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button type="submit" fullWidth variant="primary">
            Log In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-amber-600 hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
