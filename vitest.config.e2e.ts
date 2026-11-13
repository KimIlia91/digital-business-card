import { defineConfig } from 'vitest/config';

/**
 * The `graphql` alias pins the CJS entry Node uses; two copies of graphql (CJS
 * and ESM) break `instanceof` checks on custom scalars. e2e tests start a real
 * PostgreSQL via Testcontainers, hence the long timeouts.
 */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: [{ find: /^graphql$/, replacement: 'graphql/index.js' }],
  },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    hookTimeout: 180_000,
    testTimeout: 30_000,
    fileParallelism: false,
  },
});
