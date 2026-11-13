import { getIntrospectionQuery } from 'graphql';
import request from 'supertest';
import { profileData } from '../src/database/seed/data/profile.data.js';
import { startTestApi, type TestApi } from './setup/test-api.js';

const RATE_LIMIT_MAX = 60;

const INTROSPECTION_QUERY = getIntrospectionQuery({
  schemaDescription: true,
  specifiedByUrl: true,
});

let nextClient = 1;
const clientIp = () => `198.51.100.${nextClient++}`;

describe('Rate limiting (e2e)', () => {
  let api: TestApi;

  beforeAll(async () => {
    api = await startTestApi({
      env: { RATE_LIMIT_MAX: String(RATE_LIMIT_MAX), TRUST_PROXY: '1' },
    });
    await api.seed(profileData, true);
  });

  afterAll(async () => {
    await api?.close();
  });

  it('rate-limits a client that sends too many operations with 429 and Retry-After', async () => {
    const client = clientIp();
    let limited: request.Response | undefined;
    for (let i = 0; i <= RATE_LIMIT_MAX && !limited; i++) {
      const response = await api
        .post('{ profile { slug } }')
        .set('x-forwarded-for', client);
      if (response.status === 429) {
        limited = response;
      } else {
        expect(response.status).toBe(200);
        expect(response.headers['x-ratelimit-limit']).toBe(
          String(RATE_LIMIT_MAX),
        );
      }
    }

    expect(limited?.body.errors?.[0]?.extensions.code).toBe(
      'TOO_MANY_REQUESTS',
    );
    expect(Number(limited?.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('rate-limits an introspection flood, which has no resolver', async () => {
    const client = clientIp();
    const statuses: number[] = [];
    for (let i = 0; i <= RATE_LIMIT_MAX; i++) {
      const response = await api
        .post(INTROSPECTION_QUERY)
        .set('x-forwarded-for', client);
      statuses.push(response.status);
    }

    expect(statuses.slice(0, RATE_LIMIT_MAX).every((s) => s === 200)).toBe(
      true,
    );
    expect(statuses.at(-1)).toBe(429);
  });

  it('counts malformed and invalid operations against the limit too', async () => {
    const client = clientIp();
    const statuses: number[] = [];
    for (let i = 0; i <= RATE_LIMIT_MAX; i++) {
      const response = await api
        .post(i % 2 ? '{ nope }' : '{ profile {')
        .set('x-forwarded-for', client);
      statuses.push(response.status);
    }

    expect(statuses.at(-1)).toBe(429);
  });

  it('limits each client separately behind a proxy', async () => {
    const abuser = clientIp();
    for (let i = 0; i <= RATE_LIMIT_MAX; i++) {
      await api.post('{ profile { slug } }').set('x-forwarded-for', abuser);
    }
    await api
      .post('{ profile { slug } }')
      .set('x-forwarded-for', abuser)
      .expect(429);

    await api
      .post('{ profile { slug } }')
      .set('x-forwarded-for', clientIp())
      .expect(200);
  });

  it('keeps one bucket for a whole IPv6 /64', async () => {
    let limited: request.Response | undefined;
    for (let i = 1; i <= RATE_LIMIT_MAX + 1 && !limited; i++) {
      const response = await api
        .post('{ profile { slug } }')
        .set('x-forwarded-for', `2001:db8:1:2::${i.toString(16)}`);
      if (response.status === 429) {
        limited = response;
      }
    }

    expect(limited?.body.errors?.[0]?.extensions.code).toBe(
      'TOO_MANY_REQUESTS',
    );

    await api
      .post('{ profile { slug } }')
      .set('x-forwarded-for', '2001:db8:1:3::1')
      .expect(200);
  });

  it('does not rate limit the health probes', async () => {
    const client = clientIp();
    for (let i = 0; i <= RATE_LIMIT_MAX + 5; i++) {
      await request(api.app.getHttpServer())
        .get('/health/live')
        .set('x-forwarded-for', client)
        .expect(200);
    }
  });
});
