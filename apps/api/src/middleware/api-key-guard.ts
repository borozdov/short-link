import { createHash } from 'node:crypto';
import { nanoid } from 'nanoid';
import type { Role } from '@short-link/shared';
import { prisma } from '../db/client.js';
import { HttpError } from './http-error.js';
import { createRateLimiter } from './rate-limit.js';

const API_KEY_RATE_LIMIT_WINDOW_MS = 60_000;
export const API_KEY_RATE_LIMIT_MAX = 60;

// tech.md: 60 req/min per apiKey.id — keyed by the key, not the owner, so each key has its own budget.
export const apiKeyRateLimiter = createRateLimiter({
  windowMs: API_KEY_RATE_LIMIT_WINDOW_MS,
  max: API_KEY_RATE_LIMIT_MAX,
});

export function generateApiKey(): string {
  return nanoid(32);
}

// Unsalted sha256: keyHash needs exact-match lookup, which rules out bcrypt (salted,
// non-deterministic). Unlike passwords, the raw key is already high-entropy (nanoid),
// so a salt wouldn't add protection — same reasoning GitHub/Stripe use for API tokens.
export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

export interface ApiKeyUser {
  id: string;
  role: Role;
}

export async function resolveApiKeyUser(rawKey: string): Promise<ApiKeyUser> {
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: hashApiKey(rawKey) },
    include: { owner: { select: { role: true } } },
  });

  if (!apiKey || apiKey.revokedAt) {
    throw new HttpError(401, 'INVALID_API_KEY', 'Invalid or revoked API key');
  }

  if (!apiKeyRateLimiter.check(apiKey.id)) {
    throw new HttpError(429, 'RATE_LIMITED', 'Too many requests for this API key');
  }

  return { id: apiKey.ownerId, role: apiKey.owner.role };
}
