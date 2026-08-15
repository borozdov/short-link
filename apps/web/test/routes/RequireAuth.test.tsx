import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ToastProvider } from '../../src/primitives/ToastProvider';
import { AuthProvider } from '../../src/features/auth/AuthProvider';
import { RequireAuth } from '../../src/routes/RequireAuth';

vi.mock('../../src/api/client', () => ({
  ApiError: class ApiError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
  getCurrentUser: vi.fn().mockRejectedValue(new Error('unauthenticated')),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}));

describe('RequireAuth', () => {
  it('redirects to /login when not authenticated', async () => {
    render(
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <div>Dashboard</div>
                  </RequireAuth>
                }
              />
              <Route path="/login" element={<div>Login page</div>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>,
    );

    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });
});
