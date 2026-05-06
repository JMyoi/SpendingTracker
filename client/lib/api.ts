const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

interface AuthResponse {
  message: string;
  user: AuthUser;
}

export interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyTrendPoint {
  month: string;
  label: string;
  amount: number;
}

export interface CategoryBreakdownEntry {
  category: string;
  amount: number;
}

export interface DashboardData {
  spentThisMonth: {
    amount: number;
    transactionCount: number;
  };
  totalExpenses: {
    amount: number;
    recordCount: number;
  };
  recentExpenses: Expense[];
  monthlyTrend: MonthlyTrendPoint[];
  categoryBreakdown: CategoryBreakdownEntry[];
}

export type ExpenseSortBy = "date" | "title" | "category" | "amount";
export type SortOrder = "asc" | "desc";

export interface ExpenseListData {
  expenses: Expense[];
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    showingFrom: number;
    showingTo: number;
  };
}

export interface UpdateExpenseInput {
  title: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
}

export interface CreateExpenseInput extends UpdateExpenseInput {
  userId: number;
}

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data && typeof data.error === "string"
        ? data.error
        : "Something went wrong. Please try again.";
    throw new Error(message);
  }

  return data as T;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  return requestJson<T>(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export function loginUser(email: string, password: string) {
  return postJson<AuthResponse>("/users/login", { email, password });
}

export function registerUser(username: string, email: string, password: string) {
  return postJson<AuthResponse>("/users/register", {
    username,
    email,
    password,
  });
}

export function storeCurrentUser(user: AuthUser) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

export function getCurrentUser() {
  const storedUser = localStorage.getItem("currentUser");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    localStorage.removeItem("currentUser");
    return null;
  }
}

export function clearCurrentUser() {
  localStorage.removeItem("currentUser");
}

export function getDashboard(userId: number) {
  return requestJson<DashboardData>(`/expenses/dashboard?userId=${userId}`);
}

export function getExpenses(
  userId: number,
  page: number,
  limit: number,
  sortBy: ExpenseSortBy,
  sortOrder: SortOrder,
) {
  const params = new URLSearchParams({
    userId: String(userId),
    page: String(page),
    limit: String(limit),
    sortBy,
    sortOrder,
  });

  return requestJson<ExpenseListData>(`/expenses?${params.toString()}`);
}

export function updateExpense(id: number, data: UpdateExpenseInput) {
  return requestJson<{ message: string; expense: Expense }>(`/expenses/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export function createExpense(data: CreateExpenseInput) {
  return postJson<{ message: string; expense: Expense }>("/expenses", data);
}

export function deleteExpense(id: number) {
  return requestJson<{ message: string }>(`/expenses/${id}`, {
    method: "DELETE",
  });
}
