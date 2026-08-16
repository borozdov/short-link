import type { Request, Response } from 'express';
import { prisma } from '../../db/client.js';
import { HttpError } from '../../middleware/http-error.js';
import { toPublicApiKey } from './serialize.js';

// Mounted behind authGuard — req.user is always set here.
export async function revokeApiKey(req: Request<{ id: string }>, res: Response): Promise<void> {
  const apiKey = await prisma.apiKey.findFirst({
    where: { id: req.params.id, ownerId: req.user!.id },
  });

  if (!apiKey) {
    throw new HttpError(404, 'NOT_FOUND', 'Not found');
  }

  // Revoke is one-way — repeating it just confirms the same end state, no conflict to report.
  const updated = apiKey.revokedAt
    ? apiKey
    : await prisma.apiKey.update({ where: { id: apiKey.id }, data: { revokedAt: new Date() } });

  res.status(200).json({ data: toPublicApiKey(updated) });
}
