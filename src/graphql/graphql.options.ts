import { join } from 'node:path';
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import type { Request, Response } from 'express';
import { LoaderRegistry } from '../common/dataloader/loader-registry.js';
import type { GraphQLContext } from '../common/graphql/graphql-context.js';
import { LocalDateScalar } from '../common/graphql/local-date.scalar.js';
import type { Env } from '../config/env.schema.js';
import { createFormatError } from './format-error.js';

export const SANDBOX_EXAMPLE_QUERY = `query BusinessCard {
  profile {
    name
    headline
    description
    location
    links { kind label url }
    skills { name category }
    experience {
      company
      position
      startDate
      endDate
      isCurrent
      achievements
      technologies { name }
    }
    projects {
      name
      description
      url
      repositoryUrl
      technologies { name }
    }
  }
}
`;

/** The card changes only on deploy, so responses may be cached briefly. */
const CACHE_MAX_AGE_SECONDS = 60;

/**
 * Introspection stays on in production because the embedded Sandbox needs it.
 * `autoTransformHttpErrors` is off so only format-error.ts shapes errors (Nest
 * would report a 429 as INTERNAL_SERVER_ERROR).
 */
export function createGraphQLOptions(
  nodeEnv: Env['NODE_ENV'],
): ApolloDriverConfig {
  const isDevelopment = nodeEnv === 'development';

  return {
    driver: ApolloDriver,
    autoSchemaFile: isDevelopment ? join(process.cwd(), 'schema.gql') : true,
    sortSchema: true,
    resolvers: { LocalDate: LocalDateScalar },
    graphiql: false,
    introspection: true,
    plugins: [
      ApolloServerPluginLandingPageLocalDefault({
        embed: true,
        includeCookies: false,
        document: SANDBOX_EXAMPLE_QUERY,
      }),
      ApolloServerPluginCacheControl({ defaultMaxAge: CACHE_MAX_AGE_SECONDS }),
    ],
    csrfPrevention: true,
    allowBatchedHttpRequests: false,
    includeStacktraceInErrorResponses: isDevelopment,
    autoTransformHttpErrors: false,
    formatError: createFormatError(isDevelopment),
    context: ({
      req,
      res,
    }: {
      req: Request;
      res: Response;
    }): GraphQLContext => ({
      req,
      res,
      requestId: req.id,
      loaders: new LoaderRegistry(),
    }),
  };
}
