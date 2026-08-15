import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { ClaimLinkRequestSchema } from '@short-link/shared';
import { app } from '../../src/app.js';
import { prisma } from '../../src/db/client.js';
import { extractCookie } from '../auth/cookies.js';
import { ACCESS_COOKIE_NAME } from '../../src/domains/auth/tokens.js';

async function registerAndGetCookie(email: string): Promise<string> {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'longenough' });
  return extractCookie(response, ACCESS_COOKIE_NAME);
}

describe('ClaimLinkRequestSchema — contract', () => {
  it('accepts a valid payload', () => {
    expect(ClaimLinkRequestSchema.safeParse({ secretToken: 'abc' }).success).toBe(true);
  });

  it('rejects an empty secretToken', () => {
    expect(ClaimLinkRequestSchema.safeParse({ secretToken: '' }).success).toBe(false);
  });
});

describe('POST /api/users/links/claim', () => {
  it('rejects a request with no cookie', async () => {
    const response = await request(app).post('/api/users/links/claim').send({ secretToken: 'whatever' });
    expect(response.status).toBe(401);
  });

  it('claims an anonymous link and sets ownerId', async () => {
    const cookie = await registerAndGetCookie('claimer@example.com');
    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'claimer@example.com' } });

    const link = await prisma.link.create({
      data: { uid: 'claimme', targetUrl: 'https://example.com/claim', secretToken: 'claim-secret' },
    });

    const response = await request(app)
      .post('/api/users/links/claim')
      .set('Cookie', [cookie])
      .send({ secretToken: link.secretToken });

    expect(response.status).toBe(200);
    expect(response.body.data.ownerId).toBe(user.id);
  });

  it('returns 404 for an unknown secretToken', async () => {
    const cookie = await registerAndGetCookie('claimer-404@example.com');

    const response = await request(app)
      .post('/api/users/links/claim')
      .set('Cookie', [cookie])
      .send({ secretToken: 'no-such-token' });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 409 ALREADY_CLAIMED when a different user re-claims the same link', async () => {
    const cookieA = await registerAndGetCookie('first-claimer@example.com');
    const cookieB = await registerAndGetCookie('second-claimer@example.com');

    const link = await prisma.link.create({
      data: { uid: 'doubleclaim', targetUrl: 'https://example.com/double', secretToken: 'double-secret' },
    });

    const firstClaim = await request(app)
      .post('/api/users/links/claim')
      .set('Cookie', [cookieA])
      .send({ secretToken: link.secretToken });
    expect(firstClaim.status).toBe(200);

    const secondClaim = await request(app)
      .post('/api/users/links/claim')
      .set('Cookie', [cookieB])
      .send({ secretToken: link.secretToken });

    expect(secondClaim.status).toBe(409);
    expect(secondClaim.body.error.code).toBe('ALREADY_CLAIMED');
  });

  it('returns 409 ALREADY_CLAIMED when the same user re-claims an already-owned link', async () => {
    const cookie = await registerAndGetCookie('self-reclaim@example.com');

    const link = await prisma.link.create({
      data: { uid: 'selfreclaim', targetUrl: 'https://example.com/self', secretToken: 'self-secret' },
    });

    await request(app)
      .post('/api/users/links/claim')
      .set('Cookie', [cookie])
      .send({ secretToken: link.secretToken });

    const secondAttempt = await request(app)
      .post('/api/users/links/claim')
      .set('Cookie', [cookie])
      .send({ secretToken: link.secretToken });

    expect(secondAttempt.status).toBe(409);
    expect(secondAttempt.body.error.code).toBe('ALREADY_CLAIMED');
  });
});
