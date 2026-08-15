import type { Request, Response } from 'express';
import { prisma } from '../../db/client.js';
import { HttpError } from '../../middleware/http-error.js';
import { toPublicUser } from './serialize.js';

// Mounted behind authGuard — req.user is always set here.
export async function me(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    throw new HttpError(401, 'UNAUTHORIZED', 'User no longer exists');
  }
  res.status(200).json({ data: toPublicUser(user) });
}
