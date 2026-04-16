import { Router } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcrypt';

const router = Router();

// GET /users
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /users/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. 检查是否为空
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // 2. 检查用户是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // 3. 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. 创建用户
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    res.json({
      message: 'User registered successfully',
      user: newUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. 检查输入
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 2. 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // 3. 验证密码
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // 4. 返回成功
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;