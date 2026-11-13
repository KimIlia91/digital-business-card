import { envSchema } from './env.schema.js';

const DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
const NODE_ENV = 'production';

describe('envSchema', () => {
  it('applies safe defaults for everything but the database URL and NODE_ENV', () => {
    const env = envSchema.parse({ DATABASE_URL, NODE_ENV });

    expect(env).toMatchObject({
      NODE_ENV: 'production',
      PORT: 3000,
      LOG_LEVEL: 'log',
      TRUST_PROXY: false,
      CORS_ORIGINS: '*',
      RATE_LIMIT_MAX: 120,
      DATABASE_POOL_MAX: 10,
    });
  });

  it('fails fast when NODE_ENV is missing or unknown instead of assuming development', () => {
    const missing = envSchema.safeParse({ DATABASE_URL });
    expect(missing.success).toBe(false);
    expect(missing.error?.issues[0]?.path).toEqual(['NODE_ENV']);

    expect(
      envSchema.safeParse({ DATABASE_URL, NODE_ENV: 'staging' }).success,
    ).toBe(false);
  });

  it('requires a PostgreSQL connection URL', () => {
    expect(envSchema.safeParse({ NODE_ENV }).success).toBe(false);
    expect(
      envSchema.safeParse({ NODE_ENV, DATABASE_URL: 'mysql://localhost/db' })
        .success,
    ).toBe(false);
  });

  it('coerces numbers from strings', () => {
    expect(envSchema.parse({ DATABASE_URL, NODE_ENV, PORT: '8080' }).PORT).toBe(
      8080,
    );
    expect(
      envSchema.safeParse({ DATABASE_URL, NODE_ENV, PORT: 'abc' }).success,
    ).toBe(false);
  });

  it.each([
    ['false', false],
    ['true', true],
    ['1', 1],
    ['loopback', 'loopback'],
  ])('parses TRUST_PROXY=%s', (value, expected) => {
    expect(
      envSchema.parse({ DATABASE_URL, NODE_ENV, TRUST_PROXY: value })
        .TRUST_PROXY,
    ).toBe(expected);
  });

  it('parses a list of CORS origins', () => {
    expect(
      envSchema.parse({
        DATABASE_URL,
        NODE_ENV,
        CORS_ORIGINS: 'https://a.example, https://b.example',
      }).CORS_ORIGINS,
    ).toEqual(['https://a.example', 'https://b.example']);
  });
});
