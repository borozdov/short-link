import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ToastProvider } from '../../../src/primitives/ToastProvider';
import { AuthProvider } from '../../../src/features/auth/AuthProvider';
import { LoginPage } from '../../../src/routes/LoginPage';

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
    getCurrentUser: vi.fn().mockRejectedValue(new Error('unauthenticated')),
    register: vi.fn(),
    login: vi.fn((payload: { email: string; password: string }) => {
      if (payload.password !== 'correct-password') {
        return Promise.reject(new ApiError('INVALID_CREDENTIALS', 'Неверный email или пароль'));
      }
      return Promise.resolve({
        id: 'user-1',
        email: payload.email,
        role: 'USER',
        emailVerifiedAt: null,
        createdAt: '2026-08-01T00:00:00.000Z',
      });
    }),
    logout: vi.fn().mockResolvedValue(undefined),
  };
});

function renderLoginPage() {
  render(
    <ToastProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<div>Home</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </ToastProvider>,
  );
}

describe('LoginPage', () => {
  it('logs in and redirects to the home page', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/пароль/i), 'correct-password');
    await user.click(screen.getByRole('button', { name: /войти/i }));

    expect(await screen.findByText('Home')).toBeInTheDocument();
  });

  it('shows an error toast for a wrong password', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/пароль/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /войти/i }));

    expect(await screen.findByText('Неверный email или пароль')).toBeInTheDocument();
  });
});
