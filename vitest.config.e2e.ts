import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    /** Two copies of graphql (CJS and ESM) break `instanceof` on custom scalars. */
    alias: [{ find: /^graphql$/, replacement: 'graphql/index.js' }],
  },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: ['./test/setup/postgres.ts'],
    /** A real PostgreSQL starts in global setup and must stop in teardown. */
    hookTimeout: 180_000,
    testTimeout: 30_000,
    teardownTimeout: 60_000,
    /** The spec files share one database and must not run at the same time. */
    fileParallelism: false,
  },
});
