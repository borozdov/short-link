import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { extractCookie } from './cookies.js';
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from '../../src/domains/auth/tokens.js';

describe('POST /api/auth/refresh', () => {
  it('rejects a request with no refresh cookie', async () => {
    const response = await request(app).post('/api/auth/refresh');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects an invalid refresh cookie', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`${REFRESH_COOKIE_NAME}=not-a-real-token`]);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('issues fresh cookies and the new access token works against /me', async () => {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({ email: 'refresh-user@example.com', password: 'longenough' });

    const refreshCookie = extractCookie(registerResponse, REFRESH_COOKIE_NAME);

    const refreshResponse = await request(app).post('/api/auth/refresh').set('Cookie', [refreshCookie]);

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.data.email).toBe('refresh-user@example.com');

    const newAccessCookie = extractCookie(refreshResponse, ACCESS_COOKIE_NAME);
    const meResponse = await request(app).get('/api/auth/me').set('Cookie', [newAccessCookie]);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.data.email).toBe('refresh-user@example.com');
  });
});
