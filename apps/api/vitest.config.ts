import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    env: {
      DATABASE_URL: 'postgresql://shortlink:shortlink@localhost:5432/shortlink_test?schema=public',
    },
    setupFiles: ['./test/setup.ts'],
    // Test files share one Postgres database with a per-test truncate in setup.ts;
    // running files in parallel races that truncate against other files' fixtures.
    fileParallelism: false,
  },
});
