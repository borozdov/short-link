import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { LinkStatsResponseSchema } from '@short-link/shared';
import { app } from '../../src/app.js';
import { prisma } from '../../src/db/client.js';

describe('GET /api/links/stats/:secretToken', () => {
  it('returns 404 for an unknown secretToken', async () => {
    const response = await request(app).get('/api/links/stats/no-such-token');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('response matches LinkStatsResponseSchema', async () => {
    const link = await prisma.link.create({
      data: {
        uid: 'statslnk',
        targetUrl: 'https://example.com/stats',
        secretToken: 'stats-secret-token',
      },
    });

    const response = await request(app).get(`/api/links/stats/${link.secretToken}`);

    expect(response.status).toBe(200);
    expect(LinkStatsResponseSchema.safeParse(response.body.data).success).toBe(true);
  });

  it('reports clickCount and the click timeline for a link with clicks', async () => {
    const link = await prisma.link.create({
      data: {
        uid: 'statslnk2',
        targetUrl: 'https://example.com/stats2',
        secretToken: 'stats-secret-token-2',
      },
    });

    await request(app).get(`/${link.uid}`);
    await request(app).get(`/${link.uid}`);

    const response = await request(app).get(`/api/links/stats/${link.secretToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.clickCount).toBe(2);
    expect(response.body.data.clicks).toHaveLength(2);
    expect(response.body.data.status).toBe('ACTIVE');
  });
});
