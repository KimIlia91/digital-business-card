import { GraphQLError, GraphQLScalarType, Kind } from 'graphql';

const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseLocalDate(value: unknown): Date {
  if (typeof value !== 'string' || !LOCAL_DATE.test(value)) {
    throw new GraphQLError('LocalDate must be a string in YYYY-MM-DD format');
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new GraphQLError(`Invalid LocalDate: ${value}`);
  }
  return date;
}

/**
 * Calendar date (`YYYY-MM-DD`) rather than DateTime, to avoid time-zone bugs on
 * clients. Prisma returns `date` columns at UTC midnight, so UTC serialization is lossless.
 */
export const LocalDateScalar = new GraphQLScalarType<Date, string>({
  name: 'LocalDate',
  description: 'Calendar date without time, ISO 8601 (YYYY-MM-DD)',
  serialize(value) {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new GraphQLError('LocalDate can only serialize Date values');
    }
    return value.toISOString().slice(0, 10);
  },
  parseValue: parseLocalDate,
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError('LocalDate must be a string in YYYY-MM-DD format');
    }
    return parseLocalDate(ast.value);
  },
});
