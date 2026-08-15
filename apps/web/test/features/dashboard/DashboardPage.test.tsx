import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ToastProvider } from '../../../src/primitives/ToastProvider';
import { AuthProvider } from '../../../src/features/auth/AuthProvider';
import { RequireAuth } from '../../../src/routes/RequireAuth';
import { DashboardPage } from '../../../src/features/dashboard/DashboardPage';

const { CURRENT_USER, OWNED_LINK } = vi.hoisted(() => ({
  CURRENT_USER: {
    id: 'user-1',
    email: 'user@example.com',
    role: 'USER',
    emailVerifiedAt: null,
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  OWNED_LINK: {
    id: 'link-1',
    uid: 'mylink1',
    targetUrl: 'https://example.com/a',
    ownerId: 'user-1',
    isCustomSlug: false,
    status: 'ACTIVE',
    expiresAt: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    clickCount: 5,
    createdAt: '2026-08-02T00:00:00.000Z',
  },
}));

vi.mock('../../../src/api/client', () => {
  class ApiError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  }

  return {
    ApiError,
    getCurrentUser: vi.fn().mockResolvedValue(CURRENT_USER),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    getUserLinks: vi.fn().mockResolvedValue([OWNED_LINK]),
    claimLink: vi.fn((payload: { secretToken: string }) => {
      if (payload.secretToken !== 'valid-token') {
        return Promise.reject(new ApiError('NOT_FOUND', 'Not found'));
      }
      return Promise.resolve({ ...OWNED_LINK, id: 'link-2', uid: 'claimed1' });
    }),
    unclaimLink: vi.fn().mockResolvedValue({ ...OWNED_LINK, ownerId: null }),
  };
});

function renderDashboard() {
  render(
    <ToastProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <DashboardPage />
                </RequireAuth>
              }
            />
            <Route path="/login" element={<div>Login page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </ToastProvider>,
  );
}

describe('DashboardPage', () => {
  it("shows the authenticated user's own links", async () => {
    renderDashboard();

    expect(await screen.findByText('/mylink1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('claims a link by secret token and shows a success toast', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByText('/mylink1');
    await user.click(screen.getByRole('tab', { name: /claim link/i }));
    await user.type(screen.getByLabelText(/secret token/i), 'valid-token');
    await user.click(screen.getByRole('button', { name: /claim link/i }));

    expect(await screen.findByText('Link claimed')).toBeInTheDocument();
  });

  it('shows an error toast for an unknown secret token', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByText('/mylink1');
    await user.click(screen.getByRole('tab', { name: /claim link/i }));
    await user.type(screen.getByLabelText(/secret token/i), 'bad-token');
    await user.click(screen.getByRole('button', { name: /claim link/i }));

    expect(await screen.findByText('Not found')).toBeInTheDocument();
  });
});
