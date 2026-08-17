import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { CreateLinkResponseSchema } from '@short-link/shared';
import { app } from '../../src/app.js';
import { prisma } from '../../src/db/client.js';

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

describe('POST /api/links — anonymous creation', () => {
  it('creates a link with no auth at all', async () => {
    const response = await request(app).post('/api/links').send({ targetUrl: 'https://example.com/anon' });

    expect(response.status).toBe(201);
    const link = await prisma.link.findUniqueOrThrow({ where: { uid: response.body.data.uid } });
    expect(link.targetUrl).toBe('https://example.com/anon');
  });
});
