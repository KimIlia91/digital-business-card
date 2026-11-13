import { type ArgumentsHost, Catch } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { GqlContextType } from '@nestjs/graphql';

/**
 * GraphQL errors go back to Apollo untouched: formatError and
 * GraphQLLoggingPlugin handle them, so Nest does not log them a second time.
 */
@Catch()
export class AppExceptionFilter extends BaseExceptionFilter {
  override catch(exception: unknown, host: ArgumentsHost): unknown {
    if (host.getType<GqlContextType>() === 'graphql') {
      return exception;
    }
    return super.catch(exception, host);
  }
}
