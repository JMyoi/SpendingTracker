"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { registerUser, storeCurrentUser } from "@/lib/api";

const COMMON_PASSWORD_DENYLIST = new Set([
  "password",
  "password123",
  "qwerty123",
  "letmein",
  "admin123",
  "123456789",
  "111111111111",
]);

function validatePassword(password: string): string | null {
  if (password.length < 12) {
    return "Password must be at least 12 characters long.";
  }

  if (password.length > 128) {
    return "Password must be no more than 128 characters long.";
  }

  if (password !== password.trim()) {
    return "Password must not start or end with whitespace.";
  }

  if (COMMON_PASSWORD_DENYLIST.has(password.toLowerCase())) {
    return "Please choose a less common password.";
  }

  return null;
}

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await registerUser(username, email.trim(), password);
      storeCurrentUser(data.user);
      router.push("/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-amber-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        {/* Logo */}
        <Link
          href="/"
          className="block text-center text-xl font-bold text-amber-600 hover:text-amber-700"
        >
          BudgetFlow
        </Link>

        <div className="mt-6">
          <h1 className="text-2xl font-bold text-stone-900">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Start tracking your expenses today
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Input
            label="Username"
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="johndoe"
            required
          />
          <Input
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <div>
            <Input
              label="Password"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <p className="mt-2 text-sm text-stone-500">
              Use at least 12 characters. Longer passphrases are recommended.
            </p>
          </div>
          <Input
            label="Confirm Password"
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <Button type="submit" fullWidth variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-amber-600 hover:underline"
          >
            Log In
          </Link>
        </p>
      </div>
    </main>
  );
}
