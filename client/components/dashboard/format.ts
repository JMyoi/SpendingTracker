import type { BudgetRanking, Expense } from "@/lib/api";

export const categories = [
  "Food",
  "Food & Dining",
  "Groceries",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills",
  "Bills & Utilities",
  "Health",
  "Healthcare",
  "Personal Care",
  "Education",
  "Travel",
  "Subscriptions",
];

const categoryStyles: Record<string, string> = {
  Food: "bg-orange-50 text-orange-600",
  "Food & Dining": "bg-orange-50 text-orange-600",
  Groceries: "bg-lime-50 text-lime-700",
  Transportation: "bg-blue-50 text-blue-600",
  Shopping: "bg-violet-50 text-violet-600",
  Entertainment: "bg-pink-50 text-pink-600",
  Bills: "bg-yellow-50 text-yellow-700",
  "Bills & Utilities": "bg-yellow-50 text-yellow-700",
  Health: "bg-red-50 text-red-600",
  Healthcare: "bg-red-50 text-red-600",
  "Personal Care": "bg-rose-50 text-rose-600",
  Education: "bg-emerald-50 text-emerald-700",
  Travel: "bg-cyan-50 text-cyan-700",
  Subscriptions: "bg-stone-100 text-stone-600",
};

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatMonth(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function toDateInputValue(date: string) {
  return new Date(date).toISOString().slice(0, 10);
}

export function getCategoryClass(category: string) {
  return categoryStyles[category] ?? "bg-amber-50 text-amber-700";
}

const categoryChartColors: Record<string, string> = {
  Food: "#ea580c",
  "Food & Dining": "#ea580c",
  Groceries: "#4d7c0f",
  Transportation: "#2563eb",
  Shopping: "#7c3aed",
  Entertainment: "#db2777",
  Bills: "#a16207",
  "Bills & Utilities": "#a16207",
  Health: "#dc2626",
  Healthcare: "#dc2626",
  "Personal Care": "#e11d48",
  Education: "#047857",
  Travel: "#0e7490",
  Subscriptions: "#57534e",
};

export function getCategoryChartColor(category: string) {
  return categoryChartColors[category] ?? "#d97706";
}

const categoryEmojis: Record<string, string> = {
  Food: "🍔",
  "Food & Dining": "🍔",
  Groceries: "🛒",
  Transportation: "🚗",
  Shopping: "🛍️",
  Entertainment: "🎬",
  Bills: "⚡",
  "Bills & Utilities": "⚡",
  Health: "🏥",
  Healthcare: "🏥",
  "Personal Care": "💅",
  Education: "🎓",
  Travel: "✈️",
  Subscriptions: "📺",
};

export function getCategoryEmoji(category: string) {
  return categoryEmojis[category] ?? "💰";
}

export interface RankingStyle {
  pillBg: string;
  pillText: string;
  barBg: string;
  bannerBg: string;
  bannerText: string;
  label: string;
}

export const rankingStyles: Record<BudgetRanking, RankingStyle> = {
  excellent: {
    pillBg: "bg-emerald-50",
    pillText: "text-emerald-600",
    barBg: "bg-emerald-500",
    bannerBg: "bg-emerald-50",
    bannerText: "text-emerald-700",
    label: "Excellent",
  },
  ok: {
    pillBg: "bg-sky-50",
    pillText: "text-sky-600",
    barBg: "bg-sky-500",
    bannerBg: "bg-sky-50",
    bannerText: "text-sky-700",
    label: "OK",
  },
  fair: {
    pillBg: "bg-amber-50",
    pillText: "text-amber-600",
    barBg: "bg-amber-500",
    bannerBg: "bg-amber-50",
    bannerText: "text-amber-700",
    label: "Fair",
  },
  bad: {
    pillBg: "bg-red-50",
    pillText: "text-red-600",
    barBg: "bg-red-500",
    bannerBg: "bg-red-50",
    bannerText: "text-red-700",
    label: "Bad",
  },
};

export function expenseLabel(expense: Expense) {
  return expense.title || expense.description || "Untitled expense";
}
