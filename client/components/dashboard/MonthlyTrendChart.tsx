"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyTrendPoint } from "@/lib/api";
import { formatCurrency } from "@/components/dashboard/format";

interface MonthlyTrendChartProps {
  data: MonthlyTrendPoint[];
}

export default function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const hasData = data.some((point) => point.amount > 0);

  return (
    <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900">
            Monthly Spending Trend
          </h2>
          <p className="mt-1 text-sm font-medium text-stone-500">
            Last 6 months
          </p>
        </div>
      </div>

      <div className="mt-6 h-[280px] w-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                cursor={{ stroke: "#e7e5e4", strokeWidth: 1 }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e7e5e4",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                  fontWeight: 600,
                }}
                formatter={(value) => [formatCurrency(Number(value)), "Spent"]}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#6366f1"
                strokeWidth={3}
                fill="url(#trendGradient)"
                dot={{ r: 5, fill: "#6366f1", strokeWidth: 0 }}
                activeDot={{ r: 7, fill: "#6366f1", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-stone-400">
            No spending recorded in the last 6 months yet.
          </div>
        )}
      </div>
    </div>
  );
}
