import type { Request, Response } from 'express';
import { prisma } from '../../db/client.js';
import type { Link } from '../../generated/prisma/client.js';
import { env } from '../../config/env.js';
import { hashIp } from './ip-hash.js';
import { fetchTargetPreview, isBotUserAgent, renderPreviewHtml } from './bot-preview.js';

// tech.md "UTM на редиректе": link's UTM fields override same-named query params already
// present on targetUrl; everything else on targetUrl is left untouched.
function applyUtmParams(targetUrl: string, link: Pick<Link, 'utmSource' | 'utmMedium' | 'utmCampaign'>): string {
  const url = new URL(targetUrl);
  if (link.utmSource) url.searchParams.set('utm_source', link.utmSource);
  if (link.utmMedium) url.searchParams.set('utm_medium', link.utmMedium);
  if (link.utmCampaign) url.searchParams.set('utm_campaign', link.utmCampaign);
  return url.toString();
}

export async function redirectLink(req: Request<{ uid: string }>, res: Response): Promise<void> {
  const { uid } = req.params;
  const link = await prisma.link.findUnique({ where: { uid } });

  if (!link || link.status !== 'ACTIVE') {
    res.redirect(302, env.BASE_FALLBACK_URL);
    return;
  }

  const finalUrl = applyUtmParams(link.targetUrl, link);

  // Preview bots fetch on share/paste, not on a human visit — never a real click.
  if (isBotUserAgent(req.get('user-agent'))) {
    const preview = await fetchTargetPreview(link.targetUrl);
    if (preview) {
      res.status(200).send(
        renderPreviewHtml({ ...preview, shortUrl: `${env.BASE_LINK_DOMAIN}/${link.uid}`, targetUrl: finalUrl }),
      );
      return;
    }
    res.redirect(302, finalUrl);
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

  res.redirect(302, finalUrl);
}
