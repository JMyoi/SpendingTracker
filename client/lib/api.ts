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
  filteredTotal: number;
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

export type TransactionImageSourceType =
  | "receipt"
  | "bank_statement"
  | "transaction_screenshot"
  | "unknown";

export interface ExtractedTransaction {
  title: string;
  amount: number;
  date: string | null;
  category: string;
  description: string;
}

export interface TransactionImageScanResult {
  transactions: ExtractedTransaction[];
  source_type: TransactionImageSourceType;
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

export interface ExpenseFilters {
  year?: number;
  month?: number;
  search?: string;
}

export function getExpenses(
  userId: number,
  page: number,
  limit: number,
  sortBy: ExpenseSortBy,
  sortOrder: SortOrder,
  filters: ExpenseFilters = {},
) {
  const params = new URLSearchParams({
    userId: String(userId),
    page: String(page),
    limit: String(limit),
    sortBy,
    sortOrder,
  });

  if (filters.year) {
    params.set("year", String(filters.year));
  }
  if (filters.month) {
    params.set("month", String(filters.month));
  }
  if (filters.search && filters.search.trim()) {
    params.set("search", filters.search.trim());
  }

  return requestJson<ExpenseListData>(`/expenses?${params.toString()}`);
}

export function getExpenseYears(userId: number) {
  return requestJson<{ years: number[] }>(
    `/expenses/years?userId=${userId}`,
  );
}

export type ExpenseTrendGranularity = "year" | "month" | "day";

export interface ExpenseTrendPoint {
  key: string;
  label: string;
  amount: number;
}

export interface ExpenseTrendData {
  granularity: ExpenseTrendGranularity;
  points: ExpenseTrendPoint[];
}

export function getExpenseTrend(
  userId: number,
  filters: ExpenseFilters = {},
) {
  const params = new URLSearchParams({ userId: String(userId) });

  if (filters.year) {
    params.set("year", String(filters.year));
  }
  if (filters.month) {
    params.set("month", String(filters.month));
  }
  if (filters.search && filters.search.trim()) {
    params.set("search", filters.search.trim());
  }

  return requestJson<ExpenseTrendData>(
    `/expenses/trend?${params.toString()}`,
  );
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

export function createExpensesBulk(
  userId: number,
  expenses: UpdateExpenseInput[],
) {
  return postJson<{ message: string; count: number; expenses: Expense[] }>(
    "/expenses/bulk",
    { userId, expenses },
  );
}

export function scanTransactionImage(file: File) {
  const formData = new FormData();
  formData.append("receipt", file);

  return requestJson<TransactionImageScanResult>("/ocr", {
    method: "POST",
    body: formData,
  });
}

export function deleteExpense(id: number) {
  return requestJson<{ message: string }>(`/expenses/${id}`, {
    method: "DELETE",
  });
}

export type BudgetRanking = "excellent" | "ok" | "fair" | "bad";

export interface BudgetCategoryEntry {
  category: string;
  amount: number;
  percentage: number;
}

export interface BudgetAnalysis {
  month: string;
  budget: number | null;
  spent: number;
  remaining: number | null;
  percentage: number | null;
  ranking: BudgetRanking | null;
  message: string | null;
  transactionCount: number;
  dailyAverage: number;
  daysInMonth: number;
  daysElapsed: number;
  categoryBreakdown: BudgetCategoryEntry[];
}

export function getBudget(userId: number, month: string) {
  return requestJson<BudgetAnalysis>(
    `/budget?userId=${userId}&month=${encodeURIComponent(month)}`,
  );
}

export function setBudget(userId: number, month: string, amount: number) {
  return postJson<{ id: number; userId: number; amount: number; month: string }>(
    "/budget",
    { userId, month, amount },
  );
}

export function getBudgetYears(userId: number) {
  return requestJson<{ years: number[] }>(
    `/budget/years?userId=${userId}`,
  );
}

export interface BudgetComparisonMonth {
  month: string;
  label: string;
  budget: number | null;
  spent: number;
}

export interface BudgetComparisonData {
  months: BudgetComparisonMonth[];
}

export function getBudgetComparison(userId: number, month?: string) {
  const params = new URLSearchParams({ userId: String(userId) });
  if (month) {
    params.set("month", month);
  }
  return requestJson<BudgetComparisonData>(
    `/budget/comparison?${params.toString()}`,
  );
}
