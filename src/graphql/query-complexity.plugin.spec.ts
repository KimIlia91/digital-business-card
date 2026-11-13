import type { ConfigService } from '@nestjs/config';
import type { GraphQLSchemaHost } from '@nestjs/graphql';
import { GraphQLError, buildSchema, parse } from 'graphql';
import type { Env } from '../config/env.schema.js';
import {
  QUERY_TOO_COMPLEX,
  QueryComplexityPlugin,
} from './query-complexity.plugin.js';

const schema = buildSchema('type Query { a: String }');
const MAX_COMPLEXITY = 5;
const LIBRARY_NODE_CAP = 10_000;

async function resolveOperation(query: string) {
  const plugin = new QueryComplexityPlugin(
    { schema } as GraphQLSchemaHost,
    {
      get: vi.fn().mockReturnValue(MAX_COMPLEXITY),
    } as unknown as ConfigService<Env, true>,
  );
  const listener = await plugin.requestDidStart();
  await listener.didResolveOperation?.({
    request: { variables: {} },
    document: parse(query),
  } as never);
}

function aliases(count: number) {
  return `{ ${Array.from({ length: count }, (_, i) => `f${i}: a`).join(' ')} }`;
}

describe('QueryComplexityPlugin', () => {
  it('lets an operation below the limit through', async () => {
    await expect(resolveOperation(aliases(MAX_COMPLEXITY))).resolves.toBe(
      undefined,
    );
  });

  it('rejects an operation above the limit as a bad request', async () => {
    const error = await resolveOperation(aliases(MAX_COMPLEXITY + 1)).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(GraphQLError);
    expect((error as GraphQLError).extensions).toMatchObject({
      code: QUERY_TOO_COMPLEX,
      complexity: MAX_COMPLEXITY + 1,
      maxComplexity: MAX_COMPLEXITY,
      http: { status: 400 },
    });
  });

  it('converts the library node cap into a bad request instead of a masked 500', async () => {
    const error = await resolveOperation(aliases(LIBRARY_NODE_CAP + 1)).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(GraphQLError);
    expect((error as GraphQLError).message).toMatch(/maximum allowed number/i);
    expect((error as GraphQLError).extensions).toMatchObject({
      code: QUERY_TOO_COMPLEX,
      http: { status: 400 },
    });
  });
});
