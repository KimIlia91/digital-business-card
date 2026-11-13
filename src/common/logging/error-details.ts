import { inspect } from 'node:util';

export interface ErrorDetails {
  error: string;
  name?: string;
  code?: string;
  causes?: string[];
  stack?: string;
}

const MAX_CAUSES = 5;

function describe(value: unknown): string {
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  return typeof value === 'string' ? value : inspect(value, { depth: 2 });
}

/** Driver and ORM errors often carry the real reason only in `cause` or `code`, so both are included. */
export function errorDetails(error: unknown): ErrorDetails {
  if (!(error instanceof Error)) {
    return { error: describe(error) };
  }
  const causes: string[] = [];
  let cause: unknown = error.cause;
  while (cause !== undefined && cause !== null && causes.length < MAX_CAUSES) {
    causes.push(describe(cause));
    cause = cause instanceof Error ? cause.cause : undefined;
  }
  const code =
    'code' in error && typeof error.code === 'string' ? error.code : undefined;
  return {
    error: error.message.trim(),
    name: error.name,
    ...(code ? { code } : {}),
    ...(causes.length > 0 ? { causes } : {}),
    ...(error.stack ? { stack: error.stack } : {}),
  };
}
