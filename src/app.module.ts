import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppExceptionFilter } from './common/filters/app-exception.filter.js';
import { envSchema, type Env } from './config/env.schema.js';
import { GraphQLLoggingPlugin } from './graphql/graphql-logging.plugin.js';
import { createGraphQLOptions } from './graphql/graphql.options.js';
import { QueryComplexityPlugin } from './graphql/query-complexity.plugin.js';
import { HealthModule } from './health/health.module.js';
import { ExperienceModule } from './modules/experience/experience.module.js';
import { ProfileModule } from './modules/profile/profile.module.js';
import { ProjectsModule } from './modules/projects/projects.module.js';
import { SkillsModule } from './modules/skills/skills.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: envSchema,
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        createGraphQLOptions(config.get('NODE_ENV', { infer: true })),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        throttlers: [
          {
            ttl: config.get('RATE_LIMIT_TTL_MS', { infer: true }),
            limit: config.get('RATE_LIMIT_MAX', { infer: true }),
          },
        ],
      }),
    }),
    PrismaModule,
    HealthModule,
    ProfileModule,
    SkillsModule,
    ExperienceModule,
    ProjectsModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_FILTER, useClass: AppExceptionFilter },
    QueryComplexityPlugin,
    GraphQLLoggingPlugin,
  ],
})
export class AppModule {}
