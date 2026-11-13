import { Logger } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import type { NextFunction, Request, Response } from 'express';
import { clientKey } from './client-key.js';

export interface RateLimitOptions {
  ttlMs: number;
  limit: number;
}

const THROTTLER_NAME = 'graphql';
const NO_BLOCK_DURATION_MS = 0;
const MAX_TRACKED_BLOCKED_CLIENTS = 1024;

const logger = new Logger('RateLimit');

/**
 * A blocked client keeps sending requests, so only the first block per window
 * is logged. The map is cleared when it outgrows its cap: the cost is one extra
 * log line per client, and memory stays bounded.
 */
function shouldWarn(
  warnedUntil: Map<string, number>,
  key: string,
  ttlMs: number,
): boolean {
  const now = Date.now();
  if ((warnedUntil.get(key) ?? 0) > now) {
    return false;
  }
  if (warnedUntil.size >= MAX_TRACKED_BLOCKED_CLIENTS) {
    warnedUntil.clear();
  }
  warnedUntil.set(key, now + ttlMs);
  return true;
}

/**
 * Runs at the HTTP layer so introspection and operations that fail parsing or
 * validation are counted too; a Nest guard sees resolver fields only.
 * Requests without a resolvable IP share one bucket.
 */
export function createRateLimitMiddleware(
  storage: ThrottlerStorage,
  { ttlMs, limit }: RateLimitOptions,
) {
  const warnedUntil = new Map<string, number>();

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const key = `${THROTTLER_NAME}:${clientKey(req.ip)}`;
      const { totalHits, timeToExpire, isBlocked, timeToBlockExpire } =
        await storage.increment(
          key,
          ttlMs,
          limit,
          NO_BLOCK_DURATION_MS,
          THROTTLER_NAME,
        );

      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - totalHits));
      res.setHeader('X-RateLimit-Reset', timeToExpire);

      if (!isBlocked) {
        next();
        return;
      }

      if (shouldWarn(warnedUntil, key, ttlMs)) {
        logger.warn('Rate limit exceeded', {
          requestId: req.id,
          client: key,
          limit,
        });
      }

      res.setHeader('Retry-After', Math.max(1, timeToBlockExpire));
      res.status(429).json({
        errors: [
          {
            message: 'Too many requests, please retry later',
            extensions: { code: 'TOO_MANY_REQUESTS' },
          },
        ],
      });
    } catch (error) {
      next(error);
    }
  };
}
