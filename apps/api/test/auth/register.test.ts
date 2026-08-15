import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { RegisterRequestSchema } from '@short-link/shared';
import { app } from '../../src/app.js';
import { prisma } from '../../src/db/client.js';
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from '../../src/domains/auth/tokens.js';

describe('RegisterRequestSchema — contract', () => {
  it('accepts a valid payload', () => {
    const result = RegisterRequestSchema.safeParse({ email: 'a@example.com', password: 'longenough' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = RegisterRequestSchema.safeParse({ email: 'not-an-email', password: 'longenough' });
    expect(result.success).toBe(false);
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = RegisterRequestSchema.safeParse({ email: 'a@example.com', password: 'short' });
    expect(result.success).toBe(false);
  });
});

describe('POST /api/auth/register', () => {
  it('creates a user and sets both auth cookies', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new-user@example.com', password: 'longenough' });

    expect(response.status).toBe(201);
    expect(response.body.data.email).toBe('new-user@example.com');
    expect(response.body.data.role).toBe('USER');
    expect(response.body.data.passwordHash).toBeUndefined();

    const setCookie = response.headers['set-cookie'] as unknown as string[];
    expect(setCookie.some((cookie) => cookie.startsWith(`${ACCESS_COOKIE_NAME}=`))).toBe(true);
    expect(setCookie.some((cookie) => cookie.startsWith(`${REFRESH_COOKIE_NAME}=`))).toBe(true);
  });

  it('rejects a duplicate email and creates no extra row', async () => {
    await request(app).post('/api/auth/register').send({ email: 'dup@example.com', password: 'longenough' });
    const before = await prisma.user.count();

    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', password: 'different-pass' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EMAIL_TAKEN');
    expect(await prisma.user.count()).toBe(before);
  });

  it('rejects an invalid email with 400', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'longenough' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_EMAIL');
  });
});
