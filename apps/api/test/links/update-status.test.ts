import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { UpdateLinkStatusResponseSchema } from '@short-link/shared';
import { app } from '../../src/app.js';
import { prisma } from '../../src/db/client.js';

describe('PATCH /api/links/stats/:secretToken', () => {
  it('returns 404 for an unknown secretToken', async () => {
    const response = await request(app)
      .patch('/api/links/stats/no-such-token')
      .send({ status: 'DISABLED' });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('rejects an invalid status value', async () => {
    const link = await prisma.link.create({
      data: {
        uid: 'togglelnk',
        targetUrl: 'https://example.com/toggle',
        secretToken: 'toggle-secret-token',
      },
    });

    const response = await request(app)
      .patch(`/api/links/stats/${link.secretToken}`)
      .send({ status: 'EXPIRED' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_STATUS');
  });

  it('disables an active link and matches UpdateLinkStatusResponseSchema', async () => {
    const link = await prisma.link.create({
      data: {
        uid: 'togglelnk2',
        targetUrl: 'https://example.com/toggle2',
        secretToken: 'toggle-secret-token-2',
      },
    });

    const response = await request(app)
      .patch(`/api/links/stats/${link.secretToken}`)
      .send({ status: 'DISABLED' });

    expect(response.status).toBe(200);
    expect(UpdateLinkStatusResponseSchema.safeParse(response.body.data).success).toBe(true);
    expect(response.body.data.status).toBe('DISABLED');

    const stored = await prisma.link.findUnique({ where: { secretToken: link.secretToken } });
    expect(stored?.status).toBe('DISABLED');
  });

  it('re-enables a disabled link', async () => {
    const link = await prisma.link.create({
      data: {
        uid: 'togglelnk3',
        targetUrl: 'https://example.com/toggle3',
        secretToken: 'toggle-secret-token-3',
        status: 'DISABLED',
      },
    });

    const response = await request(app)
      .patch(`/api/links/stats/${link.secretToken}`)
      .send({ status: 'ACTIVE' });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ACTIVE');
  });

  it('refuses to change the status of an expired link', async () => {
    const link = await prisma.link.create({
      data: {
        uid: 'togglelnk4',
        targetUrl: 'https://example.com/toggle4',
        secretToken: 'toggle-secret-token-4',
        status: 'EXPIRED',
      },
    });

    const response = await request(app)
      .patch(`/api/links/stats/${link.secretToken}`)
      .send({ status: 'ACTIVE' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('LINK_EXPIRED');
  });
});
