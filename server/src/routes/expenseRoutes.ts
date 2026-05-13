import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import prisma from '../prisma';
import requireAuth from '../middleware/requireAuth';

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

const allowedCategories = [
  'Food',
  'Food & Dining',
  'Groceries',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills',
  'Bills & Utilities',
  'Health',
  'Healthcare',
  'Personal Care',
  'Education',
  'Travel',
  'Subscriptions',
  'Other',
] as const;
type ExpenseCategory = (typeof allowedCategories)[number];

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

function isExpenseCategory(value: unknown): value is ExpenseCategory {
  return (
    typeof value === 'string' &&
    allowedCategories.includes(value as ExpenseCategory)
  );
}

function calendarDate(year: number, monthIndex: number, day = 1) {
  return new Date(Date.UTC(year, monthIndex, day));
}

function getCalendarYear(date: Date) {
  return date.getUTCFullYear();
}

function getCalendarMonthIndex(date: Date) {
  return date.getUTCMonth();
}

function getCalendarDay(date: Date) {
  return date.getUTCDate();
}

function parseExpenseDate(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsedDate = calendarDate(year, month - 1, day);
  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

function getAuthenticatedUserId(req: { auth?: { userId: number } }) {
  if (!req.auth) {
    throw new Error('Missing authenticated user');
  }

  return req.auth.userId;
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
        gte: calendarDate(yearParam, monthParam - 1),
        lt: calendarDate(yearParam, monthParam),
      };
    } else {
      dateFilter = {
        gte: calendarDate(yearParam, 0),
        lt: calendarDate(yearParam + 1, 0),
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
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();
    const monthStart = calendarDate(currentYear, currentMonthIndex);
    const nextMonthStart = calendarDate(currentYear, currentMonthIndex + 1);
    const sixMonthsAgoStart = calendarDate(currentYear, currentMonthIndex - 5);

    const [
      spentThisMonth,
      totalExpenses,
      recentExpenses,
      trendRows,
      categoryRows,
    ] = await Promise.all([
      prisma.expense.aggregate({
        where: {
          userId,
          date: {
            gte: monthStart,
            lt: nextMonthStart,
          },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.expense.aggregate({
        where: { userId },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.expense.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 10,
        select: expenseSelect,
      }),
      prisma.expense.findMany({
        where: {
          userId,
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
          userId,
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
      const key = `${getCalendarYear(row.date)}-${String(getCalendarMonthIndex(row.date) + 1).padStart(2, '0')}`;
      trendBuckets.set(key, (trendBuckets.get(key) ?? 0) + row.amount);
    }
    const monthlyTrend = Array.from({ length: 6 }, (_, offset) => {
      const bucketDate = calendarDate(currentYear, currentMonthIndex - 5 + offset);
      const bucketMonthIndex = getCalendarMonthIndex(bucketDate);
      const key = `${getCalendarYear(bucketDate)}-${String(bucketMonthIndex + 1).padStart(2, '0')}`;
      return {
        month: key,
        label: monthLabels[bucketMonthIndex],
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
router.get('/years', requireAuth, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const expenses = await prisma.expense.findMany({
      where: { userId },
      select: { date: true },
    });

    const years = Array.from(
      new Set(expenses.map((expense) => getCalendarYear(expense.date))),
    ).sort((a, b) => b - a);

    res.json({ years });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch expense years' });
  }
});

// GET /expenses/trend
router.get('/trend', requireAuth, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const { where, yearParam, monthParam } = buildExpenseFilter(
      req.query as Record<string, unknown>,
      userId,
    );

    const rows = await prisma.expense.findMany({
      where,
      select: { date: true, amount: true },
    });

    let granularity: 'year' | 'month' | 'day';
    let points: { key: string; label: string; amount: number }[];

    if (yearParam && monthParam) {
      granularity = 'day';
      const daysInMonth = getCalendarDay(calendarDate(yearParam, monthParam, 0));
      const totals = new Array<number>(daysInMonth).fill(0);
      for (const row of rows) {
        const day = getCalendarDay(row.date);
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
        totals[getCalendarMonthIndex(row.date)] += row.amount;
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
        const year = getCalendarYear(row.date);
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
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

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
      userId,
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
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { title, amount, category, date, description } = req.body;

    if (!title || !amount || !category || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const parsedDate = parseExpenseDate(date);
    if (!parsedDate) {
      return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
    }

    const newExpense = await prisma.expense.create({
      data: {
        userId,
        title,
        amount: parseFloat(amount),
        category,
        date: parsedDate,
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

// POST /expenses/bulk
router.post('/bulk', requireAuth, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { expenses } = req.body;

    if (!Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({ error: 'expenses must be a non-empty array' });
    }

    const normalizedExpenses: {
      userId: number;
      title: string;
      amount: number;
      category: ExpenseCategory;
      date: Date;
      description?: string;
    }[] = [];

    for (const [index, expense] of expenses.entries()) {
      if (!expense || typeof expense !== 'object') {
        return res.status(400).json({
          error: `Expense at index ${index} must be an object`,
        });
      }

      const rawExpense = expense as Record<string, unknown>;
      const title =
        typeof rawExpense.title === 'string' ? rawExpense.title.trim() : '';
      const amount = Number(rawExpense.amount);
      const category = rawExpense.category;
      const date = parseExpenseDate(rawExpense.date);
      const description =
        typeof rawExpense.description === 'string'
          ? rawExpense.description.trim()
          : undefined;

      if (!title) {
        return res.status(400).json({
          error: `Expense at index ${index} is missing title`,
        });
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({
          error: `Expense at index ${index} must have a positive amount`,
        });
      }

      if (!isExpenseCategory(category)) {
        return res.status(400).json({
          error: `Expense at index ${index} has an invalid category`,
        });
      }

      if (!date) {
        return res.status(400).json({
          error: `Expense at index ${index} must have a date in YYYY-MM-DD format`,
        });
      }

      normalizedExpenses.push({
        userId,
        title,
        amount: parseFloat(amount.toFixed(2)),
        category,
        date,
        description,
      });
    }

    const createdExpenses = await prisma.$transaction(
      normalizedExpenses.map((expense) =>
        prisma.expense.create({
          data: expense,
          select: expenseSelect,
        }),
      ),
    );

    res.json({
      message: 'Expenses created successfully',
      count: createdExpenses.length,
      expenses: createdExpenses,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create expenses' });
  }
});


// DELETE /expenses/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const expenseId = parsePositiveInteger(req.params.id);

    if (!expenseId) {
      return res.status(400).json({ error: 'id must be a positive integer' });
    }

    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, userId },
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await prisma.expense.delete({
      where: { id: expenseId },
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
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const expenseId = parsePositiveInteger(req.params.id);
    const { title, amount, category, date, description } = req.body;

    if (!expenseId) {
      return res.status(400).json({ error: 'id must be a positive integer' });
    }

    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, userId },
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    let parsedDate: Date | undefined;
    if (date) {
      const nextDate = parseExpenseDate(date);
      if (!nextDate) {
        return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
      }
      parsedDate = nextDate;
    }

    const updatedExpense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        title,
        amount: amount ? parseFloat(amount) : undefined,
        category,
        date: parsedDate,
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
