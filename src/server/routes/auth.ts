import { Router } from 'express';
import { Prisma } from '@prisma/client';
import {
  createSession,
  destroyCurrentSession,
  hashPassword,
  normalizeEmail,
  requireAuth,
  verifyPassword,
} from '../auth';
import { prisma } from '../db';
import { ApiError, asyncHandler } from '../http';

export const authRouter = Router();

function serializeUser(user: { id: string; email: string; createdAt: Date; credits: number; creditsResetAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    credits: user.credits,
    creditsResetAt: user.creditsResetAt.toISOString(),
  };
}

function validatePassword(password: unknown) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters.');
  }
  return password;
}

authRouter.post('/register', asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = validatePassword(req.body.password);

  if (!email || !email.includes('@')) {
    throw new ApiError(400, 'A valid email is required.');
  }

  try {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
      },
    });
    await createSession(res, user.id);
    res.status(201).json({ user: serializeUser(user) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ApiError(409, 'An account with this email already exists.');
    }
    throw err;
  }
}));

authRouter.post('/login', asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  await createSession(res, user.id);
  res.json({ user: serializeUser(user) });
}));

authRouter.post('/logout', asyncHandler(async (req, res) => {
  await destroyCurrentSession(req, res);
  res.json({ ok: true });
}));

authRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  res.json({ user: serializeUser(req.user!) });
}));
