"use client";

import { useRef, useState } from "react";
import { categories } from "@/components/dashboard/format";
import type {
  ExtractedTransaction,
  TransactionImageSourceType,
  UpdateExpenseInput,
} from "@/lib/api";
import { createExpensesBulk, scanTransactionImage } from "@/lib/api";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const acceptedMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

const sourceTypeLabels: Record<TransactionImageSourceType, string> = {
  receipt: "Receipt",
  bank_statement: "Bank statement",
  transaction_screenshot: "Transaction screenshot",
  unknown: "Image",
};

interface ReviewRow {
  id: string;
  selected: boolean;
  title: string;
  amount: string;
  date: string;
  category: string;
  description: string;
}

interface ImageImportModalProps {
  userId: number;
  onClose: () => void;
  onSaved: () => void;
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function createRow(transaction?: ExtractedTransaction): ReviewRow {
  return {
    id: `${Date.now()}-${Math.random()}`,
    selected: true,
    title: transaction?.title ?? "",
    amount:
      typeof transaction?.amount === "number" && Number.isFinite(transaction.amount)
        ? String(transaction.amount)
        : "",
    date: transaction?.date ?? todayInputValue(),
    category: transaction?.category && categories.includes(transaction.category)
      ? transaction.category
      : "Other",
    description: transaction?.description ?? "",
  };
}

function validateFile(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    return "Image must be 10MB or smaller.";
  }

  if (file.type && !acceptedMimeTypes.has(file.type)) {
    return "Please upload a PNG, JPEG, WEBP, or non-animated GIF image.";
  }

  return "";
}

function validateRows(rows: ReviewRow[]) {
  const errors: Record<string, string> = {};
  const selectedRows = rows.filter((row) => row.selected);

  if (selectedRows.length === 0) {
    return {
      errors,
      formError: "Select at least one expense to add.",
    };
  }

  for (const row of selectedRows) {
    const amount = Number(row.amount);

    if (!row.title.trim()) {
      errors[row.id] = "Title is required.";
    } else if (!Number.isFinite(amount) || amount <= 0) {
      errors[row.id] = "Amount must be positive.";
    } else if (!row.date) {
      errors[row.id] = "Date is required.";
    } else if (!categories.includes(row.category)) {
      errors[row.id] = "Choose a valid category.";
    }
  }

  return {
    errors,
    formError:
      Object.keys(errors).length > 0
        ? "Fix selected rows before adding expenses."
        : "",
  };
}

