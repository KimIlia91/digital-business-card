import type { GraphQLRequestContext } from '@apollo/server';
import { Logger } from '@nestjs/common';
import type { GraphQLContext } from '../common/graphql/graphql-context.js';
import { GraphQLLoggingPlugin } from './graphql-logging.plugin.js';

async function respond(operationName: string | null) {
  const listener = await new GraphQLLoggingPlugin().requestDidStart({
    contextValue: { requestId: 'req-1' },
  } as GraphQLRequestContext<GraphQLContext>);
  await listener.willSendResponse?.({
    operationName,
    errors: undefined,
  } as never);
}

describe('GraphQLLoggingPlugin', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('truncates a client-controlled operation name in the log entry', async () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});

    await respond('A'.repeat(5_000));

    const entry = log.mock.calls[0]?.[1] as { operationName: string };
    expect(entry.operationName).toBe('A'.repeat(64));
  });

  it('keeps a short name intact and logs null for an anonymous operation', async () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});

    await respond('BusinessCard');
    await respond(null);

    expect(log.mock.calls[0]?.[1]).toMatchObject({
      operationName: 'BusinessCard',
    });
    expect(log.mock.calls[1]?.[1]).toMatchObject({ operationName: null });
  });
});
