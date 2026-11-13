import type { MockInstance } from 'vitest';
import { Logger } from '@nestjs/common';
import type { HealthIndicatorService } from '@nestjs/terminus';
import type { PrismaService } from '../prisma/prisma.service.js';
import { DatabaseHealthIndicator } from './database.health.js';

function createIndicator(queryRaw: ReturnType<typeof vi.fn>) {
  const indicators = {
    check: (key: string) => ({
      up: () => ({ [key]: { status: 'up' } }),
      down: () => ({ [key]: { status: 'down' } }),
    }),
  };
  return new DatabaseHealthIndicator(
    { $queryRaw: queryRaw } as unknown as PrismaService,
    indicators as unknown as HealthIndicatorService,
  );
}

describe('DatabaseHealthIndicator', () => {
  let warn: MockInstance<Logger['warn']>;

  beforeEach(() => {
    vi.useFakeTimers();
    warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('reuses the result for repeated probes within the cache window', async () => {
    const queryRaw = vi.fn().mockResolvedValue([{ '?column?': 1 }]);
    const indicator = createIndicator(queryRaw);

    const results = await Promise.all([
      indicator.isHealthy('database'),
      indicator.isHealthy('database'),
      indicator.isHealthy('database'),
    ]);
    await indicator.isHealthy('database');

    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(results.every((r) => r.database?.status === 'up')).toBe(true);
  });

  it('pings the database again after the cache window', async () => {
    const queryRaw = vi.fn().mockResolvedValue([]);
    const indicator = createIndicator(queryRaw);

    await indicator.isHealthy('database');
    await vi.advanceTimersByTimeAsync(2_001);
    await indicator.isHealthy('database');

    expect(queryRaw).toHaveBeenCalledTimes(2);
  });

  it('reports down without leaking the reason, and caches the failure briefly', async () => {
    const queryRaw = vi
      .fn()
      .mockRejectedValueOnce(new Error('connect ECONNREFUSED 10.0.0.5:5432'))
      .mockResolvedValue([]);
    const indicator = createIndicator(queryRaw);

    const first = await indicator.isHealthy('database');
    const second = await indicator.isHealthy('database');
    expect(first).toEqual({ database: { status: 'down' } });
    expect(second).toEqual(first);
    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
    const [, payload] = warn.mock.calls[0] ?? [];
    expect(payload).toMatchObject({
      error: 'connect ECONNREFUSED 10.0.0.5:5432',
    });
    expect(payload).not.toHaveProperty('stack');

    await vi.advanceTimersByTimeAsync(2_001);
    expect((await indicator.isHealthy('database')).database?.status).toBe('up');
  });

  it('reports down when the query hangs past the ping timeout', async () => {
    const queryRaw = vi.fn().mockReturnValue(new Promise(() => {}));
    const indicator = createIndicator(queryRaw);

    const result = indicator.isHealthy('database');
    await vi.advanceTimersByTimeAsync(1_500);

    await expect(result).resolves.toEqual({ database: { status: 'down' } });
  });

  it('caches the timeout result for the cache window', async () => {
    const queryRaw = vi.fn().mockReturnValue(new Promise(() => {}));
    const indicator = createIndicator(queryRaw);

    const first = indicator.isHealthy('database');
    await vi.advanceTimersByTimeAsync(1_500);
    await first;
    const second = await indicator.isHealthy('database');

    expect(second).toEqual({ database: { status: 'down' } });
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });
});
