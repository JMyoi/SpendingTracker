import type { Expense } from "@/lib/api";
import { expenseLabel, formatCurrency, formatDate, getCategoryClass } from "./format";

interface ExpenseRowProps {
  expense: Expense;
  compact?: boolean;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
}

export default function ExpenseRow({
  expense,
  compact = false,
  onEdit,
  onDelete,
}: ExpenseRowProps) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-t border-stone-100 px-5 py-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold sm:flex ${getCategoryClass(
            expense.category,
          )}`}
        >
          $
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-stone-800">
            {expenseLabel(expense)}
          </p>
          <p className="mt-1 text-sm font-semibold text-stone-400">
            <span className={getCategoryClass(expense.category).split(" ")[1]}>
              {expense.category}
            </span>
            <span className="mx-2 text-stone-300">.</span>
            {formatDate(expense.date)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <p className="text-lg font-black text-stone-950">
          {formatCurrency(expense.amount)}
        </p>
        {!compact && onEdit && onDelete && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onEdit(expense)}
              className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700 hover:bg-amber-100"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(expense)}
              className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-100"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
