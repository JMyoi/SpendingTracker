import { Router } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcrypt';
import { createSession } from '../session';

const router = Router();

const COMMON_PASSWORD_DENYLIST = new Set([
  'password',
  'password123',
  'qwerty123',
  'letmein',
  'admin123',
  '123456789',
  '111111111111',
]);

function normalizeEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function validateEmail(email: string): string | null {
  if (!/^[^\s@]+@[^\s@]+$/.test(email)) {
    return 'Please enter a valid email address.';
  }

  return null;
}

function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string') {
    return 'Password must be a string.';
  }

  if (password.length < 12) {
    return 'Password must be at least 12 characters long.';
  }

  if (password.length > 128) {
    return 'Password must be no more than 128 characters long.';
  }

  if (password !== password.trim()) {
    return 'Password must not start or end with whitespace.';
  }

  if (COMMON_PASSWORD_DENYLIST.has(password.toLowerCase())) {
    return 'Please choose a less common password.';
  }

  return null;
}

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
    const normalizedEmail = normalizeEmail(email);

    // 1. 检查是否为空
    if (!username || !normalizedEmail) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const emailError = validateEmail(normalizedEmail);
    if (emailError) {
      return res.status(400).json({ error: emailError });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    // 2. 检查用户是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { username }],
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
        email: normalizedEmail,
        password: hashedPassword,
      },
    });

    createSession(res, newUser.id);

    res.json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // 1. 检查输入
    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const emailError = validateEmail(normalizedEmail);
    if (emailError) {
      return res.status(400).json({ error: emailError });
    }

    // 2. 查找用户
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
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
    createSession(res, user.id);

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
