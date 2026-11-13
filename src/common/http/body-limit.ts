import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/** The sample query is under 1 KB and Sandbox introspection about 4 KB; Express defaults to 100 KB. */
export const JSON_BODY_LIMIT = '16kb';

const logger = new Logger('BodyLimit');

function isBodyTooLarge(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.too.large'
  );
}

/**
 * Answers an oversized body in the GraphQL error shape. It runs after the rate
 * limiter, so oversized requests are still counted. Other errors pass through.
 */
export function bodyLimitErrorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!isBodyTooLarge(error)) {
    next(error);
    return;
  }

  logger.warn('Request body is too large', { requestId: req.id });
  res.status(413).json({
    errors: [
      {
        message: 'Request body is too large',
        extensions: { code: 'PAYLOAD_TOO_LARGE' },
      },
    ],
  });
}
