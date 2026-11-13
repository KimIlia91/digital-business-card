import {
  CARD_FIELDS,
  cardOfSize,
  fetchCard,
  type Card,
} from './fixtures/cards.js';
import { startTestApi, type TestApi } from './setup/test-api.js';

describe('Nested data loading (e2e)', () => {
  let api: TestApi;

  beforeAll(async () => {
    api = await startTestApi();
  });

  afterAll(async () => {
    await api?.close();
  });

  it('delivers batched rows to the right parent, across profiles in one request', async () => {
    await api.seed(cardOfSize('left', 3));
    await api.seed(cardOfSize('right', 3));

    const data = await api.graphql<{ left: Card; right: Card }>(`
      {
        left: profile(slug: "left") {
          ...CardFields
        }
        right: profile(slug: "right") {
          ...CardFields
        }
      }
      ${CARD_FIELDS}
    `);

    for (const side of ['left', 'right'] as const) {
      const card = data[side];
      expect(card.skills).toHaveLength(3);
      expect(card.experience).toHaveLength(3);
      expect(card.projects).toHaveLength(3);
      expect(card.skills.every((s) => s.name.startsWith(`${side} `))).toBe(
        true,
      );
      for (const position of card.experience) {
        const index = position.company.split(' ').pop();
        expect(position.technologies).toEqual([
          { name: `${side} skill ${index}` },
        ]);
      }
      for (const project of card.projects) {
        const index = project.name.split(' ').pop();
        expect(project.technologies).toEqual([
          { name: `${side} skill ${index}` },
        ]);
      }
    }
  });

  it('uses a constant number of SQL queries regardless of data size (no N+1)', async () => {
    await api.seed(cardOfSize('load-1', 1));
    await api.seed(cardOfSize('load-25', 25));

    const small = await api.countSqlQueries(() => fetchCard(api, 'load-1'));
    const large = await api.countSqlQueries(() => fetchCard(api, 'load-25'));

    expect(small.count).toBeGreaterThan(0);
    expect(large.result.projects.length).toBe(25);
    expect(large.count).toBe(small.count);
    expect(large.count).toBeLessThanOrEqual(10);
  });
});
