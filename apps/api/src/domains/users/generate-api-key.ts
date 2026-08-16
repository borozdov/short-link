import type { Request, Response } from 'express';
import { prisma } from '../../db/client.js';
import { generateApiKey, hashApiKey } from '../../middleware/api-key-guard.js';

// Mounted behind authGuard — req.user is always set here.
export async function createApiKey(req: Request, res: Response): Promise<void> {
  const rawKey = generateApiKey();

  const apiKey = await prisma.apiKey.create({
    data: {
      keyHash: hashApiKey(rawKey),
      ownerId: req.user!.id,
    },
  });

  res.status(201).json({
    data: {
      id: apiKey.id,
      rawKey,
      createdAt: apiKey.createdAt.toISOString(),
    },
  });
}
