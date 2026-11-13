import type {
  ApolloServerPlugin,
  GraphQLRequestListener,
} from '@apollo/server';
import { Plugin } from '@nestjs/apollo';
import { ConfigService } from '@nestjs/config';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { getComplexity, simpleEstimator } from 'graphql-query-complexity';
import type { GraphQLContext } from '../common/graphql/graphql-context.js';
import type { Env } from '../config/env.schema.js';

export const QUERY_TOO_COMPLEX = 'QUERY_TOO_COMPLEX';

/**
 * The library throws a bare `GraphQLError` (e.g. its node cap) with no code or
 * status, which Apollo would report as a masked 500; the client sent the query.
 */
function queryTooComplex(
  message: string,
  extensions: Record<string, unknown> = {},
) {
  return new GraphQLError(message, {
    extensions: {
      ...extensions,
      code: QUERY_TOO_COMPLEX,
      http: { status: 400 },
    },
  });
}

/**
 * Aliases are counted separately, so a tiny request cannot be amplified into
 * megabytes of output. The schema has no cycles, so depth is bounded on its own.
 */
@Plugin()
export class QueryComplexityPlugin implements ApolloServerPlugin<GraphQLContext> {
  private readonly maxComplexity: number;

  constructor(
    private readonly schemaHost: GraphQLSchemaHost,
    config: ConfigService<Env, true>,
  ) {
    this.maxComplexity = config.get('GRAPHQL_MAX_COMPLEXITY', { infer: true });
  }

  async requestDidStart(): Promise<GraphQLRequestListener<GraphQLContext>> {
    const { schema } = this.schemaHost;
    const maxComplexity = this.maxComplexity;

    return {
      async didResolveOperation({ request, document }) {
        let complexity: number;
        try {
          complexity = getComplexity({
            schema,
            query: document,
            operationName: request.operationName ?? undefined,
            variables: request.variables ?? {},
            estimators: [simpleEstimator({ defaultComplexity: 1 })],
          });
        } catch (error) {
          if (error instanceof GraphQLError) {
            throw queryTooComplex(error.message);
          }
          throw error;
        }
        if (complexity > maxComplexity) {
          throw queryTooComplex(
            `Query is too complex: ${complexity}. Maximum allowed complexity: ${maxComplexity}`,
            { complexity, maxComplexity },
          );
        }
      },
    };
  }
}
