import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { LoginRequestSchema } from '@short-link/shared';
import { prisma } from '../../db/client.js';
import { HttpError } from '../../middleware/http-error.js';
import { throwForValidationError } from './validation.js';
import { setAuthCookies } from './tokens.js';
import { toPublicUser } from './serialize.js';

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = LoginRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    throwForValidationError(parsed.error);
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  // Same error for unknown email and wrong password — don't leak which one it was.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  setAuthCookies(res, user.id, user.role);
  res.status(200).json({ data: toPublicUser(user) });
}
