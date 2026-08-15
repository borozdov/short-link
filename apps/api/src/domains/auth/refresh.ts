import type { Request, Response } from 'express';
import { prisma } from '../../db/client.js';
import { HttpError } from '../../middleware/http-error.js';
import { REFRESH_COOKIE_NAME, setAuthCookies, verifyRefreshToken } from './tokens.js';
import { toPublicUser } from './serialize.js';

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  if (!token) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Refresh token missing');
  }

  let userId: string;
  try {
    userId = verifyRefreshToken(token).sub;
  } catch {
    throw new HttpError(401, 'UNAUTHORIZED', 'Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(401, 'UNAUTHORIZED', 'User no longer exists');
  }

  // Reissues both tokens with fresh full TTLs — refresh slides the whole session forward.
  setAuthCookies(res, user.id, user.role);
  res.status(200).json({ data: toPublicUser(user) });
}
