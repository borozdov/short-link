import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { StatsPage } from '../../../src/routes/StatsPage';
import { getLinkStats } from '../../../src/api/client';

vi.mock('../../../src/api/client', () => ({
  ApiError: class ApiError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
  getLinkStats: vi.fn().mockResolvedValue({
    uid: 'abc1234',
    shortUrl: 'http://localhost:4000/abc1234',
    status: 'ACTIVE',
    targetUrl: 'https://example.com',
    note: null,
    createdAt: '2026-08-01T00:00:00.000Z',
    expiresAt: null,
    clickCount: 3,
    clicks: [{ occurredAt: '2026-08-02T00:00:00.000Z', referrer: 'https://twitter.com' }],
  }),
}));

describe('StatsPage', () => {
  it('renders click count and timeline for a valid secretToken', async () => {
    render(
      <MemoryRouter initialEntries={['/s/secret-token-value']}>
        <Routes>
          <Route path="/s/:secretToken" element={<StatsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('3')).toBeInTheDocument();
    expect(screen.getByText('Активна')).toBeInTheDocument();
    expect(screen.getByText('https://twitter.com')).toBeInTheDocument();
    expect(screen.queryByText('Примечание')).not.toBeInTheDocument();
  });

  it('shows the note when present', async () => {
    vi.mocked(getLinkStats).mockResolvedValueOnce({
      uid: 'abc1234',
      shortUrl: 'http://localhost:4000/abc1234',
      status: 'ACTIVE',
      targetUrl: 'https://example.com',
      note: 'Для партнёров',
      createdAt: '2026-08-01T00:00:00.000Z',
      expiresAt: null,
      clickCount: 3,
      clicks: [],
    });

    render(
      <MemoryRouter initialEntries={['/s/secret-token-value']}>
        <Routes>
          <Route path="/s/:secretToken" element={<StatsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Для партнёров')).toBeInTheDocument();
  });
});
