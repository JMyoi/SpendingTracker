"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BudgetComparisonMonth } from "@/lib/api";
import { formatCurrency } from "@/components/dashboard/format";

interface BudgetComparisonChartProps {
  data: BudgetComparisonMonth[];
}

export default function BudgetComparisonChart({
  data,
}: BudgetComparisonChartProps) {
  const chartData = data.map((entry) => ({
    label: entry.label,
    budget: entry.budget ?? 0,
    spent: entry.spent,
  }));

  const hasAnyValue = chartData.some(
    (entry) => entry.budget > 0 || entry.spent > 0,
  );

  return (
    <section className="mt-8 rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-2xl font-black text-stone-900">Budget vs Actual</h2>
        <p className="mt-1 text-sm font-medium text-stone-500">
          7-month window centered on the selected month
        </p>
      </div>

      <div className="mt-6 h-[320px] w-full">
        {hasAnyValue ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e7e5e4"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#a8a29e", fontSize: 13, fontWeight: 500 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#a8a29e", fontSize: 13, fontWeight: 500 }}
                tickFormatter={(value: number) => `$${value}`}
                width={60}
              />
              <Tooltip
                cursor={{ fill: "rgba(99, 102, 241, 0.06)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e7e5e4",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                  fontWeight: 600,
                }}
                formatter={(value, name) => [
                  formatCurrency(Number(value)),
                  String(name),
                ]}
              />
              <Legend
                verticalAlign="bottom"
                iconType="square"
                wrapperStyle={{ paddingTop: 12, fontWeight: 700 }}
              />
              <Bar
                dataKey="budget"
                name="Budget"
                fill="#c7d2fe"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="spent"
                name="Spent"
                fill="#6366f1"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-stone-400">
            No budgets or expenses recorded in this window yet.
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-xs font-medium text-stone-400">
        * Months without a budget set show $0 for the budget bar
      </p>
    </section>
  );
}
