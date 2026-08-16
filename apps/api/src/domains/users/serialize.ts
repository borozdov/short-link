import type { ApiKey as PrismaApiKey, Link as PrismaLink } from '../../generated/prisma/client.js';
import type { ApiKey, Link } from '@short-link/shared';

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

export function toPublicApiKey(apiKey: PrismaApiKey): ApiKey {
  return {
    id: apiKey.id,
    ownerId: apiKey.ownerId,
    createdAt: apiKey.createdAt.toISOString(),
    revokedAt: apiKey.revokedAt ? apiKey.revokedAt.toISOString() : null,
  };
}