export default function ImageImportModal({
  userId,
  onClose,
  onSaved,
}: ImageImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scanError, setScanError] = useState("");
  const [formError, setFormError] = useState("");
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [sourceType, setSourceType] =
    useState<TransactionImageSourceType>("unknown");
  const [hasScanned, setHasScanned] = useState(false);

  const selectedCount = rows.filter((row) => row.selected).length;
  const isBusy = isScanning || isSaving;

  async function scanFile(file: File) {
    const fileError = validateFile(file);
    if (fileError) {
      setScanError(fileError);
      return;
    }

    setIsScanning(true);
    setScanError("");
    setFormError("");
    setRowErrors({});

    try {
      const result = await scanTransactionImage(file);
      setRows(result.transactions.map((transaction) => createRow(transaction)));
      setSourceType(result.source_type);
      setHasScanned(true);
    } catch (error) {
      setScanError(
        error instanceof Error ? error.message : "Failed to process image.",
      );
    } finally {
      setIsScanning(false);
      setIsDragging(false);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (file) {
      void scanFile(file);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      void scanFile(file);
    }
  }

  function updateRow<K extends keyof ReviewRow>(
    rowId: string,
    key: K,
    value: ReviewRow[K],
  ) {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId ? { ...row, [key]: value } : row,
      ),
    );
    setRowErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[rowId];
      return nextErrors;
    });
  }

  function addBlankRow() {
    setRows((currentRows) => [...currentRows, createRow()]);
    setFormError("");
  }

  function removeRow(rowId: string) {
    setRows((currentRows) => currentRows.filter((row) => row.id !== rowId));
    setRowErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[rowId];
      return nextErrors;
    });
  }

  async function handleSave() {
    const validation = validateRows(rows);
    setRowErrors(validation.errors);
    setFormError(validation.formError);

    if (validation.formError) {
      return;
    }

    const expenses: UpdateExpenseInput[] = rows
      .filter((row) => row.selected)
      .map((row) => ({
        title: row.title.trim(),
        amount: Number(Number(row.amount).toFixed(2)),
        category: row.category,
        date: row.date,
        description: row.description.trim(),
      }));

    setIsSaving(true);
    setFormError("");

    try {
      await createExpensesBulk(userId, expenses);
      onSaved();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to add expenses.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 px-4 py-8">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-stone-100 px-7 py-6">
          <div>
            <p className="text-3xl font-black text-stone-950">
              Import from Image
            </p>
            <p className="mt-1 text-stone-500">
              Review extracted expenses before adding them to BudgetFlow.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-2xl bg-stone-100 px-4 py-3 text-xl font-bold text-stone-500 hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            X
          </button>
        </div>

        <div className="overflow-y-auto px-7 py-6">
          {!hasScanned ? (
            <div
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex min-h-72 flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                isDragging
                  ? "border-amber-500 bg-amber-50"
                  : "border-stone-200 bg-stone-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-3xl font-black text-amber-700">
                +
              </div>
              <p className="mt-5 text-2xl font-black text-stone-950">
                {isScanning ? "Processing image..." : "Drop an image here"}
              </p>
              <p className="mt-2 max-w-xl text-base font-medium text-stone-500">
                Upload a receipt, bank statement, or transaction screenshot.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="mt-6 rounded-2xl bg-amber-500 px-6 py-3 text-base font-black text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isScanning ? "Scanning..." : "Choose Image"}
              </button>
              <p className="mt-4 text-sm font-semibold text-stone-400">
                PNG, JPEG, WEBP, or non-animated GIF up to 10MB
              </p>
            </div>
          ) : (
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xl font-black text-stone-950">
                    Review {sourceTypeLabels[sourceType]}
                  </p>
                  <p className="mt-1 text-sm font-medium text-stone-500">
                    {rows.length > 0
                      ? `${rows.length} extracted row${
                          rows.length === 1 ? "" : "s"
                        }. Uncheck rows you do not want to add.`
                      : "No transactions were found. You can add rows manually."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHasScanned(false);
                      setRows([]);
                      setSourceType("unknown");
                      setScanError("");
                      setFormError("");
                    }}
                    disabled={isBusy}
                    className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-black text-stone-600 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Scan Another
                  </button>
                  <button
                    type="button"
                    onClick={addBlankRow}
                    disabled={isBusy}
                    className="rounded-xl bg-amber-50 px-4 py-2 text-sm font-black text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Add Row
                  </button>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto rounded-2xl border border-stone-100">
                <div className="min-w-[980px]">
                  <div className="grid grid-cols-[56px_150px_1.6fr_170px_130px_1.4fr_96px] gap-3 border-b border-stone-100 bg-stone-50 px-4 py-3 text-sm font-black text-stone-500">
                    <span>Add</span>
                    <span>Date</span>
                    <span>Description</span>
                    <span>Category</span>
                    <span>Amount</span>
                    <span>Notes</span>
                    <span className="text-right">Action</span>
                  </div>

                  {rows.length === 0 ? (
                    <p className="px-4 py-8 text-center font-medium text-stone-500">
                      No rows yet. Add a row to create expenses manually.
                    </p>
                  ) : (
                    rows.map((row) => (
                      <div
                        key={row.id}
                        className="grid grid-cols-[56px_150px_1.6fr_170px_130px_1.4fr_96px] gap-3 border-b border-stone-100 px-4 py-4 last:border-b-0"
                      >
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            disabled={isBusy}
                            onChange={(event) =>
                              updateRow(row.id, "selected", event.target.checked)
                            }
                            className="h-5 w-5 rounded border-stone-300 accent-amber-500"
                          />
                        </label>
                        <input
                          type="date"
                          value={row.date}
                          disabled={isBusy || !row.selected}
                          onChange={(event) =>
                            updateRow(row.id, "date", event.target.value)
                          }
                          className="rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-stone-50 disabled:text-stone-400"
                        />
                        <input
                          value={row.title}
                          disabled={isBusy || !row.selected}
                          placeholder="Merchant or payee"
                          onChange={(event) =>
                            updateRow(row.id, "title", event.target.value)
                          }
                          className="rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-stone-50 disabled:text-stone-400"
                        />
                        <select
                          value={row.category}
                          disabled={isBusy || !row.selected}
                          onChange={(event) =>
                            updateRow(row.id, "category", event.target.value)
                          }
                          className="rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-stone-50 disabled:text-stone-400"
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.amount}
                          disabled={isBusy || !row.selected}
                          placeholder="0.00"
                          onChange={(event) =>
                            updateRow(row.id, "amount", event.target.value)
                          }
                          className="rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-stone-50 disabled:text-stone-400"
                        />
                        <input
                          value={row.description}
                          disabled={isBusy || !row.selected}
                          maxLength={100}
                          placeholder="Optional notes"
                          onChange={(event) =>
                            updateRow(row.id, "description", event.target.value)
                          }
                          className="rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-stone-50 disabled:text-stone-400"
                        />
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          disabled={isBusy}
                          className="justify-self-end rounded-xl bg-red-50 px-3 py-2 text-sm font-black text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Remove
                        </button>
                        {rowErrors[row.id] && (
                          <p className="col-span-7 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600">
                            {rowErrors[row.id]}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {scanError && (
            <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 font-medium text-red-600">
              {scanError}
            </p>
          )}
          {formError && (
            <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 font-medium text-red-600">
              {formError}
            </p>
          )}
        </div>

        <div className="grid gap-3 border-t border-stone-100 px-7 py-5 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-2xl border border-stone-200 px-5 py-4 text-lg font-black text-stone-600 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={hasScanned ? handleSave : () => fileInputRef.current?.click()}
            disabled={isBusy}
            className="rounded-2xl bg-amber-500 px-5 py-4 text-lg font-black text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isScanning
              ? "Scanning..."
              : isSaving
                ? "Adding..."
                : hasScanned
                  ? `Add ${selectedCount} Expense${selectedCount === 1 ? "" : "s"}`
                  : "Choose Image"}
          </button>
        </div>
      </div>
    </div>
  );
}
