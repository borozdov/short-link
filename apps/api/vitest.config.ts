import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    env: {
      DATABASE_URL: 'postgresql://shortlink:shortlink@localhost:5432/shortlink_test?schema=public',
    },
    setupFiles: ['./test/setup.ts'],
  },
});
