import type { Request, Response } from 'express';
import { prisma } from '../../db/client.js';
import { toPublicLink } from './serialize.js';

// Mounted behind authGuard — req.user is always set here.
export async function listUserLinks(req: Request, res: Response): Promise<void> {
  const links = await prisma.link.findMany({
    where: { ownerId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({ data: links.map(toPublicLink) });
}
