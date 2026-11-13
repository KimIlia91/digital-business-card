import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import type { ThrottlerStorage } from '@nestjs/throttler';
import { createRateLimitMiddleware } from './rate-limit.js';

type ThrottlerStorageRecord = Awaited<
  ReturnType<ThrottlerStorage['increment']>
>;

const OPTIONS = { ttlMs: 60_000, limit: 2 };

const record = (
  overrides: Partial<ThrottlerStorageRecord> = {},
): ThrottlerStorageRecord => ({
  totalHits: 1,
  timeToExpire: 60,
  isBlocked: false,
  timeToBlockExpire: 0,
  ...overrides,
});

function createResponse() {
  const headers = new Map<string, string>();
  const res = {
    headers,
    statusCode: 200,
    body: undefined as unknown,
    setHeader: vi.fn((name: string, value: string | number) => {
      headers.set(name.toLowerCase(), String(value));
      return res;
    }),
    status: vi.fn((code: number) => {
      res.statusCode = code;
      return res;
    }),
    json: vi.fn((body: unknown) => {
      res.body = body;
      return res;
    }),
  };
  return res;
}

const blockedStorage = () => ({
  increment: vi
    .fn()
    .mockResolvedValue(record({ totalHits: 3, isBlocked: true })),
});

const client = (ip: string) => ({ ip, id: 'req-1' }) as Partial<Request>;

const run = async (
  storage: ThrottlerStorage,
  req: Partial<Request> = { ip: '203.0.113.7' },
  middleware = createRateLimitMiddleware(storage, OPTIONS),
) => {
  const res = createResponse();
  const next: NextFunction = vi.fn();
  await middleware(req as Request, res as unknown as Response, next);
  return { res, next };
};

describe('createRateLimitMiddleware', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('counts the request per client IP and lets it through under the limit', async () => {
    const increment = vi.fn().mockResolvedValue(record());
    const { res, next } = await run({ increment });

    expect(increment).toHaveBeenCalledWith(
      'graphql:203.0.113.7',
      60_000,
      2,
      0,
      'graphql',
    );
    expect(next).toHaveBeenCalledWith();
    expect(res.statusCode).toBe(200);
    expect(res.headers.get('x-ratelimit-limit')).toBe('2');
    expect(res.headers.get('x-ratelimit-remaining')).toBe('1');
    expect(res.headers.get('x-ratelimit-reset')).toBe('60');
  });

  it('answers 429 with Retry-After and a GraphQL-shaped body when blocked', async () => {
    const increment = vi
      .fn()
      .mockResolvedValue(
        record({ totalHits: 3, isBlocked: true, timeToBlockExpire: 17 }),
      );
    const { res, next } = await run({ increment });

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(429);
    expect(res.headers.get('retry-after')).toBe('17');
    expect(res.headers.get('x-ratelimit-remaining')).toBe('0');
    expect(res.body).toEqual({
      errors: [
        {
          message: 'Too many requests, please retry later',
          extensions: { code: 'TOO_MANY_REQUESTS' },
        },
      ],
    });
  });

  it('never sends a Retry-After below one second', async () => {
    const increment = vi
      .fn()
      .mockResolvedValue(record({ isBlocked: true, timeToBlockExpire: 0 }));
    const { res } = await run({ increment });

    expect(res.headers.get('retry-after')).toBe('1');
  });

  it('keys requests without an IP under a shared bucket', async () => {
    const increment = vi.fn().mockResolvedValue(record());
    await run({ increment }, {});

    expect(increment).toHaveBeenCalledWith(
      'graphql:unknown',
      60_000,
      2,
      0,
      'graphql',
    );
  });

  it('passes a storage failure to the error handler', async () => {
    const failure = new Error('storage down');
    const { next } = await run({
      increment: vi.fn().mockRejectedValue(failure),
    });

    expect(next).toHaveBeenCalledWith(failure);
  });

  it('keys an IPv6 client by its /64 prefix', async () => {
    const increment = vi.fn().mockResolvedValue(record());
    await run({ increment }, { ip: '2001:db8:1:2::1' });

    expect(increment).toHaveBeenCalledWith(
      'graphql:2001:db8:1:2::/64',
      60_000,
      2,
      0,
      'graphql',
    );
  });

  describe('blocked client logging', () => {
    it('logs one warning with the request id and the bucket key', async () => {
      await run(blockedStorage(), client('203.0.113.7'));

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith('Rate limit exceeded', {
        requestId: 'req-1',
        client: 'graphql:203.0.113.7',
        limit: 2,
      });
    });

    it('does not log the same client again within the window', async () => {
      const middleware = createRateLimitMiddleware(blockedStorage(), OPTIONS);

      await run(blockedStorage(), client('203.0.113.7'), middleware);
      await run(blockedStorage(), client('203.0.113.7'), middleware);
      await run(blockedStorage(), client('203.0.113.7'), middleware);

      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('logs the client again in the next window', async () => {
      vi.useFakeTimers();
      const middleware = createRateLimitMiddleware(blockedStorage(), OPTIONS);

      await run(blockedStorage(), client('203.0.113.7'), middleware);
      vi.advanceTimersByTime(OPTIONS.ttlMs + 1);
      await run(blockedStorage(), client('203.0.113.7'), middleware);

      expect(warn).toHaveBeenCalledTimes(2);
    });

    it('logs a different client separately', async () => {
      const middleware = createRateLimitMiddleware(blockedStorage(), OPTIONS);

      await run(blockedStorage(), client('203.0.113.7'), middleware);
      await run(blockedStorage(), client('203.0.113.8'), middleware);

      expect(warn).toHaveBeenCalledTimes(2);
    });

    it('does not log a request that is let through', async () => {
      await run({ increment: vi.fn().mockResolvedValue(record()) });

      expect(warn).not.toHaveBeenCalled();
    });
  });
});
