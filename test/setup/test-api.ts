import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { PrismaPg } from '@prisma/adapter-pg';
import request from 'supertest';
import { expect, inject } from 'vitest';
import { configureApp } from '../../src/app.setup.js';
import {
  profileSeedSchema,
  type ProfileSeedInput,
} from '../../src/database/seed/profile-seed.schema.js';
import { seedProfile } from '../../src/database/seed/seed-profile.js';
import { PrismaClient } from '../../src/generated/prisma/client.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

export interface TestApi {
  readonly app: NestExpressApplication;
  readonly prisma: PrismaClient<'query'>;
  seed(input: ProfileSeedInput, owner?: boolean): Promise<unknown>;
  post(query: string, variables?: Record<string, unknown>): request.Test;
  graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T>;
  countSqlQueries<T>(
    action: () => Promise<T>,
  ): Promise<{ count: number; result: T }>;
  close(): Promise<void>;
}

/**
 * `AppModule` is imported only after the environment is set: configuration is
 * validated when the module loads. The container belongs to globalSetup.
 * `NODE_ENV` is forced to `test`: in development the app rewrites `schema.gql`
 * on startup, which would make the schema comparison test compare a file with itself.
 */
export async function startTestApi(
  options: { env?: Record<string, string> } = {},
): Promise<TestApi> {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = inject('databaseUrl');
  for (const [key, value] of Object.entries(options.env ?? {})) {
    process.env[key] = value;
  }

  let sqlQueries = 0;
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    log: [{ emit: 'event', level: 'query' }],
  });

  try {
    prisma.$on('query', () => {
      sqlQueries += 1;
    });

    const { AppModule } = await import('../../src/app.module.js');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    const app = moduleRef.createNestApplication<NestExpressApplication>({
      logger: false,
    });
    configureApp(app);
    await app.init();

    const post = (query: string, variables?: Record<string, unknown>) =>
      request(app.getHttpServer()).post('/graphql').send({ query, variables });

    return {
      app,
      prisma,
      seed: (input, owner = false) =>
        seedProfile(prisma, profileSeedSchema.parse(input), { owner }),
      post,
      graphql: async <T>(
        query: string,
        variables?: Record<string, unknown>,
      ): Promise<T> => {
        const response = await post(query, variables).expect(200);
        expect(response.body.errors).toBeUndefined();
        return response.body.data as T;
      },
      countSqlQueries: async (action) => {
        sqlQueries = 0;
        const result = await action();
        return { count: sqlQueries, result };
      },
      close: async () => {
        await app.close();
        await prisma.$disconnect();
      },
    };
  } catch (error) {
    await prisma.$disconnect();
    throw error;
  }
}
