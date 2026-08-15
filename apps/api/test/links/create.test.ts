import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('POST /api/links — custom slug', () => {
  it('creates a link with a valid custom slug', async () => {
    const response = await request(app)
      .post('/api/links')
      .send({ targetUrl: 'https://example.com/a', customSlug: 'my-cool-link' });

    expect(response.status).toBe(201);
    expect(response.body.data.uid).toBe('my-cool-link');
  });

  it('rejects a forbidden slug', async () => {
    const response = await request(app)
      .post('/api/links')
      .send({ targetUrl: 'https://example.com/b', customSlug: 'admin' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_CUSTOM_SLUG');
  });

  it('rejects a forbidden slug regardless of case', async () => {
    const response = await request(app)
      .post('/api/links')
      .send({ targetUrl: 'https://example.com/b', customSlug: 'Admin' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_CUSTOM_SLUG');
  });

  it('rejects a slug shorter than 3 characters', async () => {
    const response = await request(app)
      .post('/api/links')
      .send({ targetUrl: 'https://example.com/c', customSlug: 'ab' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_CUSTOM_SLUG');
  });

  it('rejects a slug with disallowed characters', async () => {
    const response = await request(app)
      .post('/api/links')
      .send({ targetUrl: 'https://example.com/d', customSlug: 'not valid!' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_CUSTOM_SLUG');
  });

  it('rejects a slug that is already taken', async () => {
    await request(app)
      .post('/api/links')
      .send({ targetUrl: 'https://example.com/e', customSlug: 'taken-slug' });

    const response = await request(app)
      .post('/api/links')
      .send({ targetUrl: 'https://example.com/f', customSlug: 'taken-slug' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('SLUG_TAKEN');
  });
});
