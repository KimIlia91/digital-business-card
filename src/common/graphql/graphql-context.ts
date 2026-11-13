import type { Request, Response } from 'express';
import type { LoaderRegistry } from '../dataloader/loader-registry.js';

export interface GraphQLContext {
  req: Request;
  /** Needed by the rate limiter to set its response headers. */
  res: Response;
  /** Same value as the `x-request-id` response header. */
  requestId: string;
  loaders: LoaderRegistry;
}
