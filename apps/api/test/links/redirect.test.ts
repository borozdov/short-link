import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/db/client.js';

describe('GET /:uid', () => {
  it('redirects an active link and records exactly one click', async () => {
    const link = await prisma.link.create({
      data: {
        uid: 'testlnk',
        targetUrl: 'https://example.com/target',
        secretToken: 'test-secret-token',
      },
    });

    const response = await request(app).get(`/${link.uid}`);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('https://example.com/target');

    const clicks = await prisma.click.findMany({ where: { linkId: link.id } });
    expect(clicks).toHaveLength(1);

    const updatedLink = await prisma.link.findUniqueOrThrow({ where: { id: link.id } });
    expect(updatedLink.clickCount).toBe(1);
  });
});
