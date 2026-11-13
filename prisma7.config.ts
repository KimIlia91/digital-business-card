import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 no longer reads `.env` itself; load it locally (containers use real
 * environment variables). The datasource URL is not wrapped in `env()` so that
 * `prisma generate` works without a database, e.g. in the Docker build stage.
 * Production runs the compiled seed from scripts/entrypoint.sh, not `tsx`.
 */
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx src/database/seed/main.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
