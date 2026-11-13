import { profileData } from '../src/database/seed/data/profile.data.js';
import { EXAMPLE_QUERY, fetchCard, timelineCard } from './fixtures/cards.js';
import { startTestApi, type TestApi } from './setup/test-api.js';

describe('Business card queries (e2e)', () => {
  let api: TestApi;

  beforeAll(async () => {
    api = await startTestApi();
    await api.seed(profileData, true);
    await api.seed(timelineCard);
  });

  afterAll(async () => {
    await api?.close();
  });

  it('answers the example query from the assignment with the owner card', async () => {
    const { profile } = await api.graphql<{
      profile: {
        name: string;
        skills: unknown[];
        experience: unknown[];
        projects: unknown[];
      };
    }>(EXAMPLE_QUERY);

    expect(profile.name).toBe(profileData.name);
    expect(profile.skills).toHaveLength(profileData.skills.length);
    expect(profile.experience).toHaveLength(profileData.experience.length);
    expect(profile.projects).toHaveLength(profileData.projects.length);
  });

  it('finds a profile by a slug in any case and returns null for an unknown one', async () => {
    expect((await fetchCard(api, '  TimeLine ')).slug).toBe('timeline');

    const { profile } = await api.graphql<{ profile: null }>(
      '{ profile(slug: "nobody") { slug } }',
    );
    expect(profile).toBeNull();
  });

  it('orders the work history (current first) and serializes periods as dates', async () => {
    const { experience } = await fetchCard(api, 'timeline');

    expect(
      experience.map(({ company, startDate, endDate, isCurrent }) => ({
        company,
        startDate,
        endDate,
        isCurrent,
      })),
    ).toEqual([
      {
        company: 'Current',
        startDate: '2022-06-01',
        endDate: null,
        isCurrent: true,
      },
      {
        company: 'Contract',
        startDate: '2023-01-01',
        endDate: '2099-12-31',
        isCurrent: true,
      },
      {
        company: 'Past',
        startDate: '2015-03-01',
        endDate: '2018-02-28',
        isCurrent: false,
      },
    ]);
    expect(experience[2]?.achievements).toEqual(['Shipped v1']);
  });

  it('keeps the order of the data file for links, skills and projects', async () => {
    const card = await fetchCard(api, 'timeline');

    expect(card.links.map((link) => link.kind)).toEqual(['GITHUB', 'EMAIL']);
    expect(card.skills.map((skill) => skill.name)).toEqual([
      'Go',
      'SQL',
      'Vitest',
    ]);
    expect(card.projects.map((project) => project.name)).toEqual([
      'Second alphabetically',
      'First alphabetically',
    ]);
  });

  it('filters skills by category', async () => {
    const { profile } = await api.graphql<{
      profile: { skills: { name: string }[] };
    }>('{ profile(slug: "timeline") { skills(category: DATABASE) { name } } }');

    expect(profile.skills).toEqual([{ name: 'SQL' }]);
  });
});
