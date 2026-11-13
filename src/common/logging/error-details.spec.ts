import { logLevelsUpTo } from './app-logger.js';
import { errorDetails } from './error-details.js';

describe('errorDetails', () => {
  it('unrolls the cause chain and keeps the error code', () => {
    const root = Object.assign(new Error('connect ECONNREFUSED'), {
      code: 'ECONNREFUSED',
    });
    const error = Object.assign(new Error('Invalid query', { cause: root }), {
      code: 'P1001',
    });

    expect(errorDetails(error)).toMatchObject({
      error: 'Invalid query',
      code: 'P1001',
      causes: ['Error: connect ECONNREFUSED'],
    });
  });

  it('describes values that are not errors', () => {
    expect(errorDetails('boom')).toEqual({ error: 'boom' });
    expect(errorDetails({ reason: 'x' })).toEqual({ error: "{ reason: 'x' }" });
  });
});

describe('logLevelsUpTo', () => {
  it('enables the threshold and every more severe level', () => {
    expect(logLevelsUpTo('warn')).toEqual(['fatal', 'error', 'warn']);
    expect(logLevelsUpTo('verbose')).toHaveLength(6);
  });
});
