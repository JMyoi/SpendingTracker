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

function buildExpenseFilter(query: Record<string, unknown>, userId: number) {
  const yearParam = parsePositiveInteger(query.year);
  const rawMonth = parsePositiveInteger(query.month);
  const monthParam =
    yearParam && rawMonth && rawMonth >= 1 && rawMonth <= 12 ? rawMonth : undefined;
  const searchValue = getQueryValue(query.search);
  const search = typeof searchValue === 'string' ? searchValue.trim() : '';

  let dateFilter: { gte: Date; lt: Date } | undefined;
  if (yearParam) {
    if (monthParam) {
      dateFilter = {
        gte: new Date(yearParam, monthParam - 1, 1),
        lt: new Date(yearParam, monthParam, 1),
      };
    } else {
      dateFilter = {
        gte: new Date(yearParam, 0, 1),
        lt: new Date(yearParam + 1, 0, 1),
      };
    }
  }

  const where: Prisma.ExpenseWhereInput = {
    userId,
    ...(dateFilter ? { date: dateFilter } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
            { category: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  return { where, yearParam, monthParam, search };
}

const monthShortLabels = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

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
    const sixMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      spentThisMonth,
      totalExpenses,
      recentExpenses,
      trendRows,
      categoryRows,
    ] = await Promise.all([
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
      prisma.expense.findMany({
        where: {
          userId: user.id,
          date: {
            gte: sixMonthsAgoStart,
            lt: nextMonthStart,
          },
        },
        select: { date: true, amount: true },
      }),
      prisma.expense.groupBy({
        by: ['category'],
        where: {
          userId: user.id,
          date: {
            gte: monthStart,
            lt: nextMonthStart,
          },
        },
        _sum: { amount: true },
      }),
    ]);

    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendBuckets = new Map<string, number>();
    for (const row of trendRows) {
      const key = `${row.date.getFullYear()}-${String(row.date.getMonth() + 1).padStart(2, '0')}`;
      trendBuckets.set(key, (trendBuckets.get(key) ?? 0) + row.amount);
    }
    const monthlyTrend = Array.from({ length: 6 }, (_, offset) => {
      const bucketDate = new Date(now.getFullYear(), now.getMonth() - 5 + offset, 1);
      const key = `${bucketDate.getFullYear()}-${String(bucketDate.getMonth() + 1).padStart(2, '0')}`;
      return {
        month: key,
        label: monthLabels[bucketDate.getMonth()],
        amount: roundMoney(trendBuckets.get(key) ?? 0),
      };
    });

    const categoryBreakdown = categoryRows
      .map((row) => ({
        category: row.category,
        amount: roundMoney(row._sum.amount ?? 0),
      }))
      .filter((entry) => entry.amount > 0)
      .sort((a, b) => b.amount - a.amount);

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
      monthlyTrend,
      categoryBreakdown,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /expenses/years
router.get('/years', async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const user = await findUserByQueryId(req.query.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const expenses = await prisma.expense.findMany({
      where: { userId: user.id },
      select: { date: true },
    });

    const years = Array.from(
      new Set(expenses.map((expense) => expense.date.getFullYear())),
    ).sort((a, b) => b - a);

    res.json({ years });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch expense years' });
  }
});

// GET /expenses/trend
router.get('/trend', async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const user = await findUserByQueryId(req.query.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { where, yearParam, monthParam } = buildExpenseFilter(
      req.query as Record<string, unknown>,
      user.id,
    );

    const rows = await prisma.expense.findMany({
      where,
      select: { date: true, amount: true },
    });

    let granularity: 'year' | 'month' | 'day';
    let points: { key: string; label: string; amount: number }[];

    if (yearParam && monthParam) {
      granularity = 'day';
      const daysInMonth = new Date(yearParam, monthParam, 0).getDate();
      const totals = new Array<number>(daysInMonth).fill(0);
      for (const row of rows) {
        const day = row.date.getDate();
        totals[day - 1] += row.amount;
      }
      points = totals.map((amount, index) => ({
        key: `${yearParam}-${String(monthParam).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`,
        label: String(index + 1),
        amount: roundMoney(amount),
      }));
    } else if (yearParam) {
      granularity = 'month';
      const totals = new Array<number>(12).fill(0);
      for (const row of rows) {
        totals[row.date.getMonth()] += row.amount;
      }
      points = totals.map((amount, index) => ({
        key: `${yearParam}-${String(index + 1).padStart(2, '0')}`,
        label: monthShortLabels[index],
        amount: roundMoney(amount),
      }));
    } else {
      granularity = 'year';
      const totals = new Map<number, number>();
      for (const row of rows) {
        const year = row.date.getFullYear();
        totals.set(year, (totals.get(year) ?? 0) + row.amount);
      }
      points = Array.from(totals.entries())
        .sort(([a], [b]) => a - b)
        .map(([year, amount]) => ({
          key: String(year),
          label: String(year),
          amount: roundMoney(amount),
        }));
    }

    res.json({ granularity, points });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch expense trend' });
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

    const { where } = buildExpenseFilter(
      req.query as Record<string, unknown>,
      user.id,
    );

    const [expenses, totalRecords, sumAggregate] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: expenseSelect,
      }),
      prisma.expense.count({ where }),
      prisma.expense.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);
    const showingFrom = totalRecords === 0 ? 0 : skip + 1;
    const showingTo = Math.min(skip + expenses.length, totalRecords);
    const filteredTotal = roundMoney(sumAggregate._sum.amount ?? 0);

    res.json({
      expenses,
      filteredTotal,
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
