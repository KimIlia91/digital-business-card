import { ApolloServerErrorCode } from '@apollo/server/errors';
import { ThrottlerException } from '@nestjs/throttler';
import { GraphQLError, type GraphQLFormattedError } from 'graphql';
import { createFormatError, INTERNAL_ERROR_MESSAGE } from './format-error.js';

/** How Apollo hands a resolver error to formatError. */
const resolverError = (original: Error) =>
  new GraphQLError(original.message, {
    path: ['profile'],
    originalError: original,
  });

const formatted = (
  message: string,
  code: string = ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
): GraphQLFormattedError => ({
  message,
  path: ['profile'],
  extensions: { code, stacktrace: ['at secret.ts:1'] },
});

describe('createFormatError', () => {
  const formatError = createFormatError(false);

  it('masks unexpected errors so that internals never reach the client', () => {
    const leak = 'connect ECONNREFUSED 10.0.0.5:5432';

    const result = formatError(formatted(leak), resolverError(new Error(leak)));

    expect(result).toEqual({
      message: INTERNAL_ERROR_MESSAGE,
      path: ['profile'],
      extensions: { code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR },
    });
    expect(JSON.stringify(result)).not.toContain('10.0.0.5');
  });

  it('gives intentional HTTP errors a stable code instead of masking them', () => {
    const result = formatError(
      formatted('Too Many Requests'),
      resolverError(new ThrottlerException('Slow down')),
    );

    expect(result.message).toBe('Slow down');
    expect(result.extensions).toEqual({ code: 'TOO_MANY_REQUESTS' });
  });

  it('keeps errors that already carry a public code (validation, limits)', () => {
    const validation = formatted(
      'Cannot query field "nope" on type "Profile".',
      ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED,
    );

    expect(formatError(validation, new GraphQLError(validation.message))).toBe(
      validation,
    );
  });

  it('shows the original error in local development', () => {
    const original = formatted('connect ECONNREFUSED 10.0.0.5:5432');

    expect(
      createFormatError(true)(original, resolverError(new Error('x'))),
    ).toBe(original);
  });
});
