import type { NextFunction, Request, Response } from 'express';
import { getSession } from '../session';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: number;
      };
    }
  }
}

export default function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const session = getSession(req.headers.cookie);

  if (!session) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  req.auth = { userId: session.userId };
  next();
}
