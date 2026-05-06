import { Router } from "express";
import prisma from "../prisma";

const router = Router();

type Ranking = "excellent" | "ok" | "fair" | "bad";

function roundMoney(amount: number) {
  return Number(amount.toFixed(2));
}

function rankingForPercentage(percentage: number): {
  ranking: Ranking;
  message: string;
} {
  if (percentage > 100) {
    return {
      ranking: "bad",
      message: "You exceeded your budget this month.",
    };
  }
  if (percentage >= 80) {
    return {
      ranking: "fair",
      message: "Watch out — you're close to your limit.",
    };
  }
  if (percentage >= 50) {
    return {
      ranking: "ok",
      message: "Great job! You're managing your budget well.",
    };
  }
  return {
    ranking: "excellent",
    message: "Outstanding! You stayed well under budget.",
  };
}

router.post("/", async (req, res) => {
  try {
    const { userId, amount, month } = req.body;

    if (!userId || amount === undefined || amount === null || !month) {
      return res.status(400).json({
        error: "userId, amount, and month are required",
      });
    }

    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res
        .status(400)
        .json({ error: "amount must be a positive number" });
    }

    const budget = await prisma.budget.upsert({
      where: {
        userId_month: {
          userId: Number(userId),
          month: String(month),
        },
      },
      update: {
        amount: parsedAmount,
      },
      create: {
        userId: Number(userId),
        amount: parsedAmount,
        month: String(month),
      },
    });

    res.json(budget);
  } catch (error) {
    console.error("Budget create/update error:", error);
    res.status(500).json({ error: "Failed to set budget" });
  }
});

router.get("/years", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const userIdNumber = Number(userId);
    if (!Number.isInteger(userIdNumber) || userIdNumber <= 0) {
      return res
        .status(400)
        .json({ error: "userId must be a positive integer" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userIdNumber },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const [expenseRows, budgetRows] = await Promise.all([
      prisma.expense.findMany({
        where: { userId: userIdNumber },
        select: { date: true },
      }),
      prisma.budget.findMany({
        where: { userId: userIdNumber },
        select: { month: true },
      }),
    ]);

    const yearSet = new Set<number>();
    yearSet.add(new Date().getFullYear());
    for (const row of expenseRows) {
      yearSet.add(row.date.getFullYear());
    }
    for (const row of budgetRows) {
      const year = Number(row.month.split("-")[0]);
      if (Number.isFinite(year)) {
        yearSet.add(year);
      }
    }

    const years = Array.from(yearSet).sort((a, b) => b - a);
    res.json({ years });
  } catch (error) {
    console.error("Get budget years error:", error);
    res.status(500).json({ error: "Failed to fetch budget years" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { userId, month } = req.query;

    if (!userId || !month) {
      return res.status(400).json({
        error: "userId and month are required",
      });
    }

    const userIdNumber = Number(userId);
    const monthString = String(month);

    if (!/^\d{4}-\d{2}$/.test(monthString)) {
      return res.status(400).json({ error: "month must be in YYYY-MM format" });
    }

    const [yearPart, monthPart] = monthString.split("-").map(Number);
    const startDate = new Date(yearPart, monthPart - 1, 1);
    const endDate = new Date(yearPart, monthPart, 1);

    const [budget, expenseAggregate, categoryRows] = await Promise.all([
      prisma.budget.findUnique({
        where: {
          userId_month: {
            userId: userIdNumber,
            month: monthString,
          },
        },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: {
          userId: userIdNumber,
          date: {
            gte: startDate,
            lt: endDate,
          },
        },
      }),
      prisma.expense.groupBy({
        by: ["category"],
        where: {
          userId: userIdNumber,
          date: {
            gte: startDate,
            lt: endDate,
          },
        },
        _sum: { amount: true },
      }),
    ]);

    const spent = roundMoney(expenseAggregate._sum.amount ?? 0);
    const transactionCount = expenseAggregate._count.id;

    const now = new Date();
    const isCurrentMonth =
      now.getFullYear() === yearPart && now.getMonth() === monthPart - 1;
    const daysInMonth = new Date(yearPart, monthPart, 0).getDate();
    const daysElapsed = isCurrentMonth ? now.getDate() : daysInMonth;
    const dailyAverage =
      daysElapsed > 0 ? roundMoney(spent / daysElapsed) : 0;

    const categoryBreakdown = categoryRows
      .map((row) => {
        const amount = roundMoney(row._sum.amount ?? 0);
        return {
          category: row.category,
          amount,
          percentage:
            spent > 0 ? Number(((amount / spent) * 100).toFixed(2)) : 0,
        };
      })
      .filter((entry) => entry.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    if (!budget) {
      return res.json({
        month: monthString,
        budget: null,
        spent,
        remaining: null,
        percentage: null,
        ranking: null,
        message: null,
        transactionCount,
        dailyAverage,
        daysInMonth,
        daysElapsed,
        categoryBreakdown,
      });
    }

    const remaining = roundMoney(budget.amount - spent);
    const percentage =
      budget.amount > 0
        ? Number(((spent / budget.amount) * 100).toFixed(2))
        : 0;
    const { ranking, message } = rankingForPercentage(percentage);

    res.json({
      month: monthString,
      budget: budget.amount,
      spent,
      remaining,
      percentage,
      ranking,
      message,
      transactionCount,
      dailyAverage,
      daysInMonth,
      daysElapsed,
      categoryBreakdown,
    });
  } catch (error) {
    console.error("Get budget error:", error);
    res.status(500).json({
      error: "Failed to get budget",
    });
  }
});

export default router;
