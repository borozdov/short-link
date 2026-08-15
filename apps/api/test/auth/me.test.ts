import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { extractCookie } from './cookies.js';
import { ACCESS_COOKIE_NAME } from '../../src/domains/auth/tokens.js';

describe('GET /api/auth/me', () => {
  it('rejects a request with no cookie', async () => {
    const response = await request(app).get('/api/auth/me');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects a request with a garbage cookie', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [`${ACCESS_COOKIE_NAME}=not-a-real-token`]);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns the current user for a valid access token', async () => {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({ email: 'me-user@example.com', password: 'longenough' });

    const accessCookie = extractCookie(registerResponse, ACCESS_COOKIE_NAME);

    const response = await request(app).get('/api/auth/me').set('Cookie', [accessCookie]);

    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe('me-user@example.com');
  });
});
