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

export default router;