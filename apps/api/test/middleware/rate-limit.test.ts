import { describe, expect, it } from 'vitest';
import { createRateLimiter } from '../../src/middleware/rate-limit.js';

describe('createRateLimiter', () => {
  it('allows up to max checks per key within the window, then rejects', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 2 });

    expect(limiter.check('key-a')).toBe(true);
    expect(limiter.check('key-a')).toBe(true);
    expect(limiter.check('key-a')).toBe(false);
  });

  it('tracks separate keys independently', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });

    expect(limiter.check('key-a')).toBe(true);
    expect(limiter.check('key-b')).toBe(true);
    expect(limiter.check('key-a')).toBe(false);
    expect(limiter.check('key-b')).toBe(false);
  });

  it('resets the count once the window has elapsed', async () => {
    const limiter = createRateLimiter({ windowMs: 10, max: 1 });

    expect(limiter.check('key-a')).toBe(true);
    expect(limiter.check('key-a')).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(limiter.check('key-a')).toBe(true);
  });
});
