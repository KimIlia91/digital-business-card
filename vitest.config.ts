import { defineConfig } from 'vitest/config';

/** The `graphql` alias pins the CJS entry, like Node does (see vitest.config.e2e.ts). */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: [{ find: /^graphql$/, replacement: 'graphql/index.js' }],
  },
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
  },
});
