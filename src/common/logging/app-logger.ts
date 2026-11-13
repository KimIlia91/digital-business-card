import { ConsoleLogger, type LogLevel } from '@nestjs/common';

/** From least to most verbose: a threshold enables itself and everything before it. */
const LEVELS = [
  'fatal',
  'error',
  'warn',
  'log',
  'debug',
  'verbose',
] as const satisfies readonly LogLevel[];

export type LogThreshold = (typeof LEVELS)[number];

export function logLevelsUpTo(threshold: LogThreshold): LogLevel[] {
  return LEVELS.slice(0, LEVELS.indexOf(threshold) + 1);
}

/** One JSON object per line in production (for log collectors), colored text elsewhere. */
export function createAppLogger(
  threshold: LogThreshold,
  json: boolean,
): ConsoleLogger {
  return new ConsoleLogger({ json, logLevels: logLevelsUpTo(threshold) });
}
