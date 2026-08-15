import type { Request, Response } from 'express';
import { prisma } from '../../db/client.js';
import { HttpError } from '../../middleware/http-error.js';
import { toPublicLink } from './serialize.js';

// Mounted behind authGuard — req.user is always set here.
export async function getUserLinkStats(req: Request<{ id: string }>, res: Response): Promise<void> {
  const link = await prisma.link.findFirst({
    where: { id: req.params.id, ownerId: req.user!.id },
  });
  if (!link) {
    throw new HttpError(404, 'NOT_FOUND', 'Not found');
  }

  const [dailyStats, clicks] = await Promise.all([
    prisma.dailyLinkStat.findMany({
      where: { linkId: link.id },
      orderBy: { date: 'asc' },
    }),
    prisma.click.findMany({
      where: { linkId: link.id },
      orderBy: { occurredAt: 'desc' },
      take: 100,
    }),
  ]);

  res.status(200).json({
    data: {
      link: toPublicLink(link),
      dailyStats: dailyStats.map((stat) => ({
        linkId: stat.linkId,
        date: stat.date.toISOString(),
        clickCount: stat.clickCount,
      })),
      clicks: clicks.map((click) => ({
        id: click.id,
        linkId: click.linkId,
        occurredAt: click.occurredAt.toISOString(),
        referrer: click.referrer,
        userAgent: click.userAgent,
        country: click.country,
      })),
    },
  });
}
