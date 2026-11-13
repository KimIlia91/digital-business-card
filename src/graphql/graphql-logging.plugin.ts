import type {
  ApolloServerPlugin,
  GraphQLRequestContext,
  GraphQLRequestListener,
} from '@apollo/server';
import { unwrapResolverError } from '@apollo/server/errors';
import { HttpException, Logger } from '@nestjs/common';
import { Plugin } from '@nestjs/apollo';
import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../common/graphql/graphql-context.js';
import { errorDetails } from '../common/logging/error-details.js';

/** Sandbox polls the schema; logging every poll would drown real traffic. */
const INTROSPECTION_OPERATION = 'IntrospectionQuery';

/** The operation name is client-controlled, so it is cut before it reaches the logs. */
const MAX_LOGGED_OPERATION_NAME_LENGTH = 64;

const loggedOperationName = (operationName: string | null | undefined) =>
  operationName?.slice(0, MAX_LOGGED_OPERATION_NAME_LENGTH) ?? null;

@Plugin()
export class GraphQLLoggingPlugin implements ApolloServerPlugin<GraphQLContext> {
  private readonly logger = new Logger('GraphQL');

  async requestDidStart({
    contextValue,
  }: GraphQLRequestContext<GraphQLContext>): Promise<
    GraphQLRequestListener<GraphQLContext>
  > {
    const startedAt = performance.now();
    const { requestId } = contextValue;
    const logger = this.logger;

    return {
      async didEncounterErrors({ errors, operationName }) {
        for (const error of errors) {
          const original = unwrapResolverError(error);
          if (
            original instanceof GraphQLError ||
            original instanceof HttpException
          ) {
            continue;
          }
          logger.error('Unexpected error while executing an operation', {
            requestId,
            operationName: loggedOperationName(operationName),
            path: error.path?.join('.') ?? null,
            ...errorDetails(original),
          });
        }
      },

      async willSendResponse({ operationName, errors }) {
        const entry = {
          requestId,
          operationName: loggedOperationName(operationName),
          durationMs: Math.round(performance.now() - startedAt),
          errors: errors?.length ?? 0,
        };
        if (operationName === INTROSPECTION_OPERATION) {
          logger.debug('GraphQL operation', entry);
        } else {
          logger.log('GraphQL operation', entry);
        }
      },
    };
  }
}
