import { Kind } from 'graphql';
import { LocalDateScalar } from './local-date.scalar.js';

describe('LocalDateScalar', () => {
  it('serializes a date column value as YYYY-MM-DD', () => {
    expect(
      LocalDateScalar.serialize(new Date('2021-03-01T00:00:00.000Z')),
    ).toBe('2021-03-01');
  });

  it('parses variables and literals into UTC midnight', () => {
    const expected = new Date('2024-02-29T00:00:00.000Z');

    expect(LocalDateScalar.parseValue('2024-02-29')).toEqual(expected);
    expect(
      LocalDateScalar.parseLiteral({ kind: Kind.STRING, value: '2024-02-29' }),
    ).toEqual(expected);
  });

  it.each(['2023-02-29', '2024-13-01', '01.03.2021', '2021-03-01T10:00:00Z'])(
    'rejects %s',
    (value) => {
      expect(() => LocalDateScalar.parseValue(value)).toThrow();
    },
  );

  it('rejects non-string literals', () => {
    expect(() =>
      LocalDateScalar.parseLiteral({ kind: Kind.INT, value: '20210301' }),
    ).toThrow();
  });
});
