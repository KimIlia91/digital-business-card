import { Injectable, Logger } from '@nestjs/common';
import {
  type HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { withTimeout } from '../common/async.js';
import { errorDetails } from '../common/logging/error-details.js';
import { PrismaService } from '../prisma/prisma.service.js';

const PING_TIMEOUT_MS = 1_500;
const CACHE_TTL_MS = 2_000;

/**
 * The endpoint is public: a failure is reported only as `down`, the reason (which may name hosts) is logged.
 * The ping result is cached briefly so a probe flood cannot compete with real queries for the connection pool.
 */
@Injectable()
export class DatabaseHealthIndicator {
  private readonly logger = new Logger(DatabaseHealthIndicator.name);
  private cached?: { isUp: Promise<boolean>; expiresAt: number };

  constructor(
    private readonly prisma: PrismaService,
    private readonly indicators: HealthIndicatorService,
  ) {}

  async isHealthy<Key extends string>(
    key: Key,
  ): Promise<HealthIndicatorResult<Key>> {
    const indicator = this.indicators.check(key);
    return (await this.ping()) ? indicator.up() : indicator.down();
  }

  private ping(): Promise<boolean> {
    const now = Date.now();
    if (this.cached && this.cached.expiresAt > now) {
      return this.cached.isUp;
    }
    const isUp = this.queryDatabase();
    this.cached = { isUp, expiresAt: now + CACHE_TTL_MS };
    return isUp;
  }

  private async queryDatabase(): Promise<boolean> {
    try {
      await withTimeout(this.prisma.$queryRaw`SELECT 1`, PING_TIMEOUT_MS);
      return true;
    } catch (error) {
      const { stack: _stack, ...details } = errorDetails(error);
      this.logger.warn('Database ping failed', details);
      return false;
    }
  }
}
