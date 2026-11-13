import { PrismaPg } from '@prisma/adapter-pg';
import type { DatabaseEnv } from '../config/env.schema.js';

/** Explicit timeouts: pg's defaults wait forever for a connection and never cancel statements. */
export function createPgAdapter(
  env: DatabaseEnv,
  applicationName: string,
): PrismaPg {
  return new PrismaPg({
    connectionString: env.DATABASE_URL,
    max: env.DATABASE_POOL_MAX,
    connectionTimeoutMillis: env.DATABASE_CONNECTION_TIMEOUT_MS,
    idleTimeoutMillis: 30_000,
    statement_timeout: env.DATABASE_STATEMENT_TIMEOUT_MS,
    application_name: applicationName,
  });
}
