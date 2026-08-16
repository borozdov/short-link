import type { Request, Response } from 'express';
import { ClaimLinkRequestSchema } from '@short-link/shared';
import { prisma } from '../../db/client.js';
import { HttpError } from '../../middleware/http-error.js';
import { toPublicLink } from './serialize.js';

// Mounted behind authGuard — req.user is always set here.
export async function claimLink(req: Request, res: Response): Promise<void> {
  const parsed = ClaimLinkRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_SECRET_TOKEN', parsed.error.issues[0]?.message ?? 'Некорректный запрос');
  }
  const { secretToken } = parsed.data;

  // Conditional update — avoids a race between two concurrent claims of the same link.
  const result = await prisma.link.updateMany({
    where: { secretToken, ownerId: null },
    data: { ownerId: req.user!.id },
  });

  if (result.count === 0) {
    const link = await prisma.link.findUnique({ where: { secretToken } });
    if (!link) {
      throw new HttpError(404, 'NOT_FOUND', 'Не найдено');
    }
    throw new HttpError(409, 'ALREADY_CLAIMED', 'Эта ссылка уже привязана к аккаунту');
  }

  const link = await prisma.link.findUniqueOrThrow({ where: { secretToken } });
  res.status(200).json({ data: toPublicLink(link) });
}
