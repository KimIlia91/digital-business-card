import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { createAppLogger } from './common/logging/app-logger.js';
import type { Env } from './config/env.schema.js';

/** `bufferLogs` keeps bootstrap messages in the production (JSON) format until the logger is installed. */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  app.useLogger(
    createAppLogger(
      config.get('LOG_LEVEL', { infer: true }),
      config.get('NODE_ENV', { infer: true }) === 'production',
    ),
  );

  configureApp(app);

  const port = config.get('PORT', { infer: true });
  await app.listen(port, '0.0.0.0');
  Logger.log(
    'GraphQL API and Apollo Sandbox are ready',
    { url: `http://localhost:${port}/graphql` },
    'Bootstrap',
  );
}

await bootstrap();
