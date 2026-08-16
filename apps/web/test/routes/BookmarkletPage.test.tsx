import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ToastProvider } from '../../src/primitives/ToastProvider';
import { BookmarkletPage } from '../../src/routes/BookmarkletPage';

vi.mock('../../src/api/client', () => ({
  ApiError: class ApiError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
  createLink: vi.fn().mockResolvedValue({
    shortUrl: 'http://localhost:4000/abc1234',
    uid: 'abc1234',
    secretToken: 'secret-token-value',
    qrUrl: '/api/links/abc1234/qr',
  }),
}));

function renderBookmarklet(path: string) {
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/bookmarklet" element={<BookmarkletPage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );
}

describe('BookmarkletPage', () => {
  it('shows install instructions and the bookmarklet code with no url param', () => {
    renderBookmarklet('/bookmarklet');

    expect(screen.getByText(/перетащите эту ссылку на панель закладок/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /сократить эту страницу/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue(/javascript:/)).toBeInTheDocument();
  });

  it('creates and shows a short link when a url param is present', async () => {
    renderBookmarklet('/bookmarklet?url=https%3A%2F%2Fexample.com%2Fpage');

    expect(await screen.findByDisplayValue('http://localhost:4000/abc1234')).toBeInTheDocument();
  });
});
