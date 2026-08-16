import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { BULK_TEXT_MAX_CHARS, BULK_TEXT_MAX_LINKS, BulkTextResponseSchema } from '@short-link/shared';
import { app } from '../../src/app.js';
import { prisma } from '../../src/db/client.js';
import { env } from '../../src/config/env.js';

describe('POST /api/links/bulk-text — contract', () => {
  it('replaces every URL and leaves the rest of the text byte-identical', async () => {
    const text = 'Check out https://example.com/a and also https://example.com/b, thanks!';

    const response = await request(app).post('/api/links/bulk-text').send({ text });

    expect(response.status).toBe(200);
    expect(BulkTextResponseSchema.safeParse(response.body.data).success).toBe(true);

    const { text: rewritten, created } = response.body.data;
    expect(created).toHaveLength(2);
    expect(created[0].original).toBe('https://example.com/a');
    expect(created[1].original).toBe('https://example.com/b');

    const expected = text
      .replace('https://example.com/a', created[0].short)
      .replace('https://example.com/b', created[1].short);
    expect(rewritten).toBe(expected);

    // The non-URL text survives untouched, byte for byte.
    expect(rewritten).toContain('Check out ');
    expect(rewritten).toContain(' and also ');
    expect(rewritten).toContain(', thanks!');
  });

  it('does not re-shorten a link already on the own domain', async () => {
    const ownLink = `${env.BASE_LINK_DOMAIN}/abc1234`;
    const text = `See ${ownLink} and https://example.com/new`;

    const response = await request(app).post('/api/links/bulk-text').send({ text });

    expect(response.status).toBe(200);
    const { text: rewritten, created } = response.body.data;

    expect(created).toHaveLength(1);
    expect(created[0].original).toBe('https://example.com/new');
    expect(rewritten).toContain(ownLink);
    expect(rewritten).not.toContain('https://example.com/new');
  });

  it('creates a separate short link for each occurrence of a repeated URL', async () => {
    const text = 'first https://example.com/repeat then again https://example.com/repeat done';

    const response = await request(app).post('/api/links/bulk-text').send({ text });

    expect(response.status).toBe(200);
    const { text: rewritten, created } = response.body.data;

    expect(created).toHaveLength(2);
    expect(created[0].original).toBe('https://example.com/repeat');
    expect(created[1].original).toBe('https://example.com/repeat');
    expect(created[0].short).not.toBe(created[1].short);

    // Both occurrences were replaced — neither leaves the original URL behind,
    // and both short links appear in the rewritten text.
    expect(rewritten).not.toContain('https://example.com/repeat');
    expect(rewritten).toContain(created[0].short);
    expect(rewritten).toContain(created[1].short);
  });

  it('returns the text unchanged and an empty created list when there are no URLs', async () => {
    const text = 'Just a plain sentence with no links in it at all.';

    const response = await request(app).post('/api/links/bulk-text').send({ text });

    expect(response.status).toBe(200);
    expect(response.body.data.text).toBe(text);
    expect(response.body.data.created).toEqual([]);
  });
});

describe('POST /api/links/bulk-text — limits', () => {
  it('rejects text over the character limit and creates nothing', async () => {
    const before = await prisma.link.count();
    const text = 'a'.repeat(BULK_TEXT_MAX_CHARS + 1);

    const response = await request(app).post('/api/links/bulk-text').send({ text });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_TEXT');
    expect(await prisma.link.count()).toBe(before);
  });

  it('rejects text with more links than the limit and creates nothing', async () => {
    const before = await prisma.link.count();
    const text = Array.from(
      { length: BULK_TEXT_MAX_LINKS + 1 },
      (_, i) => `https://example.com/${i}`,
    ).join(' ');

    const response = await request(app).post('/api/links/bulk-text').send({ text });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('TOO_MANY_LINKS');
    expect(await prisma.link.count()).toBe(before);
  });

  it('accepts exactly the link limit', async () => {
    const text = Array.from(
      { length: BULK_TEXT_MAX_LINKS },
      (_, i) => `https://example.com/${i}`,
    ).join(' ');

    const response = await request(app).post('/api/links/bulk-text').send({ text });

    expect(response.status).toBe(200);
    expect(response.body.data.created).toHaveLength(BULK_TEXT_MAX_LINKS);
  });
});
