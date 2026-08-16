import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { CreateLinkResponseSchema } from '@short-link/shared';
import { app } from '../../src/app.js';
import { prisma } from '../../src/db/client.js';
import { ACCESS_COOKIE_NAME } from '../../src/domains/auth/tokens.js';
import { API_KEY_RATE_LIMIT_MAX, apiKeyRateLimiter, hashApiKey } from '../../src/middleware/api-key-guard.js';
import { extractCookie } from '../auth/cookies.js';

async function registerAndGetUser(email: string): Promise<{ cookie: string; userId: string }> {
  const response = await request(app).post('/api/auth/register').send({ email, password: 'longenough' });
  const cookie = extractCookie(response, ACCESS_COOKIE_NAME);
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  return { cookie, userId: user.id };
}

describe('POST /api/links — custom slug', () => {
  it('creates a link with a valid custom slug', async () => {
    const response = await request(app)
      .post('/api/links')
      .send({ targetUrl: 'https://example.com/a', customSlug: 'my-cool-link' });

    expect(response.status).toBe(201);
    expect(response.body.data.uid).toBe('my-cool-link');
  });

  it('rejects a forbidden slug', async () => {
    const response = await request(app)
      .post('/api/links')
      .send({ targetUrl: 'https://example.com/b', customSlug: 'admin' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_CUSTOM_SLUG');
  });

  it('rejects a forbidden slug regardless of case', async () => {
    const response = await request(app)
      .post('/api/links')
      .send({ targetUrl: 'https://example.com/b', customSlug: 'Admin' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_CUSTOM_SLUG');
  });

  it('rejects a slug shorter than 3 characters', async () => {
    const response = await request(app)
      .post('/api/links')
      .send({ targetUrl: 'https://example.com/c', customSlug: 'ab' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_CUSTOM_SLUG');
  });

  it('rejects a slug with disallowed characters', async () => {
    const response = await request(app)
      .post('/api/links')
      .send({ targetUrl: 'https://example.com/d', customSlug: 'not valid!' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_CUSTOM_SLUG');
  });

  it('rejects a slug that is already taken', async () => {
    await request(app)
      .post('/api/links')
      .send({ targetUrl: 'https://example.com/e', customSlug: 'taken-slug' });

    const response = await request(app)
      .post('/api/links')
      .send({ targetUrl: 'https://example.com/f', customSlug: 'taken-slug' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('SLUG_TAKEN');
  });
});

describe('POST /api/links — contract', () => {
  it('response matches CreateLinkResponseSchema', async () => {
    const response = await request(app)
      .post('/api/links')
      .send({ targetUrl: 'https://example.com/contract' });

    expect(response.status).toBe(201);
    expect(CreateLinkResponseSchema.safeParse(response.body.data).success).toBe(true);
  });
});

describe('POST /api/links — invalid targetUrl', () => {
  it('rejects a non-URL targetUrl and creates no row', async () => {
    const before = await prisma.link.count();

    const response = await request(app).post('/api/links').send({ targetUrl: 'not-a-url' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_TARGET_URL');
    expect(await prisma.link.count()).toBe(before);
  });
});

describe('POST /api/links — ownerId attribution', () => {
  it('creates an anonymous link with no auth at all', async () => {
    const response = await request(app).post('/api/links').send({ targetUrl: 'https://example.com/anon' });

    expect(response.status).toBe(201);
    const link = await prisma.link.findUniqueOrThrow({ where: { uid: response.body.data.uid } });
    expect(link.ownerId).toBeNull();
  });

  it('sets ownerId from a valid cookie session', async () => {
    const { cookie, userId } = await registerAndGetUser('link-owner-cookie@example.com');

    const response = await request(app)
      .post('/api/links')
      .set('Cookie', [cookie])
      .send({ targetUrl: 'https://example.com/owned-by-cookie' });

    expect(response.status).toBe(201);
    const link = await prisma.link.findUniqueOrThrow({ where: { uid: response.body.data.uid } });
    expect(link.ownerId).toBe(userId);
  });

  it('proceeds anonymously with an invalid cookie rather than blocking', async () => {
    const response = await request(app)
      .post('/api/links')
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=garbage`])
      .send({ targetUrl: 'https://example.com/bad-cookie' });

    expect(response.status).toBe(201);
    const link = await prisma.link.findUniqueOrThrow({ where: { uid: response.body.data.uid } });
    expect(link.ownerId).toBeNull();
  });

  it('sets ownerId from a valid Bearer API key', async () => {
    const { userId } = await registerAndGetUser('link-owner-key@example.com');
    const rawKey = 'test-raw-key-owner';
    await prisma.apiKey.create({ data: { keyHash: hashApiKey(rawKey), ownerId: userId } });

    const response = await request(app)
      .post('/api/links')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({ targetUrl: 'https://example.com/owned-by-key' });

    expect(response.status).toBe(201);
    const link = await prisma.link.findUniqueOrThrow({ where: { uid: response.body.data.uid } });
    expect(link.ownerId).toBe(userId);
  });

  it('rejects an unknown Bearer key with 401 INVALID_API_KEY', async () => {
    const response = await request(app)
      .post('/api/links')
      .set('Authorization', 'Bearer does-not-exist')
      .send({ targetUrl: 'https://example.com/bad-key' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_API_KEY');
  });

  it('rejects a revoked Bearer key with 401 INVALID_API_KEY', async () => {
    const { userId } = await registerAndGetUser('link-owner-revoked@example.com');
    const rawKey = 'test-raw-key-revoked';
    await prisma.apiKey.create({
      data: { keyHash: hashApiKey(rawKey), ownerId: userId, revokedAt: new Date() },
    });

    const response = await request(app)
      .post('/api/links')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({ targetUrl: 'https://example.com/revoked-key' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_API_KEY');
  });

  it('returns 429 RATE_LIMITED once the per-key limit is exhausted', async () => {
    const { userId } = await registerAndGetUser('link-owner-ratelimited@example.com');
    const rawKey = 'test-raw-key-ratelimited';
    const apiKey = await prisma.apiKey.create({ data: { keyHash: hashApiKey(rawKey), ownerId: userId } });

    for (let i = 0; i < API_KEY_RATE_LIMIT_MAX; i++) {
      apiKeyRateLimiter.check(apiKey.id);
    }

    const response = await request(app)
      .post('/api/links')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({ targetUrl: 'https://example.com/rate-limited' });

    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe('RATE_LIMITED');
  });
});
