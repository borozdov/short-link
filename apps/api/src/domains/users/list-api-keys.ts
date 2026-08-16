import type { Request, Response } from 'express';
import { prisma } from '../../db/client.js';
import { toPublicApiKey } from './serialize.js';

// Mounted behind authGuard — req.user is always set here.
export async function listApiKeys(req: Request, res: Response): Promise<void> {
  const apiKeys = await prisma.apiKey.findMany({
    where: { ownerId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({ data: apiKeys.map(toPublicApiKey) });
}
