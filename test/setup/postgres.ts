import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { TestProject } from 'vitest/node';

const PRISMA_CLI = resolve('node_modules/prisma/build/index.js');

declare module 'vitest' {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

/** One PostgreSQL container for the whole run; every spec file shares it. */
export default async function setup(project: TestProject) {
  const container = await new PostgreSqlContainer('postgres:18-alpine').start();
  const databaseUrl = container.getConnectionUri();

  try {
    execFileSync(process.execPath, [PRISMA_CLI, 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'pipe',
    });
  } catch (error) {
    await container.stop();
    throw error;
  }

  project.provide('databaseUrl', databaseUrl);

  return async () => {
    await container.stop();
  };
}
