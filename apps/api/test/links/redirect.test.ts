import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import * as dnsPromises from 'node:dns/promises';
import { app } from '../../src/app.js';
import { prisma } from '../../src/db/client.js';
import { env } from '../../src/config/env.js';

vi.mock('node:dns/promises', () => ({ lookup: vi.fn() }));

const TELEGRAM_BOT_UA = 'TelegramBot (like TwitterBot)';

// dns.promises.lookup is overloaded on its options param (single address vs array);
// vi.mocked() can't pick the `{ all: true }` overload, so this pins it explicitly.
function mockDnsLookup(addresses: Array<{ address: string; family: number }>): void {
  vi.mocked(dnsPromises.lookup).mockResolvedValue(addresses as never);
}

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

describe('GET /:uid — bot preview', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('serves mirrored og tags to a preview bot and records no click', async () => {
    mockDnsLookup([{ address: '93.184.216.34', family: 4 }]);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html><head><meta property="og:title" content="Target page"></head></html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        }),
      ),
    );

    const link = await prisma.link.create({
      data: { uid: 'botlnk', targetUrl: 'https://example.com/target', secretToken: 'bot-secret-token' },
    });

    const response = await request(app).get(`/${link.uid}`).set('User-Agent', TELEGRAM_BOT_UA);

    expect(response.status).toBe(200);
    expect(response.text).toContain('Target page');
    expect(response.text).toContain('og:title');

    expect(await prisma.click.count({ where: { linkId: link.id } })).toBe(0);
    const updatedLink = await prisma.link.findUniqueOrThrow({ where: { id: link.id } });
    expect(updatedLink.clickCount).toBe(0);
  });

  it('falls back to a normal redirect (still no click) when the preview fetch fails', async () => {
    vi.mocked(dnsPromises.lookup).mockRejectedValue(new Error('ENOTFOUND'));

    const link = await prisma.link.create({
      data: { uid: 'botfail', targetUrl: 'https://example.com/unreachable', secretToken: 'bot-fail-secret' },
    });

    const response = await request(app).get(`/${link.uid}`).set('User-Agent', TELEGRAM_BOT_UA);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('https://example.com/unreachable');
    expect(await prisma.click.count({ where: { linkId: link.id } })).toBe(0);
  });

  it('still falls back to BASE_FALLBACK_URL for an inactive link, bot or not', async () => {
    const response = await request(app).get('/does-not-exist').set('User-Agent', TELEGRAM_BOT_UA);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(env.BASE_FALLBACK_URL);
  });
});
