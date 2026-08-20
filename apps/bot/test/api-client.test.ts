import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(() => {
  process.env.TELEGRAM_BOT_TOKEN = 'test-token';
  process.env.BOT_API_BASE_URL = 'http://test-api.local';
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
  });
}

describe('api-client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('createLink returns data on a successful ApiResponse', async () => {
    const responseBody = {
      data: {
        shortUrl: 'http://test-api.local/abc1234',
        uid: 'abc1234',
        secretToken: 'secret-token-value',
        qrUrl: '/api/links/abc1234/qr',
      },
    };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(responseBody));
    vi.stubGlobal('fetch', fetchMock);

    const { createLink } = await import('../src/api-client.js');
    const result = await createLink({ targetUrl: 'https://example.com' });

    expect(result).toEqual(responseBody.data);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://test-api.local/api/links',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws ApiError with the server error code when the ApiResponse has an error', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ error: { code: 'NOT_FOUND', message: 'Не найдено' } }));
    vi.stubGlobal('fetch', fetchMock);

    const { getLinkStats, ApiError } = await import('../src/api-client.js');

    await expect(getLinkStats('unknown-token')).rejects.toMatchObject(
      new ApiError('NOT_FOUND', 'Не найдено'),
    );
  });

  it('updateLinkStatus sends a PATCH with the requested status', async () => {
    const responseBody = { data: { uid: 'abc1234', status: 'DISABLED' } };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(responseBody));
    vi.stubGlobal('fetch', fetchMock);

    const { updateLinkStatus } = await import('../src/api-client.js');
    const result = await updateLinkStatus('secret-token-value', 'DISABLED');

    expect(result).toEqual(responseBody.data);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://test-api.local/api/links/stats/secret-token-value',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'DISABLED' }),
      }),
    );
  });
});
