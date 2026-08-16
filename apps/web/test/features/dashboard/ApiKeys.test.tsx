import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ToastProvider } from '../../../src/primitives/ToastProvider';
import { AuthProvider } from '../../../src/features/auth/AuthProvider';
import { RequireAuth } from '../../../src/routes/RequireAuth';
import { DashboardPage } from '../../../src/features/dashboard/DashboardPage';

const { CURRENT_USER, ACTIVE_KEY } = vi.hoisted(() => ({
  CURRENT_USER: {
    id: 'user-1',
    email: 'user@example.com',
    role: 'USER',
    emailVerifiedAt: null,
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  ACTIVE_KEY: {
    id: 'key-1',
    ownerId: 'user-1',
    createdAt: '2026-08-02T00:00:00.000Z',
    revokedAt: null,
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
    getUserLinks: vi.fn().mockResolvedValue([]),
    claimLink: vi.fn(),
    unclaimLink: vi.fn(),
    getApiKeys: vi.fn().mockResolvedValue([ACTIVE_KEY]),
    generateApiKey: vi.fn().mockResolvedValue({
      id: 'key-2',
      rawKey: 'raw-key-value',
      createdAt: '2026-08-03T00:00:00.000Z',
    }),
    revokeApiKey: vi.fn().mockResolvedValue({ ...ACTIVE_KEY, revokedAt: '2026-08-04T00:00:00.000Z' }),
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

describe('DashboardPage — API keys', () => {
  it('lists existing keys and generates a new one, shown once', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(await screen.findByRole('tab', { name: /api keys/i }));

    expect(await screen.findByText('Active')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /generate new key/i }));

    expect(await screen.findByDisplayValue('raw-key-value')).toBeInTheDocument();
  });

  it('revokes a key after confirming', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(await screen.findByRole('tab', { name: /api keys/i }));
    await user.click(await screen.findByRole('button', { name: /revoke/i }));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /revoke/i }));

    expect(await screen.findByText('API key revoked')).toBeInTheDocument();
  });
});
