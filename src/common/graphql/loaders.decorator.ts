import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { LoaderRegistry } from '../dataloader/loader-registry.js';
import type { GraphQLContext } from './graphql-context.js';

export const Loaders = createParamDecorator(
  (_data: unknown, context: ExecutionContext): LoaderRegistry =>
    GqlExecutionContext.create(context).getContext<GraphQLContext>().loaders,
);
