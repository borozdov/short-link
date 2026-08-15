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

describe('GET /api/users/links', () => {
  it('rejects a request with no cookie', async () => {
    const response = await request(app).get('/api/users/links');
    expect(response.status).toBe(401);
  });

  it('only returns links owned by the authenticated user', async () => {
    const cookieA = await registerAndGetCookie('owner-a@example.com');
    await registerAndGetCookie('owner-b@example.com');

    const userA = await prisma.user.findUniqueOrThrow({ where: { email: 'owner-a@example.com' } });
    const userB = await prisma.user.findUniqueOrThrow({ where: { email: 'owner-b@example.com' } });

    await prisma.link.create({
      data: { uid: 'linka1', targetUrl: 'https://example.com/a', secretToken: 'secret-a1', ownerId: userA.id },
    });
    await prisma.link.create({
      data: { uid: 'linkb1', targetUrl: 'https://example.com/b', secretToken: 'secret-b1', ownerId: userB.id },
    });
    await prisma.link.create({
      data: { uid: 'linkanon', targetUrl: 'https://example.com/anon', secretToken: 'secret-anon' },
    });

    const responseA = await request(app).get('/api/users/links').set('Cookie', [cookieA]);

    expect(responseA.status).toBe(200);
    expect(responseA.body.data).toHaveLength(1);
    expect(responseA.body.data[0].uid).toBe('linka1');
  });
});
