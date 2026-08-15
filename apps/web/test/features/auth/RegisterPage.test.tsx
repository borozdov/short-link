import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ToastProvider } from '../../../src/primitives/ToastProvider';
import { AuthProvider } from '../../../src/features/auth/AuthProvider';
import { RegisterPage } from '../../../src/routes/RegisterPage';

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
    register: vi.fn((payload: { email: string; password: string }) => {
      if (payload.email === 'taken@example.com') {
        return Promise.reject(new ApiError('EMAIL_TAKEN', 'This email is already registered'));
      }
      return Promise.resolve({
        id: 'user-1',
        email: payload.email,
        role: 'USER',
        emailVerifiedAt: null,
        createdAt: '2026-08-01T00:00:00.000Z',
      });
    }),
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
  };
});

function renderRegisterPage() {
  render(
    <ToastProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<div>Home</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </ToastProvider>,
  );
}

describe('RegisterPage', () => {
  it('registers and redirects to the home page', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText(/email/i), 'new@example.com');
    await user.type(screen.getByLabelText(/password/i), 'longenough');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Home')).toBeInTheDocument();
  });

  it('shows an error toast when the email is already taken', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText(/email/i), 'taken@example.com');
    await user.type(screen.getByLabelText(/password/i), 'longenough');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('This email is already registered')).toBeInTheDocument();
  });
});
