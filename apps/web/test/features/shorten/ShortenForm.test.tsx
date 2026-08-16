import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../../src/primitives/ToastProvider';
import { ShortenPage } from '../../../src/routes/ShortenPage';
import { createLink } from '../../../src/api/client';

vi.mock('../../../src/api/client', () => ({
  ApiError: class ApiError extends Error {},
  createLink: vi.fn().mockResolvedValue({
    shortUrl: 'http://localhost:4000/abc1234',
    uid: 'abc1234',
    secretToken: 'secret-token-value',
    qrUrl: '/api/links/abc1234/qr',
  }),
}));

describe('ShortenPage', () => {
  it('creates a link and shows the result', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ShortenPage />
      </ToastProvider>,
    );

    await user.type(screen.getByLabelText(/target url/i), 'https://example.com');
    await user.click(screen.getByRole('button', { name: /shorten/i }));

    expect(await screen.findByDisplayValue('http://localhost:4000/abc1234')).toBeInTheDocument();
  });

  it('includes UTM tags in the payload when filled in', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ShortenPage />
      </ToastProvider>,
    );

    await user.type(screen.getByLabelText(/target url/i), 'https://example.com');
    await user.type(screen.getByLabelText(/source/i), 'newsletter');
    await user.type(screen.getByLabelText(/medium/i), 'email');
    await user.type(screen.getByLabelText(/campaign/i), 'launch');
    await user.click(screen.getByRole('button', { name: /shorten/i }));

    await screen.findByDisplayValue('http://localhost:4000/abc1234');

    expect(createLink).toHaveBeenCalledWith(
      expect.objectContaining({
        utm: { source: 'newsletter', medium: 'email', campaign: 'launch' },
      }),
    );
  });
});
