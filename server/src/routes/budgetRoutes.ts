import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
  try {
    const { userId, amount, month } = req.body;

    if (!userId || !amount || !month) {
      return res.status(400).json({
        error: "userId, amount, and month are required",
      });
    }

    const budget = await prisma.budget.upsert({
      where: {
        userId_month: {
          userId: Number(userId),
          month: String(month),
        },
      },
      update: {
        amount: Number(amount),
      },
      create: {
        userId: Number(userId),
        amount: Number(amount),
        month: String(month),
      },
    });

    res.json(budget);
  } catch (error) {
    console.error("Budget create/update error:", error);
    res.status(500).json({ error: "Failed to set budget" });
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

    // 1️⃣ 找预算
    const budget = await prisma.budget.findUnique({
      where: {
        userId_month: {
          userId: Number(userId),
          month: String(month),
        },
      },
    });

    if (!budget) {
      return res.status(404).json({
        error: "Budget not found",
      });
    }

    // 2️⃣ 计算时间范围（这个月）
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // 3️⃣ 汇总这个月的支出
    const expenses = await prisma.expense.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        userId: Number(userId),
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    const spent = expenses._sum.amount || 0;
    const remaining = budget.amount - spent;
    const percentage = (spent / budget.amount) * 100;

    // 4️⃣ 状态判断（新增）
    let status = "safe";
    let message = "You are within your monthly budget.";

    if (spent > budget.amount) {
      status = "over_budget";
      message = "You have exceeded your monthly budget.";
    } else if (percentage >= 80) {
      status = "warning";
      message = "You have used over 80% of your monthly budget.";
    }

    // 5️⃣ 返回
    res.json({
      budget: budget.amount,
      spent,
      remaining,
      percentage: Number(percentage.toFixed(2)),
      status,
      message,
    });

  } catch (error) {
    console.error("Get budget error:", error);
    res.status(500).json({
      error: "Failed to get budget",
    });
  }
});

export default router;