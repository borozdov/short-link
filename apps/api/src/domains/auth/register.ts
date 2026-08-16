import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { RegisterRequestSchema } from '@short-link/shared';
import { prisma } from '../../db/client.js';
import { Prisma } from '../../generated/prisma/client.js';
import { HttpError } from '../../middleware/http-error.js';
import { ConsoleEmailSender } from '../../clients/email-sender.js';
import { throwForValidationError } from './validation.js';
import { setAuthCookies } from './tokens.js';
import { toPublicUser } from './serialize.js';

const PASSWORD_SALT_ROUNDS = 10;
const emailSender = new ConsoleEmailSender();

function isUniqueConstraintViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = RegisterRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    throwForValidationError(parsed.error);
  }
  const { email, password } = parsed.data;

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

  let user;
  try {
    user = await prisma.user.create({ data: { email, passwordHash } });
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      throw new HttpError(409, 'EMAIL_TAKEN', 'Этот email уже зарегистрирован');
    }
    throw error;
  }

  // Fake send — no verification token/link, tech.md only requires the notification
  // itself, not a real verify flow (login isn't gated on it in the MVP).
  await emailSender.send(
    user.email,
    'Подтвердите email',
    'Добро пожаловать в BOROZDOV LINK. Подтверждение email пока не требуется для использования аккаунта.',
  );

  setAuthCookies(res, user.id, user.role);
  res.status(201).json({ data: toPublicUser(user) });
}
