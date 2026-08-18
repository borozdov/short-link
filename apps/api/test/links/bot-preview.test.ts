import { afterEach, describe, expect, it, vi } from 'vitest';
import * as dnsPromises from 'node:dns/promises';
import { fetchTargetPreview, isBotUserAgent, isSafeHost, renderPreviewHtml } from '../../src/domains/links/bot-preview.js';

vi.mock('node:dns/promises', () => ({ lookup: vi.fn() }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// dns.promises.lookup is overloaded on its options param (single address vs array);
// vi.mocked() can't pick the `{ all: true }` overload, so this pins it explicitly.
function mockDnsLookup(addresses: Array<{ address: string; family: number }>): void {
  vi.mocked(dnsPromises.lookup).mockResolvedValue(addresses as never);
}

describe('isBotUserAgent', () => {
  it.each([
    'facebookexternalhit/1.1',
    'Twitterbot/1.0',
    'TelegramBot (like TwitterBot)',
    'WhatsApp/2.23.20.0',
    'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
    'Slackbot-LinkExpanding 1.0',
  ])('recognizes %s as a bot', (userAgent) => {
    expect(isBotUserAgent(userAgent)).toBe(true);
  });

  it.each([undefined, '', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'])(
    'does not flag %s as a bot',
    (userAgent) => {
      expect(isBotUserAgent(userAgent)).toBe(false);
    },
  );
});

describe('isSafeHost — SSRF guard', () => {
  it.each([
    ['127.0.0.1', 4, 'loopback'],
    ['10.1.2.3', 4, 'private (10/8)'],
    ['172.16.0.1', 4, 'private (172.16/12)'],
    ['192.168.1.1', 4, 'private (192.168/16)'],
    ['169.254.169.254', 4, 'cloud metadata'],
    ['0.0.0.0', 4, 'this-network'],
    ['::1', 6, 'IPv6 loopback'],
    ['fc00::1', 6, 'IPv6 unique local'],
    ['fe80::1', 6, 'IPv6 link-local'],
  ])('rejects %s (%s)', async (address, family) => {
    mockDnsLookup([{ address, family }]);
    expect(await isSafeHost('attacker-controlled.example')).toBe(false);
  });

  it('allows a public address', async () => {
    mockDnsLookup([{ address: '93.184.216.34', family: 4 }]);
    expect(await isSafeHost('example.com')).toBe(true);
  });

  it('rejects if any resolved address is private, even if others are public', async () => {
    mockDnsLookup([
      { address: '93.184.216.34', family: 4 },
      { address: '127.0.0.1', family: 4 },
    ]);
    expect(await isSafeHost('mixed.example')).toBe(false);
  });

  it('rejects when DNS resolution fails', async () => {
    vi.mocked(dnsPromises.lookup).mockRejectedValue(new Error('ENOTFOUND'));
    expect(await isSafeHost('does-not-resolve.example')).toBe(false);
  });
});

describe('fetchTargetPreview', () => {
  it('extracts og:title/description/image from a safe target', async () => {
    mockDnsLookup([{ address: '93.184.216.34', family: 4 }]);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          `<html><head>
            <meta property="og:title" content="Hello &amp; welcome">
            <meta property="og:description" content="A test page">
            <meta property="og:image" content="/img.png">
          </head></html>`,
          { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } },
        ),
      ),
    );

    const preview = await fetchTargetPreview(`https://unique-${Math.random()}.example/page`);

    expect(preview?.title).toBe('Hello & welcome');
    expect(preview?.description).toBe('A test page');
    expect(preview?.image).toMatch(/^https:\/\/unique-.*\.example\/img\.png$/);
  });

  it('falls back to null when the target has no title', async () => {
    mockDnsLookup([{ address: '93.184.216.34', family: 4 }]);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<html><head></head></html>', { status: 200, headers: { 'content-type': 'text/html' } })),
    );

    expect(await fetchTargetPreview(`https://unique-${Math.random()}.example/empty`)).toBeNull();
  });

  it('returns null without ever fetching when the target resolves to a private address', async () => {
    mockDnsLookup([{ address: '127.0.0.1', family: 4 }]);
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    expect(await fetchTargetPreview(`https://unique-${Math.random()}.example/blocked`)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns null when the target times out or errors', async () => {
    mockDnsLookup([{ address: '93.184.216.34', family: 4 }]);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network error')),
    );

    expect(await fetchTargetPreview(`https://unique-${Math.random()}.example/down`)).toBeNull();
  });

  it('does not throw when the body stream errors mid-read (e.g. abort while streaming)', async () => {
    mockDnsLookup([{ address: '93.184.216.34', family: 4 }]);
    const flakyBody = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('<html><head><meta property="og:title" content="Partial">'));
      },
      pull() {
        throw new Error('connection dropped mid-stream');
      },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(flakyBody, { status: 200, headers: { 'content-type': 'text/html' } })),
    );

    // Must resolve (not reject) — this used to throw an uncaught error past
    // redirectLink and surface as a 500 instead of the documented 302 fallback.
    // What was already read before the drop is still usable.
    const preview = await fetchTargetPreview(`https://unique-${Math.random()}.example/flaky`);
    expect(preview?.title).toBe('Partial');
  });
});

describe('renderPreviewHtml', () => {
  it('escapes untrusted title/description/image from the target page', () => {
    const html = renderPreviewHtml({
      title: '<script>alert(1)</script>',
      description: '"quoted" & <b>bold</b>',
      image: 'https://example.com/img.png',
      shortUrl: 'https://link.borozdov.ru/abc123',
      targetUrl: 'https://example.com/target',
    });

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('&quot;quoted&quot;');
    expect(html).toContain('og:title');
    expect(html).toContain('og:image');
  });
});
