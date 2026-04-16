import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /expenses
router.get('/', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany();
    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

export default router;