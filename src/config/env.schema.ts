import { z } from 'zod';

const positiveInt = z.coerce.number().int().positive();

export const databaseEnvSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  DATABASE_POOL_MAX: positiveInt.default(10),
  DATABASE_CONNECTION_TIMEOUT_MS: positiveInt.default(5_000),
  DATABASE_STATEMENT_TIMEOUT_MS: positiveInt.default(10_000),
});

export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;

/** Express `trust proxy`: required for correct client IPs, and so rate limiting, behind a reverse proxy. */
const trustProxy = z
  .string()
  .trim()
  .default('false')
  .transform((value): boolean | number | string => {
    if (value === 'true') return true;
    if (value === 'false' || value === '') return false;
    if (/^\d+$/.test(value)) return Number(value);
    return value;
  });

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
