import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { bodyLimitErrorHandler } from './body-limit.js';

function createResponse() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status: vi.fn((code: number) => {
      res.statusCode = code;
      return res;
    }),
    json: vi.fn((body: unknown) => {
      res.body = body;
      return res;
    }),
  };
  return res;
}

const run = (error: unknown) => {
  const res = createResponse();
  const next: NextFunction = vi.fn();
  bodyLimitErrorHandler(
    error,
    { id: 'req-1' } as Request,
    res as unknown as Response,
    next,
  );
  return { res, next };
};

describe('bodyLimitErrorHandler', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('answers 413 with a GraphQL-shaped error when the body is too large', () => {
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const { res, next } = run({ type: 'entity.too.large' });

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(413);
    expect(res.body).toEqual({
      errors: [
        {
          message: 'Request body is too large',
          extensions: { code: 'PAYLOAD_TOO_LARGE' },
        },
      ],
    });
  });

  it('logs one warning carrying the request id', () => {
    const warn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    run({ type: 'entity.too.large' });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ requestId: 'req-1' }),
    );
  });

  it('passes any other error to the next handler', () => {
    const error = { type: 'entity.parse.failed' };
    const { res, next } = run(error);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
