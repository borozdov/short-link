import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../../src/primitives/ToastProvider';
import { BulkTextPage } from '../../../src/routes/BulkTextPage';

vi.mock('../../../src/api/client', () => ({
  ApiError: class ApiError extends Error {},
  shortenBulkText: vi.fn().mockResolvedValue({
    text: 'Check http://localhost:4000/abc1234 out',
    created: [{ original: 'https://example.com/a', short: 'http://localhost:4000/abc1234' }],
  }),
}));

describe('BulkTextPage', () => {
  it('shortens links found in pasted text and shows the result', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <BulkTextPage />
      </ToastProvider>,
    );

    await user.type(screen.getByLabelText(/text/i), 'Check https://example.com/a out');
    await user.click(screen.getByRole('button', { name: /shorten links/i }));

    expect(await screen.findByDisplayValue(/http:\/\/localhost:4000\/abc1234/)).toBeInTheDocument();
    expect(screen.getByText('https://example.com/a')).toBeInTheDocument();
  });

  it('shows an inline error instead of submitting when the text is empty', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <BulkTextPage />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: /shorten links/i }));

    expect(await screen.findByText(/text is required/i)).toBeInTheDocument();
    expect(screen.queryByDisplayValue(/http:\/\/localhost:4000\/abc1234/)).not.toBeInTheDocument();
  });
});
