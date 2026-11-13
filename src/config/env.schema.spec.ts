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
      TRUST_PROXY: 0,
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
    ['0', 0],
    ['1', 1],
    ['3', 3],
    ['false', 0],
    ['', 0],
  ])('parses TRUST_PROXY=%j as %i hops', (value, expected) => {
    expect(
      envSchema.parse({ DATABASE_URL, NODE_ENV, TRUST_PROXY: value })
        .TRUST_PROXY,
    ).toBe(expected);
  });

  it.each(['true', 'loopback', '4', '-1', '1,2', 'banana'])(
    'rejects TRUST_PROXY=%s',
    (value) => {
      const result = envSchema.safeParse({
        DATABASE_URL,
        NODE_ENV,
        TRUST_PROXY: value,
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path).toEqual(['TRUST_PROXY']);
      expect(result.error?.issues[0]?.message).toContain('X-Forwarded-For');
    },
  );

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
