import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
  createSessionRecord,
  deleteExpiredSessions,
  deleteSessionRecord,
  getSessionWithUser,
  resetUserCredits,
} from './db';
import { ApiError } from './http';
import { createOpaqueToken, hashOpaqueToken } from './token';

const SESSION_COOKIE = 'storyline_session';
const SESSION_DAYS = 30;

export interface AuthUser {
  id: string;
  email: string;
  createdAt: Date;
  credits: number;
  creditsResetAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      sessionId?: string;
    }
  }
}

function sessionExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);
  return expiresAt;
}

export function normalizeEmail(email: unknown) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function createSession(res: Response, userId: string) {
  const token = createOpaqueToken();
  const tokenHash = hashOpaqueToken(token);
  const expiresAt = sessionExpiry();

  await createSessionRecord(tokenHash, userId, expiresAt);

  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    signed: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  });
}

export async function destroyCurrentSession(req: Request, res: Response) {
  if (req.sessionId) {
    await deleteSessionRecord(req.sessionId);
  }

  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    signed: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.signedCookies?.[SESSION_COOKIE];
    if (!token || typeof token !== 'string') {
      next();
      return;
    }

    const now = new Date();
    await deleteExpiredSessions(now);

    const session = await getSessionWithUser(hashOpaqueToken(token));

    if (!session || session.expiresAt <= now) {
      await destroyCurrentSession(req, res);
      next();
      return;
    }

    // Lazy Monthly Credits Reset Check
    let userCredits = session.user.credits;
    let userCreditsResetAt = session.user.creditsResetAt;
    const lastReset = new Date(userCreditsResetAt);
    const nextReset = new Date(lastReset);
    nextReset.setMonth(nextReset.getMonth() + 1);

    if (now >= nextReset) {
      let newReset = nextReset;
      while (now >= newReset) {
        newReset = new Date(newReset);
        newReset.setMonth(newReset.getMonth() + 1);
      }
      const cycleStart = new Date(newReset);
      cycleStart.setMonth(cycleStart.getMonth() - 1);

      const updatedUser = await resetUserCredits(session.user.id, cycleStart);

      userCredits = updatedUser.credits;
      userCreditsResetAt = updatedUser.creditsResetAt;
    }

    req.sessionId = session.id;
    req.user = {
      id: session.user.id,
      email: session.user.email,
      createdAt: session.user.createdAt,
      credits: userCredits,
      creditsResetAt: userCreditsResetAt,
    };
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    next(new ApiError(401, 'Authentication required.'));
    return;
  }
  next();
}
