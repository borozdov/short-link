import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/db/client.js';
import { env } from '../../src/config/env.js';

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

  it('falls back to BASE_FALLBACK_URL for an unknown uid', async () => {
    const response = await request(app).get('/does-not-exist');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(env.BASE_FALLBACK_URL);
    expect(await prisma.click.count()).toBe(0);
  });

  it('falls back to BASE_FALLBACK_URL for an expired link', async () => {
    const link = await prisma.link.create({
      data: {
        uid: 'expiredlnk',
        targetUrl: 'https://example.com/expired',
        secretToken: 'expired-secret-token',
        status: 'EXPIRED',
      },
    });

    const response = await request(app).get(`/${link.uid}`);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(env.BASE_FALLBACK_URL);
    expect(await prisma.click.count({ where: { linkId: link.id } })).toBe(0);
  });

  it('falls back to BASE_FALLBACK_URL for a disabled link', async () => {
    const link = await prisma.link.create({
      data: {
        uid: 'disabledlnk',
        targetUrl: 'https://example.com/disabled',
        secretToken: 'disabled-secret-token',
        status: 'DISABLED',
      },
    });

    const response = await request(app).get(`/${link.uid}`);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(env.BASE_FALLBACK_URL);
    expect(await prisma.click.count({ where: { linkId: link.id } })).toBe(0);
  });

  it('merges UTM params into the target URL, overriding existing ones and keeping others', async () => {
    const link = await prisma.link.create({
      data: {
        uid: 'utmlnk',
        targetUrl: 'https://example.com/target?utm_source=old&other=1',
        secretToken: 'utm-secret-token',
        utmSource: 'newsletter',
        utmMedium: 'email',
        utmCampaign: 'launch',
      },
    });

    const response = await request(app).get(`/${link.uid}`);

    expect(response.status).toBe(302);
    const location = new URL(response.headers.location);
    expect(location.searchParams.get('utm_source')).toBe('newsletter');
    expect(location.searchParams.get('utm_medium')).toBe('email');
    expect(location.searchParams.get('utm_campaign')).toBe('launch');
    expect(location.searchParams.get('other')).toBe('1');
  });
});
