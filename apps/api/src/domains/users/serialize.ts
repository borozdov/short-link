import type { Link as PrismaLink } from '../../generated/prisma/client.js';
import type { Link } from '@short-link/shared';

export function toPublicLink(link: PrismaLink): Link {
  return {
    id: link.id,
    uid: link.uid,
    targetUrl: link.targetUrl,
    ownerId: link.ownerId,
    isCustomSlug: link.isCustomSlug,
    status: link.status,
    expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
    utmSource: link.utmSource,
    utmMedium: link.utmMedium,
    utmCampaign: link.utmCampaign,
    clickCount: link.clickCount,
    createdAt: link.createdAt.toISOString(),
  };
}
