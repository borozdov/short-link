import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { LoginRequestSchema } from '@short-link/shared';
import { app } from '../../src/app.js';

describe('LoginRequestSchema — contract', () => {
  it('accepts a valid payload', () => {
    const result = LoginRequestSchema.safeParse({ email: 'a@example.com', password: 'anything' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = LoginRequestSchema.safeParse({ email: 'not-an-email', password: 'anything' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty password', () => {
    const result = LoginRequestSchema.safeParse({ email: 'a@example.com', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials and sets both cookies', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'login-ok@example.com', password: 'correct-password' });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login-ok@example.com', password: 'correct-password' });

    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe('login-ok@example.com');
    expect((response.headers['set-cookie'] as unknown as string[]).length).toBeGreaterThanOrEqual(2);
  });

  it('rejects a wrong password with INVALID_CREDENTIALS', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'login-wrong-pw@example.com', password: 'correct-password' });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login-wrong-pw@example.com', password: 'wrong-password' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects an unknown email with the same INVALID_CREDENTIALS code', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'does-not-exist@example.com', password: 'whatever12' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});
