import crypto from 'crypto';
import type { Response } from 'express';

const SESSION_COOKIE_NAME = 'spending_tracker_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

type SessionRecord = {
  userId: number;
  expiresAt: number;
};

const sessions = new Map<string, SessionRecord>();

function getSessionSecret() {
  return process.env.SESSION_SECRET ?? 'development-session-secret';
}

function signSessionId(sessionId: string) {
  return crypto
    .createHmac('sha256', getSessionSecret())
    .update(sessionId)
    .digest('base64url');
}

function encodeSessionToken(sessionId: string) {
  return `${sessionId}.${signSessionId(sessionId)}`;
}

function verifySessionToken(token: string) {
  const separatorIndex = token.lastIndexOf('.');

  if (separatorIndex <= 0) {
    return null;
  }

  const sessionId = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  const expectedSignature = signSessionId(sessionId);

  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return null;
  }

  return sessionId;
}

function parseCookies(cookieHeader: string | undefined) {
  const cookies = new Map<string, string>();

  if (!cookieHeader) {
    return cookies;
  }

  for (const cookie of cookieHeader.split(';')) {
    const [rawName, ...rawValueParts] = cookie.trim().split('=');

    if (!rawName || rawValueParts.length === 0) {
      continue;
    }

    try {
      cookies.set(rawName, decodeURIComponent(rawValueParts.join('=')));
    } catch {
      continue;
    }
  }

  return cookies;
}

function getCookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: maxAgeMs,
    path: '/',
  };
}

export function createSession(res: Response, userId: number) {
  const sessionId = crypto.randomBytes(32).toString('base64url');
  sessions.set(sessionId, {
    userId,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });

  res.cookie(
    SESSION_COOKIE_NAME,
    encodeSessionToken(sessionId),
    getCookieOptions(SESSION_TTL_MS),
  );
}

export function getSession(cookieHeader: string | undefined) {
  const token = parseCookies(cookieHeader).get(SESSION_COOKIE_NAME);

  if (!token) {
    return null;
  }

  const sessionId = verifySessionToken(token);

  if (!sessionId) {
    return null;
  }

  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  if (session.expiresAt <= Date.now()) {
    sessions.delete(sessionId);
    return null;
  }

  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return session;
}
