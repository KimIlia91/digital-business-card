import { z } from 'zod';

const positiveInt = z.coerce.number().int().positive();

export const databaseEnvSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  DATABASE_POOL_MAX: positiveInt.default(10),
  DATABASE_CONNECTION_TIMEOUT_MS: positiveInt.default(5_000),
  DATABASE_STATEMENT_TIMEOUT_MS: positiveInt.default(10_000),
});

export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;

export const MAX_TRUST_PROXY_HOPS = 3;

const TRUST_PROXY_MESSAGE = `TRUST_PROXY must be the number of proxy hops in front of the app: 0 (no proxy) to ${MAX_TRUST_PROXY_HOPS}, 1 on Render. "true" and proxy lists are rejected: a client could then spoof X-Forwarded-For and bypass the rate limit.`;

/**
 * Express `trust proxy` as a hop count. Booleans, named ranges and IP lists are
 * rejected, and `''`/`'false'` stay aliases of 0 for existing `.env` files.
 */
const trustProxy = z
  .string()
  .trim()
  .default('0')
  .transform((value) => (value === '' || value === 'false' ? '0' : value))
  .pipe(
    z
      .string()
      .regex(/^\d+$/, TRUST_PROXY_MESSAGE)
      .transform(Number)
      .pipe(z.number().max(MAX_TRUST_PROXY_HOPS, TRUST_PROXY_MESSAGE)),
  );

const corsOrigins = z
  .string()
  .trim()
  .default('*')
  .transform((value): '*' | string[] =>
    value === '*'
      ? '*'
      : value
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean),
  );

export const envSchema = databaseEnvSchema.extend({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'log', 'debug', 'verbose'])
    .default('log'),
  TRUST_PROXY: trustProxy,
  CORS_ORIGINS: corsOrigins,
  RATE_LIMIT_TTL_MS: positiveInt.default(60_000),
  RATE_LIMIT_MAX: positiveInt.default(120),
  GRAPHQL_MAX_COMPLEXITY: positiveInt.default(250),
});

export type Env = z.infer<typeof envSchema>;
