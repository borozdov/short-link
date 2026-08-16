import type { Request, Response } from 'express';
import { prisma } from '../../db/client.js';
import { env } from '../../config/env.js';
import { HttpError } from '../../middleware/http-error.js';

export async function getLinkStats(req: Request<{ secretToken: string }>, res: Response): Promise<void> {
  const link = await prisma.link.findUnique({ where: { secretToken: req.params.secretToken } });
  if (!link) {
    throw new HttpError(404, 'NOT_FOUND', 'Не найдено');
  }

  const clicks = await prisma.click.findMany({
    where: { linkId: link.id },
    orderBy: { occurredAt: 'desc' },
    take: 100,
  });

  res.json({
    data: {
      uid: link.uid,
      shortUrl: `${env.BASE_LINK_DOMAIN}/${link.uid}`,
      status: link.status,
      targetUrl: link.targetUrl,
      createdAt: link.createdAt.toISOString(),
      expiresAt: link.expiresAt?.toISOString() ?? null,
      clickCount: link.clickCount,
      clicks: clicks.map((click) => ({
        occurredAt: click.occurredAt.toISOString(),
        referrer: click.referrer,
      })),
    },
  });
}
