import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /expenses
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

export default router;