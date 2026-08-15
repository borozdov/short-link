import type { Request, Response } from 'express';
import { prisma } from '../../db/client.js';
import { env } from '../../config/env.js';
import { hashIp } from './ip-hash.js';

export async function redirectLink(req: Request<{ uid: string }>, res: Response): Promise<void> {
  const { uid } = req.params;
  const link = await prisma.link.findUnique({ where: { uid } });

  if (!link || link.status !== 'ACTIVE') {
    res.redirect(302, env.BASE_FALLBACK_URL);
    return;
  }

  await prisma.$transaction([
    prisma.click.create({
      data: {
        linkId: link.id,
        referrer: req.get('referer') ?? null,
        userAgent: req.get('user-agent') ?? null,
        ipHash: req.ip ? hashIp(req.ip) : null,
      },
    }),
    prisma.link.update({
      where: { id: link.id },
      data: { clickCount: { increment: 1 } },
    }),
  ]);

  res.redirect(302, link.targetUrl);
}
