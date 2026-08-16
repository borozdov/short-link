import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { ApiKeyGenerateResponseSchema } from '@short-link/shared';
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

describe('POST /api/users/api-keys', () => {
  it('rejects a request with no cookie', async () => {
    const response = await request(app).post('/api/users/api-keys');
    expect(response.status).toBe(401);
  });

  it('generates a key, returns it once, and stores only its hash', async () => {
    const cookie = await registerAndGetCookie('generate-key@example.com');

    const response = await request(app).post('/api/users/api-keys').set('Cookie', [cookie]);

    expect(response.status).toBe(201);
    expect(ApiKeyGenerateResponseSchema.safeParse(response.body.data).success).toBe(true);

    const stored = await prisma.apiKey.findUniqueOrThrow({ where: { id: response.body.data.id } });
    expect(stored.keyHash).not.toBe(response.body.data.rawKey);
  });
});

describe('GET /api/users/api-keys', () => {
  it('rejects a request with no cookie', async () => {
    const response = await request(app).get('/api/users/api-keys');
    expect(response.status).toBe(401);
  });

  it('lists only the caller\'s own keys', async () => {
    const cookieA = await registerAndGetCookie('list-keys-a@example.com');
    const cookieB = await registerAndGetCookie('list-keys-b@example.com');

    await request(app).post('/api/users/api-keys').set('Cookie', [cookieA]);
    await request(app).post('/api/users/api-keys').set('Cookie', [cookieB]);

    const response = await request(app).get('/api/users/api-keys').set('Cookie', [cookieA]);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });
});

describe('POST /api/users/api-keys/:id/revoke', () => {
  it('rejects a request with no cookie', async () => {
    const response = await request(app).post('/api/users/api-keys/some-id/revoke');
    expect(response.status).toBe(401);
  });

  it('revokes a key owned by the caller', async () => {
    const cookie = await registerAndGetCookie('revoke-key@example.com');
    const generateResponse = await request(app).post('/api/users/api-keys').set('Cookie', [cookie]);
    const keyId = generateResponse.body.data.id;

    const response = await request(app).post(`/api/users/api-keys/${keyId}/revoke`).set('Cookie', [cookie]);

    expect(response.status).toBe(200);
    expect(response.body.data.revokedAt).not.toBeNull();
  });

  it('is idempotent when revoking an already-revoked key', async () => {
    const cookie = await registerAndGetCookie('revoke-key-twice@example.com');
    const generateResponse = await request(app).post('/api/users/api-keys').set('Cookie', [cookie]);
    const keyId = generateResponse.body.data.id;

    const first = await request(app).post(`/api/users/api-keys/${keyId}/revoke`).set('Cookie', [cookie]);
    const second = await request(app).post(`/api/users/api-keys/${keyId}/revoke`).set('Cookie', [cookie]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.data.revokedAt).toBe(first.body.data.revokedAt);
  });

  it('returns 404 for a key that does not belong to the caller', async () => {
    const cookieA = await registerAndGetCookie('revoke-owner@example.com');
    const cookieB = await registerAndGetCookie('revoke-intruder@example.com');
    const generateResponse = await request(app).post('/api/users/api-keys').set('Cookie', [cookieA]);
    const keyId = generateResponse.body.data.id;

    const response = await request(app).post(`/api/users/api-keys/${keyId}/revoke`).set('Cookie', [cookieB]);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 404 for an unknown key id', async () => {
    const cookie = await registerAndGetCookie('revoke-unknown@example.com');

    const response = await request(app)
      .post('/api/users/api-keys/00000000-0000-0000-0000-000000000000/revoke')
      .set('Cookie', [cookie]);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
