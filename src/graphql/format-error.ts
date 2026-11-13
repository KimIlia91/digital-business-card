import {
  ApolloServerErrorCode,
  unwrapResolverError,
} from '@apollo/server/errors';
import { HttpException, HttpStatus } from '@nestjs/common';
import type { GraphQLFormattedError } from 'graphql';

export const INTERNAL_ERROR_MESSAGE = 'Internal server error';

const HTTP_ERROR_CODES: Partial<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: ApolloServerErrorCode.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHENTICATED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.UNPROCESSABLE_ENTITY]: ApolloServerErrorCode.BAD_USER_INPUT,
  [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
};

/**
 * Intentional errors keep their message and get a stable `extensions.code`.
 * Anything else is masked so hostnames, SQL and stack traces never reach a
 * public client; `exposeInternalErrors` keeps them for local development.
 */
export function createFormatError(exposeInternalErrors: boolean) {
  return (
    formatted: GraphQLFormattedError,
    error: unknown,
  ): GraphQLFormattedError => {
    const original = unwrapResolverError(error);
    if (original instanceof HttpException) {
      const code = HTTP_ERROR_CODES[original.getStatus()];
      if (code) {
        return {
          message: original.message,
          locations: formatted.locations,
          path: formatted.path,
          extensions: { code },
        };
      }
    }

    const isInternal =
      formatted.extensions?.code ===
      ApolloServerErrorCode.INTERNAL_SERVER_ERROR;
    if (!isInternal || exposeInternalErrors) {
      return formatted;
    }
    return {
      message: INTERNAL_ERROR_MESSAGE,
      locations: formatted.locations,
      path: formatted.path,
      extensions: { code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR },
    };
  };
}
