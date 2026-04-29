import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import prisma from '../prisma';

const router = Router();

const expenseSelect = {
  id: true,
  title: true,
  amount: true,
  category: true,
  date: true,
  description: true,
  createdAt: true,
  updatedAt: true,
};

const sortFields = ['date', 'title', 'category', 'amount'] as const;
type SortField = (typeof sortFields)[number];

function getQueryValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveInteger(value: unknown, fallback?: number) {
  const queryValue = getQueryValue(value);

  if (queryValue === undefined) {
    return fallback;
  }

  const parsedValue = Number(queryValue);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return undefined;
  }

  return parsedValue;
}

function roundMoney(amount: number) {
  return Number(amount.toFixed(2));
}

async function findUserByQueryId(userId: unknown) {
  const parsedUserId = parsePositiveInteger(userId);

  if (!parsedUserId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: parsedUserId },
  });
}

// GET /expenses/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const user = await findUserByQueryId(req.query.userId);

    if (!req.query.userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [spentThisMonth, totalExpenses, recentExpenses] = await Promise.all([
      prisma.expense.aggregate({
        where: {
          userId: user.id,
          date: {
            gte: monthStart,
            lt: nextMonthStart,
          },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.expense.aggregate({
        where: { userId: user.id },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.expense.findMany({
        where: { userId: user.id },
        orderBy: { date: 'desc' },
        take: 10,
        select: expenseSelect,
      }),
    ]);

    res.json({
      spentThisMonth: {
        amount: roundMoney(spentThisMonth._sum.amount ?? 0),
        transactionCount: spentThisMonth._count.id,
      },
      totalExpenses: {
        amount: roundMoney(totalExpenses._sum.amount ?? 0),
        recordCount: totalExpenses._count.id,
      },
      recentExpenses,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /expenses
router.get('/', async (req, res) => {
  try {
    const user = await findUserByQueryId(req.query.userId);

    if (!req.query.userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 10);

    if (!page || !limit) {
      return res.status(400).json({ error: 'page and limit must be positive integers' });
    }

    const requestedSortBy = getQueryValue(req.query.sortBy);
    const sortBy: SortField =
      typeof requestedSortBy === 'string' && sortFields.includes(requestedSortBy as SortField)
        ? (requestedSortBy as SortField)
        : 'date';

    const requestedSortOrder = getQueryValue(req.query.sortOrder);
    const sortOrder: Prisma.SortOrder = requestedSortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.ExpenseOrderByWithRelationInput = { [sortBy]: sortOrder };
    const skip = (page - 1) * limit;

    const [expenses, totalRecords] = await Promise.all([
      prisma.expense.findMany({
        where: { userId: user.id },
        orderBy,
        skip,
        take: limit,
        select: expenseSelect,
      }),
      prisma.expense.count({
        where: { userId: user.id },
      }),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);
    const showingFrom = totalRecords === 0 ? 0 : skip + 1;
    const showingTo = Math.min(skip + expenses.length, totalRecords);

    res.json({
      expenses,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
        showingFrom,
        showingTo,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST /expenses
router.post('/', async (req, res) => {
  try {
    const { userId, title, amount, category, date, description } = req.body;

    if (!userId || !title || !amount || !category || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const newExpense = await prisma.expense.create({
      data: {
        userId: Number(userId),
        title,
        amount: parseFloat(amount),
        category,
        date: new Date(date),
        description,
      },
    });

    res.json({
      message: 'Expense created successfully',
      expense: newExpense,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});
// DELETE /expenses/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. 检查 id 是否存在
    const expense = await prisma.expense.findUnique({
      where: { id: Number(id) },
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // 2. 删除
    await prisma.expense.delete({
      where: { id: Number(id) },
    });

    res.json({
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});
// PUT /expenses/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, category, date, description } = req.body;

    // 1. 检查是否存在
    const expense = await prisma.expense.findUnique({
      where: { id: Number(id) },
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // 2. 更新
    const updatedExpense = await prisma.expense.update({
      where: { id: Number(id) },
      data: {
        title,
        amount: amount ? parseFloat(amount) : undefined,
        category,
        date: date ? new Date(date) : undefined,
        description,
      },
    });

    res.json({
      message: 'Expense updated successfully',
      expense: updatedExpense,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});
export default router;
