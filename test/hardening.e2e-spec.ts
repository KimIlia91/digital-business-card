import { readFileSync } from 'node:fs';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import {
  buildSchema,
  getIntrospectionQuery,
  lexicographicSortSchema,
  printSchema,
} from 'graphql';
import request from 'supertest';
import { vi } from 'vitest';
import { profileData } from '../src/database/seed/data/profile.data.js';
import { ProfileRepository } from '../src/modules/profile/profile.repository.js';
import { startTestApi, type TestApi } from './setup/test-api.js';

const INTROSPECTION_QUERY = getIntrospectionQuery({
  schemaDescription: true,
  specifiedByUrl: true,
});

const normalizeSchema = (schema: Parameters<typeof printSchema>[0]) =>
  printSchema(lexicographicSortSchema(schema));

describe('Production hardening (e2e)', () => {
  let api: TestApi;

  beforeAll(async () => {
    api = await startTestApi();
    await api.seed(profileData, true);
  });

  afterAll(async () => {
    await api?.close();
  });

  it('hides internal error details from clients and returns the request id', async () => {
    const spy = vi
      .spyOn(api.app.get(ProfileRepository), 'findOwner')
      .mockRejectedValueOnce(new Error('connect ECONNREFUSED 10.0.0.5:5432'));

    const response = await api
      .post('{ profile { name } }')
      .set('x-request-id', 'e2e-masking')
      .expect(200);
    spy.mockRestore();

    expect(response.headers['x-request-id']).toBe('e2e-masking');
    expect(response.body.errors).toEqual([
      {
        message: 'Internal server error',
        locations: [{ line: 1, column: 3 }],
        path: ['profile'],
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      },
    ]);
    expect(response.text).not.toContain('10.0.0.5');
  });

  it('sends security and caching headers and a fresh request id', async () => {
    const response = await api
      .post('{ profile { name } }')
      .set('x-request-id', 'not a safe id!')
      .expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['strict-transport-security']).toContain('max-age=');
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.headers['cache-control']).toBe('max-age=60, public');
  });

  it('rejects operations above the complexity limit but serves the Sandbox introspection', async () => {
    const aliases = Array.from(
      { length: 300 },
      (_, i) => `a${i}: profile { name }`,
    ).join(' ');

    const response = await api.post(`{ ${aliases} }`).expect(400);
    expect(response.body.errors[0].extensions.code).toBe('QUERY_TOO_COMPLEX');

    const introspection = await api.graphql<{ __schema: { types: unknown[] } }>(
      INTROSPECTION_QUERY,
    );
    expect(introspection.__schema.types.length).toBeGreaterThan(0);
  });

  it('serves Apollo Sandbox on /graphql and redirects / to it', async () => {
    const page = await request(api.app.getHttpServer())
      .get('/graphql')
      .set('accept', 'text/html')
      .expect(200);
    expect(page.text).toContain('embeddable-sandbox');

    await request(api.app.getHttpServer())
      .get('/')
      .expect(302)
      .expect('location', '/graphql');
  });

  it('exposes liveness and readiness probes', async () => {
    await request(api.app.getHttpServer()).get('/health/live').expect(200);
    const ready = await request(api.app.getHttpServer())
      .get('/health/ready')
      .expect(200);
    expect(ready.body.info.database.status).toBe('up');
  });

  it('rejects a request body above the JSON limit', async () => {
    const response = await api
      .post(`{ profile { name } }${' '.repeat(17 * 1024)}`)
      .expect(413);

    expect(response.body.errors[0].extensions.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('ignores X-Forwarded-For when no proxy is trusted', async () => {
    const first = await api
      .post('{ profile { name } }')
      .set('x-forwarded-for', '203.0.113.10')
      .expect(200);
    const second = await api
      .post('{ profile { name } }')
      .set('x-forwarded-for', '203.0.113.11')
      .expect(200);

    expect(Number(second.headers['x-ratelimit-remaining'])).toBeLessThan(
      Number(first.headers['x-ratelimit-remaining']),
    );
  });

  it('has a committed schema.gql that matches the code', () => {
    const committed = buildSchema(readFileSync('schema.gql', 'utf8'));

    expect(normalizeSchema(api.app.get(GraphQLSchemaHost).schema)).toBe(
      normalizeSchema(committed),
    );
  });
});
