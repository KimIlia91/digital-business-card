import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema.js';
import { PrismaClient } from '../generated/prisma/client.js';
import { createPgAdapter } from './pg-adapter.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService<Env, true>) {
    super({
      adapter: createPgAdapter(
        {
          DATABASE_URL: config.get('DATABASE_URL', { infer: true }),
          DATABASE_POOL_MAX: config.get('DATABASE_POOL_MAX', { infer: true }),
          DATABASE_CONNECTION_TIMEOUT_MS: config.get(
            'DATABASE_CONNECTION_TIMEOUT_MS',
            { infer: true },
          ),
          DATABASE_STATEMENT_TIMEOUT_MS: config.get(
            'DATABASE_STATEMENT_TIMEOUT_MS',
            { infer: true },
          ),
        },
        'business-card-api',
      ),
    });
  }

  /** Connect eagerly so that a wrong DATABASE_URL fails at startup. */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
