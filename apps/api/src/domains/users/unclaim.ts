import type { Request, Response } from 'express';
import { prisma } from '../../db/client.js';
import { HttpError } from '../../middleware/http-error.js';
import { toPublicLink } from './serialize.js';

// Mounted behind authGuard — req.user is always set here.
export async function unclaimLink(req: Request<{ id: string }>, res: Response): Promise<void> {
  const result = await prisma.link.updateMany({
    where: { id: req.params.id, ownerId: req.user!.id },
    data: { ownerId: null },
  });

  if (result.count === 0) {
    throw new HttpError(404, 'NOT_FOUND', 'Не найдено');
  }

  const link = await prisma.link.findUniqueOrThrow({ where: { id: req.params.id } });
  res.status(200).json({ data: toPublicLink(link) });
}
