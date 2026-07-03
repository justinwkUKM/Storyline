import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from './db';
import { ApiError } from './http';

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

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
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
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = sessionExpiry();

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
    },
  });

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
    await prisma.session.deleteMany({ where: { id: req.sessionId } });
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
    await prisma.session.deleteMany({ where: { expiresAt: { lt: now } } });

    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });

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

      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          credits: 100,
          creditsResetAt: cycleStart,
        },
      });

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
