import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ThrottlerStorage } from '@nestjs/throttler';
import {
  JSON_BODY_LIMIT,
  bodyLimitErrorHandler,
} from './common/http/body-limit.js';
import { createRateLimitMiddleware } from './common/http/rate-limit.js';
import { requestIdMiddleware } from './common/http/request-id.js';
import type { Env } from './config/env.schema.js';

const GRAPHQL_PATH = '/graphql';

/**
 * `trust proxy` keeps the per-IP rate limit working behind a reverse proxy. The
 * CSP header is off because Apollo's landing page ships its own nonce-based CSP.
 * Every request to the GraphQL endpoint is rate limited here, before Apollo.
 * Must run before `app.init()`, so the JSON parser replaces Nest's default one.
 * Shared with the e2e tests.
 */
export function configureApp(app: NestExpressApplication): void {
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  const trustedProxyHops = config.get('TRUST_PROXY', { infer: true });

  app.set('trust proxy', trustedProxyHops);

  if (
    config.get('NODE_ENV', { infer: true }) === 'production' &&
    trustedProxyHops === 0
  ) {
    new Logger('AppSetup').warn(
      'TRUST_PROXY is 0: no proxy is trusted, so behind a reverse proxy every visitor shares one rate-limit bucket',
    );
  }

  app.useSecurityHeaders({
    contentSecurityPolicy: false,
  });

  app.enableCors({
    origin: config.get('CORS_ORIGINS', { infer: true }),
    methods: ['GET', 'POST'],
    maxAge: 86_400,
  });

  app.use(requestIdMiddleware);

  app.use(
    GRAPHQL_PATH,
    createRateLimitMiddleware(app.get(ThrottlerStorage), {
      ttlMs: config.get('RATE_LIMIT_TTL_MS', { infer: true }),
      limit: config.get('RATE_LIMIT_MAX', { infer: true }),
    }),
  );

  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });
  app.use(GRAPHQL_PATH, bodyLimitErrorHandler);

  app.enableShutdownHooks();
}
