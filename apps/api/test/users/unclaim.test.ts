import { describe, expect, it } from 'vitest';
import request from 'supertest';
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

describe('POST /api/users/links/:id/unclaim', () => {
  it('sets ownerId back to null for the owner', async () => {
    const cookie = await registerAndGetCookie('unclaimer@example.com');
    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'unclaimer@example.com' } });

    const link = await prisma.link.create({
      data: {
        uid: 'unclaimme',
        targetUrl: 'https://example.com/unclaim',
        secretToken: 'unclaim-secret',
        ownerId: user.id,
      },
    });

    const response = await request(app).post(`/api/users/links/${link.id}/unclaim`).set('Cookie', [cookie]);

    expect(response.status).toBe(200);
    expect(response.body.data.ownerId).toBeNull();

    const stillListed = await request(app).get('/api/users/links').set('Cookie', [cookie]);
    expect(stillListed.body.data).toHaveLength(0);
  });

  it('returns 404 for a link owned by someone else, and leaves it untouched', async () => {
    await registerAndGetCookie('real-owner@example.com');
    const otherCookie = await registerAndGetCookie('not-the-owner@example.com');
    const owner = await prisma.user.findUniqueOrThrow({ where: { email: 'real-owner@example.com' } });

    const link = await prisma.link.create({
      data: {
        uid: 'notyours',
        targetUrl: 'https://example.com/notyours',
        secretToken: 'notyours-secret',
        ownerId: owner.id,
      },
    });

    const response = await request(app).post(`/api/users/links/${link.id}/unclaim`).set('Cookie', [otherCookie]);

    expect(response.status).toBe(404);

    const unchanged = await prisma.link.findUniqueOrThrow({ where: { id: link.id } });
    expect(unchanged.ownerId).toBe(owner.id);
  });

  it('returns 404 for an unknown link id', async () => {
    const cookie = await registerAndGetCookie('unclaim-404@example.com');

    const response = await request(app)
      .post('/api/users/links/00000000-0000-0000-0000-000000000000/unclaim')
      .set('Cookie', [cookie]);

    expect(response.status).toBe(404);
  });
});
