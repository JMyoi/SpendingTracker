"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CategoryBreakdownEntry } from "@/lib/api";
import {
  formatCurrency,
  getCategoryChartColor,
} from "@/components/dashboard/format";

interface CategoryDonutChartProps {
  data: CategoryBreakdownEntry[];
}

export default function CategoryDonutChart({ data }: CategoryDonutChartProps) {
  const hasData = data.length > 0;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-2xl font-black text-stone-900">This Month</h2>
        <p className="mt-1 text-sm font-medium text-stone-500">By category</p>
      </div>

      {hasData ? (
        <>
          <div className="mt-6 h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="amount"
                  nameKey="category"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.map((entry) => (
                    <Cell
                      key={entry.category}
                      fill={getCategoryChartColor(entry.category)}
                    />
                  ))}
                </Pie>
                <Tooltip
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
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="mt-6 space-y-3">
            {data.map((entry) => (
              <li
                key={entry.category}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="h-3 w-3 rounded-sm"
                    style={{
                      backgroundColor: getCategoryChartColor(entry.category),
                    }}
                  />
                  <span className="font-semibold text-stone-700">
                    {entry.category}
                  </span>
                </span>
                <span className="font-bold text-stone-900">
                  {formatCurrency(entry.amount)}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center py-12 text-center text-stone-400">
          No expenses recorded this month yet.
        </div>
      )}
    </div>
  );
}
